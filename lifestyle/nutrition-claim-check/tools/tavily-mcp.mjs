#!/usr/bin/env node
// Zero-dependency MCP server (stdio, JSON-RPC 2.0) for Tavily search and extract.
// Why not the upstream tavily-mcp package: it sends the API key inside the request body,
// and Tavily honours the body key over the Authorization header. NanoClaw's OneCLI vault
// injects credentials as headers at the proxy, so a body key of "placeholder" is rejected.
// This shim sends only an Authorization header carrying a placeholder; the vault replaces it.
// No key is ever present in this file, in mcp.json, or in the container.

import { createInterface } from 'node:readline';

const BASE = 'https://api.tavily.com';
const AUTH = 'Bearer placeholder'; // replaced at the network boundary by the OneCLI gateway

const tools = [
  { name: 'tavily_search',
    description: 'Web search via Tavily. Returns titles, URLs, and content snippets. Use include_domains to restrict to trusted sources and time_range for recency.',
    inputSchema: { type: 'object', required: ['query'], properties: {
      query: { type: 'string' },
      max_results: { type: 'number', description: '1 to 10, default 5' },
      search_depth: { type: 'string', enum: ['basic', 'advanced'], description: 'default advanced' },
      topic: { type: 'string', enum: ['general', 'news'] },
      time_range: { type: 'string', enum: ['day', 'week', 'month', 'year'] },
      include_domains: { type: 'array', items: { type: 'string' } },
      exclude_domains: { type: 'array', items: { type: 'string' } },
      include_answer: { type: 'boolean', description: 'ask Tavily for a short synthesized answer, default false' } } } },
  { name: 'tavily_extract',
    description: 'Fetch and extract the readable content of up to 5 URLs via Tavily. Returns the page text per URL, capped at 12,000 characters each.',
    inputSchema: { type: 'object', required: ['urls'], properties: {
      urls: { type: 'array', items: { type: 'string' } },
      extract_depth: { type: 'string', enum: ['basic', 'advanced'], description: 'default advanced' } } } },
];

async function post(path, body) {
  const r = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': AUTH }, body: JSON.stringify(body) });
  const text = await r.text();
  if (!r.ok) throw new Error(`Tavily ${r.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function search(a) {
  const body = { query: a.query, max_results: Math.min(Math.max(1, a.max_results || 5), 10), search_depth: a.search_depth || 'advanced', include_answer: !!a.include_answer };
  if (a.topic) body.topic = a.topic;
  if (a.time_range) body.time_range = a.time_range;
  if (a.include_domains?.length) body.include_domains = a.include_domains;
  if (a.exclude_domains?.length) body.exclude_domains = a.exclude_domains;
  const j = await post('/search', body);
  return { query: j.query, answer: j.answer || null, results: (j.results || []).map(x => ({ title: x.title, url: x.url, published_date: x.published_date || null, score: x.score, content: (x.content || '').slice(0, 1500) })) };
}

async function extract(a) {
  const urls = (a.urls || []).slice(0, 5);
  const j = await post('/extract', { urls, extract_depth: a.extract_depth || 'advanced' });
  return { results: (j.results || []).map(x => ({ url: x.url, raw_content: (x.raw_content || '').slice(0, 12000) })), failed: (j.failed_results || []).map(x => ({ url: x.url, error: x.error })) };
}

const handlers = { tavily_search: search, tavily_extract: extract };
const send = m => process.stdout.write(JSON.stringify(m) + '\n');

createInterface({ input: process.stdin }).on('line', async line => {
  line = line.trim(); if (!line) return;
  let req; try { req = JSON.parse(line); } catch { return; }
  const { id, method, params } = req;
  if (method === 'initialize') return send({ jsonrpc: '2.0', id, result: { protocolVersion: params?.protocolVersion || '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'tavily', version: '0.1.0' } } });
  if (method?.startsWith('notifications/')) return;
  if (method === 'ping') return send({ jsonrpc: '2.0', id, result: {} });
  if (method === 'tools/list') return send({ jsonrpc: '2.0', id, result: { tools } });
  if (method === 'tools/call') {
    const fn = handlers[params?.name];
    if (!fn) return send({ jsonrpc: '2.0', id, error: { code: -32602, message: 'unknown tool ' + params?.name } });
    try { const result = await fn(params.arguments || {}); return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result) }] } }); }
    catch (e) { return send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: 'error: ' + e.message }], isError: true } }); }
  }
  if (id !== undefined) send({ jsonrpc: '2.0', id, error: { code: -32601, message: 'method not found: ' + method } });
});
