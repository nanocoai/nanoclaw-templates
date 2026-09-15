import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir, rename } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createHash } from 'node:crypto';

import {
  BASELINE_CONFIRMATION,
  EvidenceDominoError,
  calculate,
  containsExactUsdAmount,
  containsExactQuantityAndBasis,
  containsExactWholeNumber,
  formatUsd,
  runCommand,
  validateAnchors,
} from './evidence-domino.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MOCK_CURL = path.join(HERE, 'mock-curl.mjs');
const V1 = 'https://supplier.example.test/chairs-v1';
const V2 = 'https://supplier.example.test/chairs-v2';

const DOCUMENT = `# Riverside launch proposal

Event date: October 18, 2026.

We need 100 units at $40 each, costing $4,000.
Our $6,000 customer quote leaves $2,000 before other costs.
This meets our minimum remaining amount of $1,500.

The venue opens at 08:00.`;

const ANCHORS = {
  cost: 'We need 100 units at $40 each, costing $4,000.',
  remaining: 'Our $6,000 customer quote leaves $2,000 before other costs.',
  minimum: 'This meets our minimum remaining amount of $1,500.',
};

function initInput(overrides = {}) {
  return {
    projectId: 'riverside-launch',
    mode: 'controlled_replay',
    sourceUrl: V1,
    controlledReplay: {
      logicalSourceId: 'demo-chair-listing',
      versions: [
        { name: 'v1', url: V1, marker: 'ED-DEMO-V1' },
        { name: 'v2', url: V2, marker: 'ED-DEMO-V2' },
      ],
    },
    item: 'folding chairs',
    unitBasis: 'units',
    quantity: 100,
    currency: 'USD',
    customerQuoteCents: 600_000,
    minimumRemainingCents: 150_000,
    baselineUnitPriceCents: 4_000,
    baselineEvidence: {
      priceLiteral: '$40',
      supportingPassage: 'ED-DEMO-V1\nFolding chairs were listed at $40 per unit.<img src=x onerror=alert("baseline")>',
      sourceUrl: V1,
    },
    pricingAssumption: 'public_list_price_estimate',
    remainingMeaning: 'before_other_costs',
    document: DOCUMENT,
    anchors: ANCHORS,
    documentValues: {
      quantity: 100,
      unitPriceCents: 4_000,
      trackedCostCents: 400_000,
      customerQuoteCents: 600_000,
      remainingCents: 200_000,
      minimumRemainingCents: 150_000,
      meetsTarget: true,
    },
    confirmation: BASELINE_CONFIRMATION,
    ...overrides,
  };
}

function interpretation(priceCents, marker = 'ED-DEMO-V2', overrides = {}) {
  const literal = formatUsd(priceCents);
  return {
    candidateCount: 1,
    priceLiteral: literal,
    unitPriceCents: priceCents,
    supportingPassage: `${marker}\nFolding chairs are listed at ${literal} per unit for standard one-day pickup.`,
    item: 'folding chairs',
    unitBasis: 'units',
    currency: 'USD',
    comparability: { item: 'same', unitBasis: 'same', currency: 'same', terms: 'same' },
    alternatives: [],
    uncertainties: [],
    ...overrides,
  };
}

function tavilyBody(priceCents, version = 'v2', extra = '') {
  const url = version === 'v1' ? V1 : V2;
  const marker = version === 'v1' ? 'ED-DEMO-V1' : 'ED-DEMO-V2';
  const literal = formatUsd(priceCents);
  return {
    results: [{
      url,
      raw_content: `${marker}\nFolding chairs are listed at ${literal} per unit for standard one-day pickup.${extra}`,
    }],
    failed_results: [],
    request_id: `request-${priceCents}`,
    usage: { credits: 1 },
  };
}

async function fixture(t, overrides = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'evidence-domino-'));
  t.after(async () => rm(root, { recursive: true, force: true }));
  await runCommand('init', initInput(overrides), { dataDir: root });
  return root;
}

async function setScenario(root, scenario) {
  const target = path.join(root, `curl-scenario-${Date.now()}-${Math.random()}.json`);
  await writeFile(target, JSON.stringify(scenario));
  process.env.EVIDENCE_DOMINO_TEST_CURL_BIN = MOCK_CURL;
  process.env.EVIDENCE_DOMINO_TEST_SCENARIO = target;
  return target;
}

