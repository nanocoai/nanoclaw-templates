#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.dirname(here);
const runDemo = path.join(here, 'run-demo.mjs');
const ledgerCli = path.join(pluginRoot, 'scripts', 'forkcheck-ledger.mjs');

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : undefined;
}

const requestedDir = option('--data-dir');
const dataDir = requestedDir
  ? path.resolve(requestedDir)
  : fs.mkdtempSync(path.join(os.tmpdir(), 'forkcheck-showcase-'));
fs.mkdirSync(dataDir, { recursive: true });

function runJson(file, args) {
  const result = spawnSync(process.execPath, [file, ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function line(label, value) {
  process.stdout.write(`${label.padEnd(18)} ${value}\n`);
}

function rule(title) {
  process.stdout.write(`\n${'═'.repeat(68)}\n${title}\n${'═'.repeat(68)}\n`);
}

rule('DEMO B // THE DECISIVE TEST');
process.stdout.write('Claim A says the exact runtime has Array.prototype.toSorted.\n');
process.stdout.write('Claim B says it does not. Documentation is not the test.\n\n');
line('DECISIVE QUESTION', 'What does this runtime expose right now?');
line('SELECTED TEST', 'typeof Array.prototype.toSorted');
line('SAFETY', 'read-only · local · one expression');

const demoB = runJson(runDemo, ['--demo', 'b', '--data-dir', dataDir]).results[0];
const observedType = /returned ([^ ]+)/.exec(demoB.observation)?.[1] ?? 'unknown';
process.stdout.write('\n');
line('OBSERVED', `${observedType} on ${process.version}`);
line('VERDICT', `${observedType === 'function' ? 'H1' : 'H2'} SUPPORTED · HIGH CONFIDENCE`);
line('RECEIPT', `${demoB.id} · ${demoB.receipt}`);

rule('DEMO C // LIVING VERDICT');
line('ORIGINAL EVIDENCE', 'FixtureStream 1.0 · streaming=false');
line('ORIGINAL VERDICT', 'H2 SUPPORTED · HIGH CONFIDENCE');
process.stdout.write('\nNew evidence arrives. ForkCheck repeats the same decisive field.\n\n');
line('NEW EVIDENCE', 'FixtureStream 1.1 · streaming=true');

const demoC = runJson(runDemo, ['--demo', 'c', '--data-dir', dataDir]).results[0];
const record = runJson(ledgerCli, ['show', '--data-dir', dataDir, '--id', demoC.initial.id]);
process.stdout.write('\n⚠ VERDICT INVALIDATED\n\n');
line('TRANSITION', `${demoC.recheck.previousStatus} → ${demoC.recheck.status}`);
line('HISTORY', record.history.map((item) => item.event).join(' → '));
line('RECEIPTS KEPT', `${record.receipts.length} versioned receipts`);
line('LATEST RECEIPT', demoC.recheck.receipt);

rule('FORKCHECK // TESTS, NOT GUESSES');
line('DURABLE LEDGER', path.join(dataDir, 'ledger.json'));
line('NEXT ACTION', `Reopen decisions that depended on ${demoC.initial.id}.`);
