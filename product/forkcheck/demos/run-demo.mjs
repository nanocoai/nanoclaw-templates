#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const ledgerCli = path.join(root, 'scripts', 'forkcheck-ledger.mjs');

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const selected = option('--demo', 'all').toLowerCase();
const dataDir = path.resolve(option('--data-dir', path.join(root, '.demo-data')));
fs.mkdirSync(dataDir, { recursive: true });

function runLedger(args) {
  const result = spawnSync(process.execPath, [ledgerCli, ...args, '--data-dir', dataDir], {
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function writePayload(name, payload) {
  const file = path.join(os.tmpdir(), `forkcheck-${name}-${process.pid}-${Date.now()}.json`);
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return file;
}

function demoA() {
  const fixture = path.join(here, 'fixtures', 'demo-a-primary-source.json');
  const result = runLedger(['record', '--input', fixture]);
  return { demo: 'A', purpose: 'Primary-source resolution', ...result };
}

function demoB() {
  const hasToSorted = typeof Array.prototype.toSorted === 'function';
  const observation = `typeof Array.prototype.toSorted returned ${typeof Array.prototype.toSorted} in ${process.version}.`;
  const payload = {
    question: `Does the current runtime (${process.version}) provide Array.prototype.toSorted without a polyfill?`,
    hypotheses: {
      h1: 'The current runtime provides Array.prototype.toSorted natively.',
      h2: 'The current runtime does not provide Array.prototype.toSorted natively.',
    },
    decisiveTest: {
      name: 'Minimal runtime capability probe',
      method: 'Evaluate typeof Array.prototype.toSorted in a fresh Node process.',
      expectedByHypothesis: { h1: 'function', h2: 'undefined or another non-function value' },
      executed: true,
      safety: 'read-only, local, one expression',
    },
    evidence: [
      {
        classification: 'OBSERVED',
        title: 'Current Node runtime capability probe',
        source: `local:${process.execPath}`,
        executedAt: new Date().toISOString(),
        finding: observation,
        supports: [hasToSorted ? 'h1' : 'h2'],
        contradicts: [hasToSorted ? 'h2' : 'h1'],
        limitations: ['The result applies to this exact runtime version and environment.'],
      },
    ],
    observation,
    status: 'SUPPORTED',
    supportedHypotheses: [hasToSorted ? 'h1' : 'h2'],
    confidence: 'HIGH',
    limitations: ['Other Node versions or runtimes may differ.'],
    volatility: 'HIGH',
    recheckIntervalDays: 14,
  };
  const file = writePayload('demo-b', payload);
  try {
    const result = runLedger(['record', '--input', file]);
    return { demo: 'B', purpose: 'Documentation is not enough; execute the minimal test', observation, ...result };
  } finally {
    fs.unlinkSync(file);
  }
}

function demoC() {
  const v1 = JSON.parse(fs.readFileSync(path.join(here, 'fixtures', 'demo-c-source-v1.json'), 'utf8'));
  const v2 = JSON.parse(fs.readFileSync(path.join(here, 'fixtures', 'demo-c-source-v2.json'), 'utf8'));
  const initialPayload = {
    question: 'Does FixtureStream currently support streaming?',
    hypotheses: { h1: 'FixtureStream supports streaming.', h2: 'FixtureStream does not support streaming.' },
    decisiveTest: {
      name: 'Inspect the controlled machine-readable capability source',
      method: 'Read the streaming boolean from the versioned demo fixture.',
      expectedByHypothesis: { h1: 'streaming=true', h2: 'streaming=false' },
      executed: true,
      safety: 'read-only deterministic fixture',
    },
    evidence: [
      {
        classification: 'OBSERVED',
        title: `FixtureStream capability record ${v1.version}`,
        source: 'fixtures/demo-c-source-v1.json',
        retrievedAt: v1.updatedAt,
        finding: `streaming=${v1.streaming}`,
        supports: [v1.streaming ? 'h1' : 'h2'],
        contradicts: [v1.streaming ? 'h2' : 'h1'],
        limitations: ['Controlled fixture demonstrates mechanics; it is not presented as a live external change.'],
      },
    ],
    observation: `Fixture version ${v1.version} reports streaming=${v1.streaming}.`,
    status: 'SUPPORTED',
    supportedHypotheses: [v1.streaming ? 'h1' : 'h2'],
    confidence: 'HIGH',
    limitations: ['Controlled deterministic fixture.'],
    volatility: 'HIGH',
    recheckIntervalDays: 7,
  };
  const initialFile = writePayload('demo-c-initial', initialPayload);
  let created;
  try {
    created = runLedger(['record', '--input', initialFile]);
  } finally {
    fs.unlinkSync(initialFile);
  }

  const recheckPayload = {
    outcome: 'INVALIDATED',
    observation: `Fixture version ${v2.version} reports streaming=${v2.streaming}, reversing the decisive field.`,
    confidence: 'HIGH',
    limitations: ['Controlled deterministic fixture.'],
    evidence: [
      {
        classification: 'OBSERVED',
        title: `FixtureStream capability record ${v2.version}`,
        source: 'fixtures/demo-c-source-v2.json',
        retrievedAt: v2.updatedAt,
        finding: `streaming=${v2.streaming}`,
        supports: [v2.streaming ? 'h1' : 'h2'],
        contradicts: [v2.streaming ? 'h2' : 'h1'],
        limitations: ['Controlled fixture demonstrates invalidation deterministically.'],
      },
    ],
  };
  const recheckFile = writePayload('demo-c-recheck', recheckPayload);
  try {
    const rechecked = runLedger(['recheck', '--id', created.id, '--input', recheckFile]);
    return {
      demo: 'C',
      purpose: 'Living verdict invalidation',
      initial: created,
      recheck: rechecked,
      banner: '⚠️ VERDICT INVALIDATED',
    };
  } finally {
    fs.unlinkSync(recheckFile);
  }
}

const demos = { a: demoA, b: demoB, c: demoC };
const names = selected === 'all' ? ['a', 'b', 'c'] : [selected];
if (names.some((name) => !(name in demos))) {
  process.stderr.write('Use --demo a, b, c, or all.\n');
  process.exit(1);
}

const results = names.map((name) => demos[name]());
process.stdout.write(`${JSON.stringify({ dataDir, results }, null, 2)}\n`);

