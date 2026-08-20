#!/usr/bin/env node
/**
 * Fails a PR that changes a template without bumping its plugin.json version.
 * Installs cache templates by ref, so an unbumped edit is invisible downstream.
 *
 * Exempt: index.json (generated), scripts/, .github/, and templates added by
 * this PR (no base version to compare against).
 *
 * Zero dependencies by design — plain node.
 * Run: node scripts/check-version-bump.mjs <base-ref>
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const EXEMPT_PREFIXES = ['scripts/', '.github/'];
const EXEMPT_FILES = new Set(['index.json']);

const base = process.argv[2];
if (!base) {
  console.error('usage: node scripts/check-version-bump.mjs <base-ref>');
  process.exit(2);
}

const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });

function templateRefFor(file) {
  const segments = file.split('/');
  for (let i = segments.length - 1; i > 0; i--) {
    const ref = segments.slice(0, i).join('/');
    if (fs.existsSync(path.join(ROOT, ref, 'plugin.json'))) return ref;
  }
  return undefined;
}

function versionAt(ref, revision) {
  try {
    const source =
      revision === undefined
        ? fs.readFileSync(path.join(ROOT, ref, 'plugin.json'), 'utf8')
        : git(['show', `${revision}:${ref}/plugin.json`]);
    return JSON.parse(source).version;
  } catch {
    return undefined;
  }
}

const changed = git(['diff', '--name-only', `${base}...HEAD`]).split('\n').filter(Boolean);
const touched = new Set();
for (const file of changed) {
  if (EXEMPT_FILES.has(file) || EXEMPT_PREFIXES.some((p) => file.startsWith(p))) continue;
  const ref = templateRefFor(file);
  if (ref) touched.add(ref);
}

const errors = [];
for (const ref of [...touched].sort()) {
  const baseVersion = versionAt(ref, base);
  if (baseVersion === undefined) continue; // new template in this PR
  const headVersion = versionAt(ref);
  if (headVersion === baseVersion) {
    errors.push(`${ref}: changed without a plugin.json version bump (still ${baseVersion})`);
  }
}

if (errors.length > 0) {
  console.error(`check-version-bump: ${errors.length} problem(s)\n`);
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}
console.log(
  touched.size === 0
    ? 'check-version-bump: no template changes'
    : `check-version-bump: ${touched.size} template(s) bumped: ${[...touched].sort().join(', ')}`,
);
