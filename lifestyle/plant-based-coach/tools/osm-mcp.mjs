#!/usr/bin/env node
// Zero-dependency MCP server (stdio, JSON-RPC 2.0) exposing OpenStreetMap lookups:
//   geocode        -> Nominatim search (place name or postcode to coordinates)
//   nearby_places  -> Overpass query for shops and restaurants around a point
//   overpass_query -> raw Overpass QL, bounded and time-limited
// Node 18+ (global fetch). No API keys. Public services with fair-use limits:
// one request at a time, User-Agent set, every query bounded by radius and timeout.

import { createInterface } from 'node:readline';

const UA = 'nanoclaw-paula/0.1 (OpenStreetMap lookups for a meal-planning agent)';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter'];
const MAX_RADIUS = 5000;

const KINDS = {
  'vegan-restaurant':      ['node["amenity"~"restaurant|cafe|fast_food"]["diet:vegan"~"yes|only"]', 'way["amenity"~"restaurant|cafe|fast_food"]["diet:vegan"~"yes|only"]'],
  'vegetarian-restaurant': ['node["amenity"~"restaurant|cafe|fast_food"]["diet:vegetarian"~"yes|only"]', 'way["amenity"~"restaurant|cafe|fast_food"]["diet:vegetarian"~"yes|only"]'],
  'health-food':           ['node["shop"="health_food"]', 'way["shop"="health_food"]'],
  'greengrocer':           ['node["shop"="greengrocer"]', 'way["shop"="greengrocer"]'],
  'organic':               ['node["shop"~"supermarket|convenience|health_food"]["organic"~"yes|only"]', 'way["shop"~"supermarket|convenience|health_food"]["organic"~"yes|only"]'],
  'asian-grocer':          ['node["shop"~"supermarket|convenience|grocery"]["cuisine"~"asian|chinese|japanese|korean|vietnamese|thai|indian",i]', 'node["shop"="asian"]', 'node["origin"~"asia|china|japan|korea|vietnam|thailand|india",i]["shop"]'],
  'middle-eastern-grocer': ['node["shop"~"supermarket|convenience|grocery"]["cuisine"~"turkish|arab|lebanese|persian|middle_eastern",i]', 'node["origin"~"turkey|lebanon|iran|arab",i]["shop"]'],
  'supermarket':           ['node["shop"="supermarket"]', 'way["shop"="supermarket"]'],
};

const tools = [
  { name: 'geocode', description: 'Turn a place name, address, or postcode into coordinates using OpenStreetMap Nominatim. Returns up to 3 candidates with lat, lon and display_name.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'e.g. "Kreuzberg, Berlin" or "10997 Berlin"' } }, required: ['query'] } },
  { name: 'nearby_places', description: 'Find shops or restaurants of one kind within a radius of a point, from OpenStreetMap via Overpass. Sorted by distance. Kinds: ' + Object.keys(KINDS).join(', ') + '.',
    inputSchema: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' }, radius_m: { type: 'number', description: 'metres, max ' + MAX_RADIUS }, kind: { type: 'string', enum: Object.keys(KINDS) }, limit: { type: 'number', description: 'max results, default 8' } }, required: ['lat', 'lon', 'kind'] } },
  { name: 'overpass_query', description: 'Run raw Overpass QL. Must include a [timeout:N] header (N <= 25) and an around: or bbox bound. Returns elements with tags, capped at 50.',
    inputSchema: { type: 'object', properties: { ql: { type: 'string' } }, required: ['ql'] } },
];

function dist(lat1, lon1, lat2, lon2) {
  const R = 6371000, toR = d => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

async function geocode({ query }) {
  const url = `${NOMINATIM}?format=jsonv2&limit=3&q=${encodeURIComponent(query)}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } });
  if (!r.ok) throw new Error(`Nominatim ${r.status}`);
  const j = await r.json();
  return j.map(x => ({ lat: +x.lat, lon: +x.lon, display_name: x.display_name, type: x.type }));
}

// Public Overpass instances throttle bursts. Requests are serialised through one
// queue, tried against each endpoint in turn, and retried once after a pause.
let queue = Promise.resolve();
function overpass(ql) {
  const run = async () => {
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      for (const url of OVERPASS_ENDPOINTS) {
        try {
          const r = await fetch(url, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(ql) });
          if (r.ok) return await r.json();
          lastErr = new Error(`Overpass ${r.status} at ${new URL(url).host}`);
          if (r.status < 500 && r.status !== 429) throw lastErr;
        } catch (e) { lastErr = e; }
      }
      await new Promise(res => setTimeout(res, 2000));
    }
    throw lastErr;
  };
  const p = queue.then(run, run);
  queue = p.catch(() => {});
  return p;
}

function simplify(el, lat, lon) {
  const t = el.tags || {};
  const elat = el.lat ?? el.center?.lat, elon = el.lon ?? el.center?.lon;
  const addr = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(' ');
  return { name: t.name || '(unnamed)', distance_m: (elat != null && lat != null) ? dist(lat, lon, elat, elon) : null, address: addr || null, opening_hours: t.opening_hours || null,
    cuisine: t.cuisine || null, diet_vegan: t['diet:vegan'] || null, diet_vegetarian: t['diet:vegetarian'] || null, shop: t.shop || null, organic: t.organic || null, website: t.website || t['contact:website'] || null, lat: elat, lon: elon };
}

async function nearbyPlaces({ lat, lon, radius_m = 1500, kind, limit = 8 }) {
  if (!KINDS[kind]) throw new Error('unknown kind: ' + kind);
  const r = Math.min(Math.max(100, Math.round(radius_m)), MAX_RADIUS);
  const body = KINDS[kind].map(sel => `${sel}(around:${r},${lat},${lon});`).join('\n');
  const ql = `[out:json][timeout:25];\n(\n${body}\n);\nout center tags 60;`;
  const j = await overpass(ql);
  const seen = new Set();
  const out = (j.elements || []).map(e => simplify(e, lat, lon)).filter(p => { const k = p.name + '|' + p.lat; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (a.distance_m ?? 1e9) - (b.distance_m ?? 1e9)).slice(0, Math.min(limit, 20));
  return { kind, radius_m: r, count: out.length, places: out };
}

async function rawQuery({ ql }) {
  const m = ql.match(/\[timeout:(\d+)\]/);
  if (!m || +m[1] > 25) throw new Error('query must declare [timeout:N] with N <= 25');
  if (!/around:|\(\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\)/.test(ql)) throw new Error('query must be bounded with around: or a bbox');
  const j = await overpass(ql);
  return { count: (j.elements || []).length, elements: (j.elements || []).filter(e => e.tags).slice(0, 50).map(e => ({ id: e.id, type: e.type, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon, tags: e.tags })) };
}

const handlers = { geocode, nearby_places: nearbyPlaces, overpass_query: rawQuery };

function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n'); }

const rl = createInterface({ input: process.stdin });
rl.on('line', async line => {
  line = line.trim(); if (!line) return;
  let req; try { req = JSON.parse(line); } catch { return; }
  const { id, method, params } = req;
  if (method === 'initialize') return send({ jsonrpc: '2.0', id, result: { protocolVersion: params?.protocolVersion || '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'osm', version: '0.1.0' } } });
  if (method === 'notifications/initialized' || method?.startsWith('notifications/')) return;
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
