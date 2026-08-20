#!/usr/bin/env node
/**
 * Generates index.json: the registry listing NanoClaw fetches to show templates
 * in chat (`ncl templates list --registry`).
 *
 * A template is any directory containing plugin.json; its ref is the
 * repo-relative path. The output is advisory only — an install re-validates
 * everything at stamp time — so this never needs to be hand-edited, and CI
 * fails if it drifts from the tree.
 *
 * Zero dependencies by design — plain node. Run: node scripts/build-index.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SKIP_DIRS = new Set(['scripts', 'node_modules']);

function findTemplates(dir, rel = '') {
  const refs = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
    const entryDir = path.join(dir, entry.name);
    if (fs.existsSync(path.join(entryDir, 'plugin.json'))) refs.push(entryRel);
    else refs.push(...findTemplates(entryDir, entryRel));
  }
  return refs;
}

function entryFor(ref) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, ref, 'plugin.json'), 'utf8'));
  return {
    ref,
    name: ref.split('/').pop(),
    version: typeof manifest.version === 'string' ? manifest.version : '0.0.0',
    description: typeof manifest.description === 'string' ? manifest.description : '',
  };
}

const refs = findTemplates(ROOT).sort();
const categories = {};
for (const ref of refs) {
  const cut = ref.indexOf('/');
  if (cut === -1) throw new Error(`Template "${ref}" is not under a category directory (<category>/<template>)`);
  (categories[ref.slice(0, cut)] ??= []).push(entryFor(ref));
}
const index = { schema: 1, categories };
fs.writeFileSync(path.join(ROOT, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
console.log(`build-index: ${refs.length} template(s) in ${Object.keys(categories).length} categories written to index.json`);
