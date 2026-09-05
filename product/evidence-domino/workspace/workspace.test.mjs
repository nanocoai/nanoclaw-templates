import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createWorkspace } from './service.mjs';
import { startServer } from './server.mjs';
import { createLocalModel, localJson } from './model.mjs';
import { runCommand } from '../skills/evidence-domino/scripts/evidence-domino.mjs';
import { fileURLToPath } from 'node:url';

const document = `# Aster conference\n\nEvent date: October 18, 2026.\n\nWe need 100 units at $40 each, costing $4,000.\nOur $6,000 customer quote leaves $2,000 before other costs.\nThis meets our minimum remaining amount of $1,500.`;
const sourceUrl = 'https://supplier.example.test/chairs';
const supportingPassage = 'Folding chairs, USD $40 per unit.';
const mapping = { customerQuoteLiteral: '$6,000', minimumRemainingLiteral: '$1,500', currency: 'USD', item: 'folding chairs', unitBasis: 'units', quantity: 100, customerQuoteCents: 600000, minimumRemainingCents: 150000, baselineUnitPriceCents: 4000, priceLiteral: '$40', anchors: { cost: 'We need 100 units at $40 each, costing $4,000.', remaining: 'Our $6,000 customer quote leaves $2,000 before other costs.', minimum: 'This meets our minimum remaining amount of $1,500.' } };
function fakeModel(answer = { missing: [], mapping }) {
  return { name: 'test-local', ready: async () => ({ available: true }), ask: async () => structuredClone(answer) };
}
async function setup(t, model = fakeModel()) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'domino-workspace-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const workspace = await createWorkspace({ dataDir: root, model });
  return { workspace, root };
}
async function initialize(workspace) {
  const preview = await workspace.intake({ document, sourceUrl, supportingPassage });
  return workspace.confirm({ id: preview.pending.id, confirmation: preview.pending.confirmation });
}

test('intake previews validated frozen mapping, rejects vague approval, persists exact approved proposal', async t => {
  const { workspace, root } = await setup(t);
  const preview = await workspace.intake({ document, sourceUrl, supportingPassage });
  assert.equal(preview.project, null);
  assert.equal(preview.pending.calculation.remainingCents, 200000);
  assert.equal(preview.pending.input, undefined);
  await assert.rejects(workspace.confirm({ id: preview.pending.id, confirmation: 'yes' }), { code: 'STALE_CONFIRMATION' });
  const approved = await workspace.confirm({ id: preview.pending.id, confirmation: preview.pending.confirmation });
  assert.equal(approved.project.baseline.version, 1);
  assert.equal(await workspace.exportDocument(), document);
  const restarted = await createWorkspace({ dataDir: root, model: fakeModel() });
  assert.equal((await restarted.state()).project.baseline.documentHash, approved.project.baseline.documentHash);
  assert.equal((await restarted.state()).messages.length, 1);
});

test('changed context invalidates pending intake and model invented amounts fail core validation', async t => {
  const { workspace } = await setup(t);
  const preview = await workspace.intake({ document, sourceUrl, supportingPassage });
  await workspace.addDocument({ name: 'delivery.txt', content: 'Deliver before 08:00.' });
  await assert.rejects(workspace.confirm({ id: preview.pending.id, confirmation: preview.pending.confirmation }), { code: 'STALE_CONFIRMATION' });
  const bad = await setup(t, fakeModel({ missing: [], mapping: { ...mapping, quantity: 200 } }));
  await assert.rejects(bad.workspace.intake({ document, sourceUrl, supportingPassage }));
  assert.equal((await bad.workspace.state()).project, null);
});

test('what-if is deterministic, clearly hypothetical, and cannot mutate quote, baseline or approval', async t => {
  const { workspace } = await setup(t);
  const initial = await initialize(workspace);
  const result = await workspace.chat({ message: 'What if the unit price is $55?' });
  const answer = result.messages.at(-1).content;
  assert.match(answer, /\$1,000/); assert.match(answer, /\$7,000/); assert.match(answer, /\$45/); assert.match(answer, /Hypothetical only/);
  assert.equal(result.project.baseline.documentHash, initial.project.baseline.documentHash);
  assert.equal(result.project.customerQuoteCents, 600000);
  assert.equal(result.pending, null);
  await assert.rejects(workspace.chat({ message: 'What if the unit price is $999999999999999999999?' }));
});