async function capture(root, priceCents, version = 'v2', extra = '') {
  await setScenario(root, { default: { body: tavilyBody(priceCents, version, extra), httpStatus: 200 } });
  return runCommand('capture', { replayVersion: version }, { dataDir: root });
}

async function captureAndStage(root, priceCents, version = 'v2', interpretationOverrides = {}, extra = '') {
  const captured = await capture(root, priceCents, version, extra);
  const staged = await runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(priceCents, version === 'v1' ? 'ED-DEMO-V1' : 'ED-DEMO-V2', interpretationOverrides),
  }, { dataDir: root });
  return { captured, staged };
}

async function expectCode(promise, code) {
  await assert.rejects(promise, (error) => error instanceof EvidenceDominoError && error.code === code);
}

function approval(staged) {
  return { reviewId: staged.reviewId, revisionId: staged.revisionId, reviewHash: staged.reviewHash,
    confirmation: staged.requiredConfirmation };
}

test('F1 rejects extra changing numerical claims in minimum sentences before storing a baseline', async (t) => {
  for (const sentence of [
    'Our $2,000 remaining meets the $1,500 minimum with $500 to spare.',
    'This meets our minimum remaining amount of $1,500, with two days to spare.',
    'This does not meet our minimum remaining amount of $1,500.',
  ]) {
    const root = await mkdtemp(path.join(os.tmpdir(), 'ed-minimum-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    const input = initInput({ document: DOCUMENT.replace(ANCHORS.minimum, sentence), anchors: { ...ANCHORS, minimum: sentence } });
    await assert.rejects(runCommand('init', input, { dataDir: root }), error =>
      error.code === 'UNSUPPORTED_MINIMUM_SENTENCE' && error.details.suggestion === ANCHORS.minimum);
    await assert.rejects(readFile(path.join(root, 'active.json')), { code: 'ENOENT' });
  }
  const failing = initInput();
  failing.baselineUnitPriceCents = 5500;
  failing.baselineEvidence = { ...failing.baselineEvidence, priceLiteral: '$55', supportingPassage: 'Chairs cost $55 per unit.' };
  failing.anchors = { cost: 'We need 100 units at $55 each, costing $5,500.', remaining: 'Our $6,000 customer quote leaves $500 before other costs.', minimum: 'Our $500 remaining misses the $1,500 minimum by $1,000.' };
  failing.document = Object.values(failing.anchors).join('\n');
  failing.documentValues = { ...failing.documentValues, unitPriceCents: 5500, trackedCostCents: 550000, remainingCents: 50000, meetsTarget: false };
  const root = await mkdtemp(path.join(os.tmpdir(), 'ed-failing-minimum-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await expectCode(runCommand('init', failing, { dataDir: root }), 'UNSUPPORTED_MINIMUM_SENTENCE');
});

test('F2 newer uninterpreted evidence blocks approval; validated identical material reuses original review', async (t) => {
  const root = await fixture(t);
  const { staged } = await captureAndStage(root, 5500);
  const newer = await capture(root, 5500);
  await expectCode(runCommand('approve', approval(staged), { dataDir: root }), 'STALE_APPROVAL');
  const duplicate = await runCommand('stage', { captureId: newer.captureId, interpretation: interpretation(5500) }, { dataDir: root });
  assert.equal(duplicate.status, 'duplicate_suppressed');
  assert.equal(duplicate.existingReviewId, staged.reviewId);
  const adopted = await runCommand('approve', approval(staged), { dataDir: root });
  assert.equal(adopted.status, 'approved');
});

test('F2 a reserved but unfinished capture blocks older approval', async (t) => {
  const root = await fixture(t);
  const { staged } = await captureAndStage(root, 5500);
  const slow = path.join(root, 'slow-curl.mjs');
  await writeFile(slow, '#!/usr/bin/env node\nsetTimeout(() => process.stdout.write(' + JSON.stringify(JSON.stringify(tavilyBody(5500)) + '\n__ED_HTTP_STATUS__:200') + '), 300);\n', { mode: 0o700 });
  process.env.EVIDENCE_DOMINO_TEST_CURL_BIN = slow;
  const running = runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  for (let i = 0; i < 100; i++) {
    const active = JSON.parse(await readFile(path.join(root, 'active.json')));
    if (active.latestCaptureSequence === 2) break;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  await expectCode(runCommand('approve', approval(staged), { dataDir: root }), 'STALE_APPROVAL');
  await running;
});

test('F3 malformed top-level responses are preserved and recorded without losing baseline', async (t) => {
  const root = await fixture(t);
  for (const raw of ['null', 'true', '42', '"text"', '[]', '{}', '{broken']) {
    await setScenario(root, { default: { raw, httpStatus: 200 } });
    const captured = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
    assert.equal(captured.error.code, 'MALFORMED_RESPONSE');
    assert.equal(captured.attempts, 1);
    assert.equal(await readFile(captured.rawResponsePaths[0], 'utf8'), raw);
    const active = JSON.parse(await readFile(path.join(root, 'active.json')));
    assert.equal(active.currentBaselineVersion, 1);
    assert.equal(active.latestObservation.disposition, 'capture_failed');
  }
});

test('F4 oversize bodies get one attempt, bounded truthful diagnostics and typed failure', async (t) => {
  const root = await fixture(t);
  for (const size of [1048577, 1200000]) {
    const binary = path.join(root, 'oversize-curl.mjs');
    await writeFile(binary, '#!/usr/bin/env node\nprocess.stdout.write("a".repeat(' + size + ') + "\\n__ED_HTTP_STATUS__:200");\n', { mode: 0o700 });
    process.env.EVIDENCE_DOMINO_TEST_CURL_BIN = binary;
    const captured = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
    assert.equal(captured.error.code, 'RESPONSE_TOO_LARGE');
    assert.equal(captured.attempts, 1);
    const record = JSON.parse(await readFile(captured.captureRecord));
    assert.equal(record.attempts[0].responseComplete, false);
    assert.equal(record.attempts[0].responseTruncated, true);
    const raw = await readFile(captured.rawResponsePaths[0]);
    assert.ok(raw.length > 0 && raw.length <= 1048576);
    assert.equal(record.attempts[0].responseBytes, raw.length);
    assert.ok(record.attempts[0].observedResponseBytes >= raw.length);
  }
  const active = JSON.parse(await readFile(path.join(root, 'active.json')));
  assert.equal(active.dailyAttempts.count, 2);
  assert.equal(active.currentBaselineVersion, 1);
});

test('F5 signed and accounting expressions cannot pass as positive tokens; Markdown lists remain valid', () => {
  for (const value of ['Price - $55 USD', 'Price − $55', 'Price -$55', 'Price −$55', 'Price + $55', 'Price ($55)', 'Price ( $55 )', 'Price - USD 55', 'Price - 55 USD']) {
    assert.equal(containsExactUsdAmount(value, 5500), false, value);
  }
  for (const value of ['Price $55', '- $55 per unit', 'Prices:\n  - $55 per unit']) {
    assert.equal(containsExactUsdAmount(value, 5500), true, value);
  }
  assert.equal(containsExactUsdAmount('Remaining −$55', -5500), true);
});

test('F5 separated negative document and source prices fail validation', async (t) => {
  const negative = ANCHORS.remaining.replace('$2,000', '- $2,000');
  const root = await mkdtemp(path.join(os.tmpdir(), 'ed-signed-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await expectCode(runCommand('init', initInput({ anchors: { ...ANCHORS, remaining: negative }, document: DOCUMENT.replace(ANCHORS.remaining, negative) }), { dataDir: root }), 'INCONSISTENT_DRAFT');
  await runCommand('init', initInput(), { dataDir: root });
  const passage = 'ED-DEMO-V2\nFolding chairs are listed at - $55.00 per unit for standard one-day pickup.';
  await setScenario(root, { default: { body: { results: [{ url: V2, raw_content: passage }] }, httpStatus: 200 } });
  const captured = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  await assert.rejects(runCommand('stage', { captureId: captured.captureId, interpretation: interpretation(5500, 'ED-DEMO-V2', { supportingPassage: passage }) }, { dataDir: root }));
});

test('F6 whole quantities exclude signed, fractional, decimal and monetary substrings', async (t) => {
  for (const value of ['-100', '−100', '- 100', '− 100', '+100', '1/100', '1 / 100', '100/2', '100 / 2', '$ 100', 'USD 100', '100 USD', '100.5', '0.100', '100%', '100 %', '1⁄100', '1 ⁄ 100', '1∕100', '100⁄2']) {
    assert.equal(containsExactWholeNumber('We need ' + value + ' units', 100), false, value);
    const cost = ANCHORS.cost.replace('100 units', value + ' units');
    const root = await mkdtemp(path.join(os.tmpdir(), 'ed-quantity-'));
    t.after(() => rm(root, { recursive: true, force: true }));
    await expectCode(runCommand('init', initInput({ anchors: { ...ANCHORS, cost }, document: DOCUMENT.replace(ANCHORS.cost, cost) }), { dataDir: root }), 'INCONSISTENT_DRAFT');
  }
  assert.equal(containsExactWholeNumber('We need 3 named backpacks', 3), true);
  assert.equal(containsExactWholeNumber('We need 1,000 named backpacks', 1000), true);
});

test('baseline metadata corruption invalidates approval', async (t) => {
  const root = await fixture(t);
  const { staged } = await captureAndStage(root, 5500);
  const file = path.join(root, 'baselines', 'v0001', 'baseline.json');
  const baseline = JSON.parse(await readFile(file));
  baseline.unitPriceCents = 4100;
  await writeFile(file, JSON.stringify(baseline));
  await expectCode(runCommand('approve', approval(staged), { dataDir: root }), 'STALE_APPROVAL');
});

test('F1 a legacy rich minimum baseline cannot be staged after upgrade', async (t) => {
  const root = await fixture(t);
  const baseDir = path.join(root, 'baselines', 'v0001');
  const recordPath = path.join(baseDir, 'baseline.json');
  const baseline = JSON.parse(await readFile(recordPath));
  const sentence = 'Our $2,000 remaining meets the $1,500 minimum with $500 to spare.';
  const document = DOCUMENT.replace(ANCHORS.minimum, sentence);
  baseline.anchors.minimum = sentence;
  baseline.documentHash = createHash('sha256').update(document).digest('hex');
  await writeFile(path.join(baseDir, 'document.md'), document);
  await writeFile(recordPath, JSON.stringify(baseline));
  const captured = await capture(root, 4200);
  await expectCode(runCommand('stage', { captureId: captured.captureId, interpretation: interpretation(4200) }, { dataDir: root }), 'UNSUPPORTED_MINIMUM_SENTENCE');
  assert.equal(JSON.parse(await readFile(path.join(root, 'active.json'))).currentBaselineVersion, 1);
});

test('F4 oversized UTF-8 retains the exact bounded byte prefix even at a split character', async (t) => {
  const root = await fixture(t);
  const binary = path.join(root, 'unicode-curl.mjs');
  await writeFile(binary, '#!/usr/bin/env node\nprocess.stdout.write("€".repeat(350000) + "\\n__ED_HTTP_STATUS__:200");\n', { mode: 0o700 });
  process.env.EVIDENCE_DOMINO_TEST_CURL_BIN = binary;
  const captured = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  assert.equal(captured.error.code, 'RESPONSE_TOO_LARGE');
  assert.equal(captured.attempts, 1);
  const raw = await readFile(captured.rawResponsePaths[0]);
  assert.ok(raw.length <= 1048576 && raw.length > 1048500);
  assert.deepEqual(raw, Buffer.from('€'.repeat(350000)).subarray(0, 1048576));
  const record = JSON.parse(await readFile(captured.captureRecord));
  assert.equal(record.attempts[0].responseComplete, false);
  assert.equal(record.attempts[0].responseBytes, raw.length);
  assert.equal(record.attempts[0].responseHash, createHash('sha256').update(raw).digest('hex'));
});

test('legacy reviews without baseline hashes fail approval and regenerate on identical evidence', async (t) => {
  const root = await fixture(t);
  const { staged } = await captureAndStage(root, 5500);
  const recordPath = path.join(root, 'reviews', staged.reviewId, 'review.json');
  const review = JSON.parse(await readFile(recordPath));
  delete review.baselineRecordHash;
  delete review.reviewHash;
  const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
  review.reviewHash = createHash('sha256').update(JSON.stringify(stable(review))).digest('hex');
  await writeFile(recordPath, JSON.stringify(review));
  await expectCode(runCommand('approve', { ...approval(staged), reviewHash: review.reviewHash }, { dataDir: root }), 'STALE_APPROVAL');
  const regenerated = await captureAndStage(root, 5500);
  assert.equal(regenerated.staged.status, 'awaiting_applicability_review');
  assert.notEqual(regenerated.staged.reviewId, staged.reviewId);
  assert.equal((await runCommand('approve', approval(regenerated.staged), { dataDir: root })).status, 'approved');
});
