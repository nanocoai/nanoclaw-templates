import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const pluginRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ledgerCli = path.join(pluginRoot, 'scripts', 'forkcheck-ledger.mjs');
const demoCli = path.join(pluginRoot, 'demos', 'run-demo.mjs');
const showcaseCli = path.join(pluginRoot, 'demos', 'showcase.mjs');

function run(file, args) {
  const result = spawnSync(process.execPath, [file, ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('Demo C preserves the old verdict and emits a versioned invalidation receipt', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forkcheck-demo-c-'));
  const output = run(demoCli, ['--demo', 'c', '--data-dir', dataDir]);
  const result = output.results[0];
  assert.equal(result.banner, '⚠️ VERDICT INVALIDATED');
  assert.equal(result.recheck.status, 'INVALIDATED');

  const record = run(ledgerCli, ['show', '--data-dir', dataDir, '--id', result.initial.id]);
  assert.equal(record.history[0].event, 'CREATED');
  assert.equal(record.history[1].event, 'INVALIDATED');
  assert.equal(record.evidence.length, 2);
  assert.equal(record.receipts.length, 2);
  assert.notEqual(record.receipts[0], record.receipts[1]);
  assert.match(fs.readFileSync(path.join(dataDir, record.receipts[1]), 'utf8'), /VERDICT INVALIDATED/);
});

test('due-check remains quiet for a fresh future verdict', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forkcheck-due-'));
  run(demoCli, ['--demo', 'a', '--data-dir', dataDir]);
  const result = run(path.join(pluginRoot, 'scripts', 'due-check.mjs'), ['--data-dir', dataDir]);
  assert.equal(result.wakeAgent, false);
  assert.deepEqual(result.data.dueIds, []);
});

test('due-check wakes only with the exact overdue verdict IDs', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forkcheck-overdue-'));
  const demo = run(demoCli, ['--demo', 'a', '--data-dir', dataDir]);
  const id = demo.results[0].id;
  const ledgerFile = path.join(dataDir, 'ledger.json');
  const ledger = JSON.parse(fs.readFileSync(ledgerFile, 'utf8'));
  ledger.records[0].nextCheckAt = '2000-01-01T00:00:00.000Z';
  fs.writeFileSync(ledgerFile, `${JSON.stringify(ledger, null, 2)}\n`, 'utf8');

  const result = run(path.join(pluginRoot, 'scripts', 'due-check.mjs'), ['--data-dir', dataDir]);
  assert.equal(result.wakeAgent, true);
  assert.deepEqual(result.data.dueIds, [id]);
});

test('ledger validates after all deterministic demos', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forkcheck-all-'));
  run(demoCli, ['--demo', 'all', '--data-dir', dataDir]);
  const result = run(ledgerCli, ['validate', '--data-dir', dataDir]);
  assert.deepEqual(result, { valid: true, records: 3, nextId: 4 });
});

test('showcase leads with the decisive test and makes invalidation visible', () => {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forkcheck-showcase-test-'));
  const result = spawnSync(process.execPath, [showcaseCli, '--data-dir', dataDir], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(result.stdout.indexOf('DEMO B // THE DECISIVE TEST') < result.stdout.indexOf('DEMO C // LIVING VERDICT'));
  assert.match(result.stdout, /OBSERVED\s+\S+ on v\d+/);
  assert.match(result.stdout, /⚠ VERDICT INVALIDATED/);
  assert.match(result.stdout, /HISTORY\s+CREATED → INVALIDATED/);
  assert.match(result.stdout, /RECEIPTS KEPT\s+2 versioned receipts/);
});