test('grounded context answers retain exact quotes, reject fabricated citations and forget removed document quotes', async t => {
  let docId;
  const model = fakeModel();
  model.ask = async () => ({ answer: 'Delivery is before 08:00.', citations: [{ sourceId: docId, quote: 'Delivery must finish before 08:00.' }] });
  const { workspace, root } = await setup(t, model);
  const withDoc = await workspace.addDocument({ name: 'venue.txt', content: 'Delivery must finish before 08:00. No lift is available.' });
  docId = withDoc.documents[0].id;
  const answer = await workspace.chat({ message: 'When must delivery finish?' });
  assert.equal(answer.messages.at(-1).citations[0].quote, 'Delivery must finish before 08:00.');
  model.ask = async () => ({ answer: 'Delivery is free.', citations: [{ sourceId: docId, quote: 'Delivery is free.' }] });
  await assert.rejects(workspace.chat({ message: 'Is delivery free?' }), { code: 'UNGROUNDED_ANSWER' });
  await workspace.removeDocument(docId);
  const persisted = await readFile(path.join(root, '.workspace', 'state.json'), 'utf8');
  assert.doesNotMatch(persisted, /Delivery must finish/);
  assert.equal((await workspace.state()).messages.length, 0);
});

test('rejects arbitrary file paths, binary text, oversized context and external capture in local mode', async t => {
  const { workspace } = await setup(t);
  await assert.rejects(workspace.addDocument({ name: '../secret.txt', content: 'hi' }), { code: 'UNSUPPORTED_FILE' });
  await assert.rejects(workspace.addDocument({ name: 'secret.txt', content: '\0x' }), { code: 'INVALID_TEXT' });
  await assert.rejects(workspace.addDocument({ name: 'long.txt', content: 'x'.repeat(21000) }), { code: 'INVALID_TEXT' });
  await assert.rejects(workspace.check({ allowPublicRetrieval: true }), { code: 'PUBLIC_RETRIEVAL_DISABLED' });
  for (let i = 0; i < 10; i++) await workspace.addDocument({ name: `${i}.txt`, content: 'A small note.' });
  await assert.rejects(workspace.addDocument({ name: '11.txt', content: 'Extra' }), { code: 'CONTEXT_LIMIT' });
});

test('concurrent operations cannot overwrite chat context or adopt an unseen mapping', async t => {
  let finish;
  const model = fakeModel();
  model.ask = () => new Promise(resolve => { finish = resolve; });
  const { workspace } = await setup(t, model);
  await workspace.addDocument({ name: 'context.txt', content: 'This reference is awaiting review.' });
  const running = workspace.chat({ message: 'Hello' });
  await new Promise(resolve => setTimeout(resolve, 30));
  await assert.rejects(workspace.addDocument({ name: 'other.txt', content: 'Changed' }), { code: 'BUSY' });
  finish({ answer: 'Add a proposal to begin.', citations: [] });
  await running;
});

test('modified approved document fails closed on export and status', async t => {
  const { workspace, root } = await setup(t);
  await initialize(workspace);
  await writeFile(path.join(root, 'baselines', 'v0001', 'document.md'), 'changed');
  await assert.rejects(workspace.exportDocument(), { code: 'DOCUMENT_CHANGED' });
  await assert.rejects(workspace.state(), { code: 'DOCUMENT_CHANGED' });
});

