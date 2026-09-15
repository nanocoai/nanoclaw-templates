#!/usr/bin/env node
import http from 'node:http';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { createWorkspace } from './service.mjs';
import { createLocalModel, WorkspaceError } from './model.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BODY_LIMIT = 160 * 1024;
function equal(left, right) {
  return typeof left === 'string' && Buffer.byteLength(left) === Buffer.byteLength(right) && timingSafeEqual(Buffer.from(left), Buffer.from(right));
}
async function body(request) {
  if (request.headers['content-type']?.split(';')[0] !== 'application/json') throw new WorkspaceError('JSON_REQUIRED', 'Send application/json.');
  if (Number(request.headers['content-length']) > BODY_LIMIT) throw new WorkspaceError('BODY_TOO_LARGE', 'Request exceeds 160 KB.');
  const chunks = []; let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > BODY_LIMIT) throw new WorkspaceError('BODY_TOO_LARGE', 'Request exceeds 160 KB.');
    chunks.push(chunk);
  }
  try {
    const result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error();
    return result;
  } catch { throw new WorkspaceError('INVALID_JSON', 'Expected a JSON object.'); }
}

export async function startServer({ dataDir = path.join(os.homedir(), '.local', 'share', 'evidence-domino'), port = 4317, model, allowPublicRetrieval = false } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new WorkspaceError('INVALID_PORT', 'Choose a valid local port.');
  const folder = path.join(path.resolve(dataDir), '.workspace');
  await mkdir(folder, { recursive: true, mode: 0o700 });
  const lock = path.join(folder, 'server.lock');
  const token = randomBytes(32).toString('hex');
  try { await mkdir(lock, { mode: 0o700 }); }
  catch (error) {
    if (error.code === 'EEXIST') throw new WorkspaceError('WORKSPACE_IN_USE', `Another workspace may be using this data. Check ${path.join(lock, 'owner.json')}. Stop its process before removing this lock; do not remove it just because it looks old.`);
    throw error;
  }
  await writeFile(path.join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, token, createdAt: new Date().toISOString() }), { mode: 0o600, flag: 'wx' });
  let workspace;
  async function unlock() {
    const owner = JSON.parse(await readFile(path.join(lock, 'owner.json'), 'utf8'));
    if (owner.token === token) await rm(lock, { recursive: true });
  }
  try { workspace = await createWorkspace({ dataDir, model, allowPublicRetrieval }); }
  catch (error) { await unlock(); throw error; }
  let expectedHost;
  const server = http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-src 'self' blob:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    function send(status, value, type = 'application/json; charset=utf-8') {
      response.writeHead(status, { 'Content-Type': type });
      response.end(type.startsWith('application/json') ? JSON.stringify(value) : value);
    }
    try {
      if (request.headers.host !== expectedHost) throw new WorkspaceError('HOST_REJECTED', 'Open this workspace on its exact 127.0.0.1 address.');
      const origin = request.headers.origin;
      if (origin && origin !== `http://${expectedHost}`) throw new WorkspaceError('ORIGIN_REJECTED', 'Cross-origin requests are not allowed.');
      if (request.headers['sec-fetch-site'] === 'cross-site') throw new WorkspaceError('ORIGIN_REJECTED', 'Cross-site requests are not allowed.');
      const url = new URL(request.url, `http://${expectedHost}`);
      const pathname = url.pathname;
      const assets = { '/': ['index.html', 'text/html; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'] };
      if (request.method === 'GET' && Object.hasOwn(assets, pathname)) {
        const [file, type] = assets[pathname];
        return send(200, await readFile(path.join(HERE, 'public', file), 'utf8'), type);
      }
      if (!equal(request.headers['x-domino-token'], token)) throw new WorkspaceError('UNAUTHORIZED', 'Open the launch link from your terminal to unlock this workspace.');
      if (request.method === 'GET' && pathname === '/api/state') return send(200, await workspace.state());
      if (request.method === 'GET' && pathname === '/api/model') { await workspace.refreshModel(); return send(200, await workspace.state()); }
      if (request.method === 'GET' && pathname === '/api/export') {
        response.setHeader('Content-Disposition', 'attachment; filename="approved-proposal.md"');
        return send(200, await workspace.exportDocument(), 'text/markdown; charset=utf-8');
      }
      if (request.method === 'GET' && /^\/api\/document\/[a-f0-9-]+$/.test(pathname)) return send(200, await workspace.document(pathname.split('/').at(-1)));
      if (request.method === 'GET' && /^\/report\/review-[a-zA-Z0-9-]+$/.test(pathname)) {
        response.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
        return send(200, await workspace.report(pathname.split('/').at(-1)), 'text/html; charset=utf-8');
      }
      if (request.method === 'DELETE' && /^\/api\/documents\/[a-f0-9-]+$/.test(pathname)) return send(200, await workspace.removeDocument(pathname.split('/').at(-1)));
      const actions = { '/api/chat': 'chat', '/api/documents': 'addDocument', '/api/intake': 'intake', '/api/confirm': 'confirm', '/api/check': 'check', '/api/preflight': 'preflight', '/api/clear-chat': 'clearChat' };
      if (request.method === 'POST' && Object.hasOwn(actions, pathname)) return send(200, await workspace[actions[pathname]](await body(request)));
      send(404, { ok: false, error: { code: 'NOT_FOUND', message: 'Not found.' } });
    } catch (error) {
      const code = error.code ?? 'INTERNAL_ERROR';
      const status = ['UNAUTHORIZED', 'HOST_REJECTED', 'ORIGIN_REJECTED'].includes(code) ? 403 : code === 'BUSY' ? 409 : code === 'BODY_TOO_LARGE' ? 413 : 400;
      send(status, { ok: false, error: { code, message: error.message } });
    }
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  server.maxHeadersCount = 30;
  try {
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
    expectedHost = `127.0.0.1:${server.address().port}`;
  } catch (error) { await unlock(); throw error; }
  const ready = workspace.refreshModel();
  await ready;
  return {
    url: `http://${expectedHost}`, token, workspace, ready,
    async close() { await new Promise(resolve => server.close(resolve)); await unlock(); },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2); const options = {}; let modelName = 'qwen3:4b'; let endpoint; let gpuLayers; let contextSize;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (arg === '--allow-public-retrieval') options.allowPublicRetrieval = true;
      else if (['--data-dir', '--port', '--model', '--ollama', '--gpu-layers', '--context-size'].includes(arg) && args[index + 1]) {
        const value = args[++index];
        if (arg === '--data-dir') options.dataDir = value;
        if (arg === '--port') options.port = Number(value);
        if (arg === '--model') modelName = value;
        if (arg === '--ollama') endpoint = value;
        if (arg === '--gpu-layers') gpuLayers = Number(value);
        if (arg === '--context-size') contextSize = Number(value);
      } else throw new Error('Usage: node workspace/server.mjs [--data-dir directory] [--port 4317] [--model qwen3:4b] [--ollama http://127.0.0.1:11434] [--allow-public-retrieval]');
    }
    options.model = createLocalModel({ model: modelName, endpoint, gpuLayers, contextSize });
    const instance = await startServer(options);
    console.log(`Evidence Domino — local private workspace\nOpen: ${instance.url}/#token=${instance.token}\nKeep this launch link private. Press Ctrl+C to stop.\nPublic retrieval: ${options.allowPublicRetrieval ? 'available only after explicit click; public URL goes to Tavily' : 'disabled'}`);
    let closing = false;
    const close = async () => { if (closing) return; closing = true; await instance.close(); process.exit(0); };
    process.on('SIGINT', close); process.on('SIGTERM', close);
  } catch (error) { console.error(`${error.code ?? 'ERROR'}: ${error.message}`); process.exitCode = 1; }
}