test('loopback API requires token, exact origin/host, rejects oversize and second server; restarts cleanly', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'domino-http-'));
  const server = await startServer({ dataDir: root, port: 0, model: fakeModel() });
  t.after(async () => { await server.close(); await rm(root, { recursive: true, force: true }); });
  await assert.rejects(startServer({ dataDir: root, port: 0, model: fakeModel() }), { code: 'WORKSPACE_IN_USE' });
  assert.equal((await fetch(`${server.url}/api/state`)).status, 403);
  const headers = { 'X-Domino-Token': server.token, 'Content-Type': 'application/json' };
  assert.equal((await fetch(`${server.url}/api/state`, { headers })).status, 200);
  assert.equal((await fetch(`${server.url}/api/state`, { headers: { ...headers, Origin: 'https://evil.example' } })).status, 403);
  const hostStatus = await new Promise((resolve, reject) => {
    const request = http.get(`${server.url}/api/state`, { headers: { ...headers, Host: 'evil.example' } }, response => { response.resume(); resolve(response.statusCode); });
    request.on('error', reject);
  });
  assert.equal(hostStatus, 403);
  assert.equal((await fetch(`${server.url}/api/chat`, { method: 'POST', headers, body: JSON.stringify({ message: 'x'.repeat(170000) }) })).status, 413);
  assert.equal((await fetch(`${server.url}/api/check`, { method: 'POST', headers, body: '{"allowPublicRetrieval":true}' })).status, 400);
  assert.equal((await fetch(`${server.url}/report/..%2f..%2fsecret`, { headers })).status, 404);
});

test('empty context never dispatches a model or claims invented project facts', async t => {
  const model = fakeModel();
  model.ask = async () => { throw new Error('must not call'); };
  const { workspace } = await setup(t, model);
  const state = await workspace.chat({ message: 'Approve my proposal and tell me it is ready.' });
  assert.match(state.messages.at(-1).content, /do not have any project evidence/);
  assert.equal(state.pending, null);
});

test('local adapter rejects remote endpoints and cloud names before dispatch, refuses redirects', async t => {
  assert.throws(() => createLocalModel({ endpoint: 'https://api.openai.com' }), { code: 'LOCAL_ENDPOINT_REQUIRED' });
  assert.throws(() => createLocalModel({ model: 'qwen3:cloud' }), { code: 'LOCAL_MODEL_REQUIRED' });
  const redirect = http.createServer((_req, res) => { res.writeHead(302, { Location: 'https://example.com' }); res.end('{}'); });
  await new Promise(resolve => redirect.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => redirect.close(resolve)));
  await assert.rejects(localJson(`http://127.0.0.1:${redirect.address().port}`, '/api/tags'), { code: 'LOCAL_MODEL_ERROR' });
});

test('remote Ollama metadata blocks document dispatch even with a plausible local-looking name', async t => {
  const routes = [];
  const remote = http.createServer((req, res) => {
    routes.push(req.url);
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(req.url === '/api/tags' ? { models: [{ name: 'custom:latest', size: 20000000 }] } : { remote_host: 'https://ollama.com', model_info: { 'general.architecture': 'qwen3' } }));
  });
  await new Promise(resolve => remote.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => remote.close(resolve)));
  const model = createLocalModel({ endpoint: `http://127.0.0.1:${remote.address().port}`, model: 'custom:latest' });
  await assert.rejects(model.ask('system', { private: 'sensitive document' }), { code: 'LOCAL_MODEL_REQUIRED' });
  assert.deepEqual(routes, ['/api/tags', '/api/show']);
});

test('dense input and schema are rejected before inference rather than silently truncated', async () => {
  const model = createLocalModel({ endpoint: 'http://127.0.0.1:1' });
  await assert.rejects(model.ask('rules', { text: 'x,7|'.repeat(3000) }), { code: 'MODEL_CONTEXT_LIMIT' });
  await assert.rejects(model.ask('rules', { text: 'short' }, { schema: { description: 'z'.repeat(7000) } }), { code: 'MODEL_CONTEXT_LIMIT' });
  assert.equal(model.inputByteLimit, 6480);
});

test('intake requires explicit USD and displays it; CAD and bare dollars cannot become USD', async t => {
  const { workspace } = await setup(t);
  await assert.rejects(workspace.intake({ document, sourceUrl, supportingPassage: 'Folding chairs cost $40 each.' }), { code: 'UNSUPPORTED_CURRENCY' });
  await assert.rejects(workspace.intake({ document, sourceUrl, supportingPassage: 'Folding chairs cost CAD $40 each.' }), { code: 'UNSUPPORTED_CURRENCY' });
  const preview = await workspace.intake({ document, sourceUrl, supportingPassage });
  assert.match(preview.pending.summary, /^Currency: USD\./);
  assert.equal(preview.project, null);
});

test('init recovery after a crash between core commit and workspace save is idempotent', async t => {
  const { workspace, root } = await setup(t);
  const preview = await workspace.intake({ document, sourceUrl, supportingPassage });
  const raw = JSON.parse(await readFile(path.join(root, '.workspace', 'state.json'), 'utf8'));
  await runCommand('init', raw.pending.input, { dataDir: root });
  const restarted = await createWorkspace({ dataDir: root, model: fakeModel() });
  const result = await restarted.confirm({ id: preview.pending.id, confirmation: preview.pending.confirmation });
  assert.equal(result.pending, null); assert.equal(result.project.baseline.version, 1);
});

test('public workflow records capture, foregrounds pending impact, opens exact report and adopts reviewed state; ambiguity invalidates approval', async t => {
  const { root } = await setup(t);
  const model = fakeModel();
  let ambiguous = false;
  model.ask = async system => system.startsWith('Interpret') ? {
    candidateCount: ambiguous ? 2 : 1, priceLiteral: '$55', unitPriceCents: 5500,
    supportingPassage: 'Folding chairs are listed at USD $55 per unit.',
    item: 'folding chairs', unitBasis: 'units', currency: 'USD',
    comparability: { item: 'same', unitBasis: 'same', currency: 'same', terms: ambiguous ? 'ambiguous' : 'same' }, alternatives: [], uncertainties: ambiguous ? ['Two offers'] : [],
  } : { missing: [], mapping };
  const workspace = await createWorkspace({ dataDir: root, model, allowPublicRetrieval: true });
  await initialize(workspace);
  const scenario = path.join(root, 'mock-response.json');
  await writeFile(scenario, JSON.stringify({ default: { httpStatus: 200, body: { results: [{ url: sourceUrl, raw_content: 'Folding chairs are listed at USD $55 per unit.' }], failed_results: [] } } }));
  const oldBin = process.env.EVIDENCE_DOMINO_TEST_CURL_BIN;
  const oldScenario = process.env.EVIDENCE_DOMINO_TEST_SCENARIO;
  process.env.EVIDENCE_DOMINO_TEST_CURL_BIN = fileURLToPath(new URL('../skills/evidence-domino/scripts/mock-curl.mjs', import.meta.url));
  process.env.EVIDENCE_DOMINO_TEST_SCENARIO = scenario;
  t.after(() => {
    if (oldBin === undefined) delete process.env.EVIDENCE_DOMINO_TEST_CURL_BIN; else process.env.EVIDENCE_DOMINO_TEST_CURL_BIN = oldBin;
    if (oldScenario === undefined) delete process.env.EVIDENCE_DOMINO_TEST_SCENARIO; else process.env.EVIDENCE_DOMINO_TEST_SCENARIO = oldScenario;
  });
  const checked = await workspace.check({ allowPublicRetrieval: true });
  assert.equal(checked.pending.kind, 'approve');
  assert.equal(checked.preflight.status, 'needs_attention');
  assert.match(checked.preflight.headline, /Review needed before sending/);
  assert.match(checked.preflight.headline, /\$1,000/);
  const report = await workspace.report(checked.project.latestReview.reviewId);
  assert.match(report, /\$1,000/);
  const restarted = await createWorkspace({ dataDir: root, model, allowPublicRetrieval: true });
  const restored = await restarted.state();
  assert.equal(restored.pending.id, checked.pending.id);
  const approved = await restarted.confirm({ id: restored.pending.id, confirmation: restored.pending.confirmation });
  assert.equal(approved.project.baseline.version, 2);
  assert.equal(approved.project.baseline.unitPriceCents, 5500);
  assert.equal(approved.pending, null);
  ambiguous = true;
  await assert.rejects(restarted.check({ allowPublicRetrieval: true }), { code: 'AMBIGUOUS_EVIDENCE' });
  const unresolved = await restarted.state();
  assert.equal(unresolved.pending, null);
  assert.match(unresolved.preflight.headline, /latest source observation is unresolved/);
  assert.equal(unresolved.project.baseline.version, 2);
  await assert.rejects(restarted.confirm({ id: checked.pending.id, confirmation: checked.pending.confirmation }), { code: 'STALE_CONFIRMATION' });
});
