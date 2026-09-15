import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile, mkdir, rename } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

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

test('integer-cent arithmetic covers boundary, negative, improvement, cents, and non-demo values', () => {
  const cases = [
    [4_000, 400_000, 200_000, true, 0],
    [4_200, 420_000, 180_000, true, 0],
    [4_500, 450_000, 150_000, true, 0],
    [4_501, 450_100, 149_900, false, 100],
    [5_500, 550_000, 50_000, false, 100_000],
    [7_000, 700_000, -100_000, false, 250_000],
    [3_500, 350_000, 250_000, true, 0],
    [4_001, 400_100, 199_900, true, 0],
  ];
  for (const [price, cost, remaining, meets, shortfall] of cases) {
    assert.deepEqual(calculate(100, price, 600_000, 150_000), {
      trackedCostCents: cost,
      remainingCents: remaining,
      meetsTarget: meets,
      shortfallCents: shortfall,
    });
  }
  assert.deepEqual(calculate(17, 1_234, 30_000, 5_000), {
    trackedCostCents: 20_978,
    remainingCents: 9_022,
    meetsTarget: true,
    shortfallCents: 0,
  });
  assert.equal(formatUsd(-100_000), '−$1,000');
  assert.throws(() => calculate(1_000_000_000, 1_000_000_000, 1, 0), { code: 'AMOUNT_OUT_OF_RANGE' });
});

test('USD token matching rejects numeric prefixes and accepts exact formatted equivalents', () => {
  assert.equal(containsExactUsdAmount('Listed at $55.', 500), false);
  assert.equal(containsExactUsdAmount('Listed at $45.01.', 4_500), false);
  assert.equal(containsExactUsdAmount('Options cost $400 or $4,000.', 4_000), false);
  assert.equal(containsExactUsdAmount('Listed at $40.', 4_000), true);
  assert.equal(containsExactUsdAmount('Listed at $40.00.', 4_000), true);
  assert.equal(containsExactUsdAmount('Listed at USD 40 and 4,000 USD.', 4_000), true);
  assert.equal(containsExactUsdAmount('Listed at USD 40 and 4,000 USD.', 400_000), true);
  assert.equal(containsExactUsdAmount('Remaining is -$1,000.', -100_000), true);
  assert.equal(containsExactUsdAmount('Remaining is −$1,000.', -100_000), true);
  assert.equal(containsExactUsdAmount('Remaining is -$5.', 500), false);
  assert.equal(containsExactQuantityAndBasis('We need 100 units today.', 100, 'units'), true);
  assert.equal(containsExactQuantityAndBasis('We need 10 units today.', 100, 'units'), false);
  assert.equal(containsExactWholeNumber('The plan rents 3 named backpacks.', 3), true);
  assert.equal(containsExactWholeNumber('The plan rents 13 named backpacks.', 3), false);
  assert.equal(containsExactWholeNumber('The plan rents 3.5 named backpacks.', 3), false);
});

test('init accepts owner-confirmed natural sentence wording', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'evidence-domino-natural-'));
  t.after(async () => rm(root, { recursive: true, force: true }));
  const document = `# Harbor Glow Reception

Service date: November 7, 2026.

The plan rents 3 Pacsafe Go 15L Anti-Theft Backpacks at $109.95 each, for a tracked supplier cost of $329.85.

The fixed client fee of $500.00 leaves $170.15 after this supplier line and before all other costs.

That remaining amount satisfies our minimum buffer of $150.00.`;
  const anchors = {
    cost: 'The plan rents 3 Pacsafe Go 15L Anti-Theft Backpacks at $109.95 each, for a tracked supplier cost of $329.85.',
    remaining: 'The fixed client fee of $500.00 leaves $170.15 after this supplier line and before all other costs.',
    minimum: 'That remaining amount satisfies our minimum buffer of $150.00.',
  };
  await runCommand('init', initInput({
    mode: 'live',
    controlledReplay: undefined,
    sourceUrl: 'https://supplier.example.test/pacsafe-backpack',
    item: 'Pacsafe Go 15L Anti-Theft Backpack',
    unitBasis: 'one backpack',
    quantity: 3,
    customerQuoteCents: 50_000,
    minimumRemainingCents: 15_000,
    baselineUnitPriceCents: 10_995,
    baselineEvidence: {
      priceLiteral: '$109.95',
      supportingPassage: 'Pacsafe Go 15L Anti-Theft Backpack. $109.95 USD.',
      sourceUrl: 'https://supplier.example.test/pacsafe-backpack',
    },
    document,
    anchors,
    documentValues: {
      quantity: 3,
      unitPriceCents: 10_995,
      trackedCostCents: 32_985,
      customerQuoteCents: 50_000,
      remainingCents: 17_015,
      minimumRemainingCents: 15_000,
      meetsTarget: true,
    },
  }), { dataDir: root });
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.baseline.version, 1);
  const storedBaseline = JSON.parse(await readFile(path.join(root, 'baselines', 'v0001', 'baseline.json'), 'utf8'));
  assert.deepEqual(storedBaseline.anchors, anchors);
});

test('init preserves an immutable baseline and labels a pre-existing shortfall honestly', async (t) => {
  const root = await fixture(t, {
    minimumRemainingCents: 250_000,
    document: DOCUMENT.replace(
      'This meets our minimum remaining amount of $1,500.',
      'This does not meet our minimum remaining amount of $2,500.',
    ),
    anchors: { ...ANCHORS, minimum: 'This does not meet our minimum remaining amount of $2,500.' },
    documentValues: {
      quantity: 100,
      unitPriceCents: 4_000,
      trackedCostCents: 400_000,
      customerQuoteCents: 600_000,
      remainingCents: 200_000,
      minimumRemainingCents: 250_000,
      meetsTarget: false,
    },
  });
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.baseline.conditionStatus, 'existing_issue');
  assert.equal(
    await readFile(path.join(root, 'original.md'), 'utf8'),
    DOCUMENT.replace(
      'This meets our minimum remaining amount of $1,500.',
      'This does not meet our minimum remaining amount of $2,500.',
    ),
  );
});

test('init rejects an inconsistent draft, duplicate anchors, overlap, private URLs, and missing confirmation', async (t) => {
  const roots = [];
  t.after(async () => Promise.all(roots.map((root) => rm(root, { recursive: true, force: true }))));
  const nextRoot = async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'evidence-domino-invalid-'));
    roots.push(root);
    return root;
  };
  await expectCode(runCommand('init', initInput({
    documentValues: { ...initInput().documentValues, remainingCents: 200_001 },
  }), { dataDir: await nextRoot() }), 'INCONSISTENT_DRAFT');

  assert.throws(() => validateAnchors('A one. A one. B two. C three.', {
    cost: 'A one.', remaining: 'B two.', minimum: 'C three.',
  }), { code: 'ANCHOR_NOT_UNIQUE' });
  assert.throws(() => validateAnchors('ABC DEF GHI and final.', {
    cost: 'ABC DEF', remaining: 'DEF GHI', minimum: 'final.',
  }), { code: 'ANCHORS_OVERLAP' });
  await expectCode(runCommand('init', initInput({ sourceUrl: 'https://127.0.0.1/source' }), { dataDir: await nextRoot() }), 'INVALID_SOURCE_URL');
  await expectCode(runCommand('init', initInput({ confirmation: 'yes' }), { dataDir: await nextRoot() }), 'OWNER_CONFIRMATION_REQUIRED');

  const decimalDocument = DOCUMENT
    .replace('at $40 each, costing $4,000', 'at $45 each, costing $4,501')
    .replace('leaves $2,000', 'leaves $1,499')
    .replace('This meets our minimum remaining amount', 'This does not meet our minimum remaining amount');
  await expectCode(runCommand('init', initInput({
    baselineUnitPriceCents: 4_501,
    baselineEvidence: {
      priceLiteral: '$45.01',
      supportingPassage: 'Folding chairs were listed at $45.01 per unit.',
      sourceUrl: V1,
    },
    document: decimalDocument,
    anchors: {
      cost: 'We need 100 units at $45 each, costing $4,501.',
      remaining: 'Our $6,000 customer quote leaves $1,499 before other costs.',
      minimum: 'This does not meet our minimum remaining amount of $1,500.',
    },
    documentValues: {
      quantity: 100,
      unitPriceCents: 4_501,
      trackedCostCents: 450_100,
      customerQuoteCents: 600_000,
      remainingCents: 149_900,
      minimumRemainingCents: 150_000,
      meetsTarget: false,
    },
  }), { dataDir: await nextRoot() }), 'INCONSISTENT_DRAFT');

  const prefixDocument = DOCUMENT.replace('at $40 each', 'at $400 each');
  await expectCode(runCommand('init', initInput({
    document: prefixDocument,
    anchors: { ...ANCHORS, cost: 'We need 100 units at $400 each, costing $4,000.' },
  }), { dataDir: await nextRoot() }), 'INCONSISTENT_DRAFT');

  const wrongQuantityDocument = DOCUMENT.replace('We need 100 units', 'We need 10 units');
  await expectCode(runCommand('init', initInput({
    document: wrongQuantityDocument,
    anchors: { ...ANCHORS, cost: 'We need 10 units at $40 each, costing $4,000.' },
  }), { dataDir: await nextRoot() }), 'INCONSISTENT_DRAFT');

});

test('negative initial remaining is accepted only as a complete signed money token', async (t) => {
  const negativeDocument = DOCUMENT
    .replace('at $40 each, costing $4,000', 'at $70 each, costing $7,000')
    .replace('leaves $2,000', 'leaves −$1,000')
    .replace('This meets our minimum remaining amount', 'This does not meet our minimum remaining amount');
  const root = await fixture(t, {
    baselineUnitPriceCents: 7_000,
    baselineEvidence: {
      priceLiteral: '$70',
      supportingPassage: 'Folding chairs were listed at $70 per unit.',
      sourceUrl: V1,
    },
    document: negativeDocument,
    anchors: {
      cost: 'We need 100 units at $70 each, costing $7,000.',
      remaining: 'Our $6,000 customer quote leaves −$1,000 before other costs.',
      minimum: 'This does not meet our minimum remaining amount of $1,500.',
    },
    documentValues: {
      quantity: 100,
      unitPriceCents: 7_000,
      trackedCostCents: 700_000,
      customerQuoteCents: 600_000,
      remainingCents: -100_000,
      minimumRemainingCents: 150_000,
      meetsTarget: false,
    },
  });
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.baseline.calculation.remainingCents, -100_000);
});

test('public DNS names with IPv6-like prefixes are allowed while credential query keys are rejected', async (t) => {
  const allowedRoot = await mkdtemp(path.join(os.tmpdir(), 'evidence-domino-url-'));
  const rejectedRoot = await mkdtemp(path.join(os.tmpdir(), 'evidence-domino-url-'));
  t.after(async () => Promise.all([
    rm(allowedRoot, { recursive: true, force: true }),
    rm(rejectedRoot, { recursive: true, force: true }),
  ]));
  const allowedUrl = 'https://fc-supplies.example/rates';
  await runCommand('init', initInput({
    mode: 'live',
    controlledReplay: undefined,
    sourceUrl: allowedUrl,
    baselineEvidence: { ...initInput().baselineEvidence, sourceUrl: allowedUrl },
  }), { dataDir: allowedRoot });
  assert.equal((await runCommand('status', {}, { dataDir: allowedRoot })).baseline.version, 1);

  const credentialUrl = 'https://supplier.example.test/rates?api_key=secret-value';
  await expectCode(runCommand('init', initInput({
    mode: 'live',
    controlledReplay: undefined,
    sourceUrl: credentialUrl,
    baselineEvidence: { ...initInput().baselineEvidence, sourceUrl: credentialUrl },
  }), { dataDir: rejectedRoot }), 'CREDENTIAL_IN_SOURCE_URL');
});

test('capture uses a bounded retry, preserves exact raw responses, records usage, and spends each attempt', async (t) => {
  const root = await fixture(t);
  const firstRaw = JSON.stringify({ detail: { error: 'Internal Server Error' } });
  const secondBody = tavilyBody(5_500);
  await setScenario(root, { responses: [
    { raw: firstRaw, httpStatus: 500 },
    { body: secondBody, httpStatus: 200 },
  ] });
  const result = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  assert.equal(result.status, 'captured');
  assert.equal(result.attempts, 2);
  assert.deepEqual(result.usage, { credits: 1 });
  assert.equal(await readFile(path.join(root, 'captures', result.captureId, 'attempt-01.raw'), 'utf8'), firstRaw);
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.requestBudget.used, 2);
});

test('capture records non-retriable quota and malformed failures without changing the baseline', async (t) => {
  const root = await fixture(t);
  await setScenario(root, { default: { body: { detail: { error: 'rate limited' } }, httpStatus: 429 } });
  const limited = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  assert.equal(limited.status, 'failed');
  assert.equal(limited.attempts, 1);
  const malformedRaw = '{bad json';
  await setScenario(root, { default: { raw: malformedRaw, httpStatus: 200 } });
  const malformed = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  assert.equal(malformed.error.code, 'MALFORMED_RESPONSE');
  assert.equal(
    await readFile(path.join(root, 'captures', malformed.captureId, 'attempt-01.raw'), 'utf8'),
    malformedRaw,
    'the malformed body must survive capture publication exactly',
  );
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.baseline.version, 1);
  assert.equal(status.baseline.unitPriceCents, 4_000);
});

test('capture retains invalid UTF-8 bytes exactly and fails before evidence interpretation', async (t) => {
  const root = await fixture(t);
  const baselineBefore = (await runCommand('status', {}, { dataDir: root })).baseline;
  const body = JSON.stringify(tavilyBody(5_500, 'v2', ' BYTE_MARKER'));
  const [before, after] = body.split('BYTE_MARKER');
  const invalidSequences = [Buffer.from([0xff]), Buffer.from([0xc0, 0xaf]), Buffer.from([0xe2, 0x82])];
  for (const invalid of invalidSequences) {
    const raw = Buffer.concat([Buffer.from(before), invalid, Buffer.from(after)]);
    await setScenario(root, { default: { rawBase64: raw.toString('base64'), httpStatus: 200 } });
    const captured = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
    assert.equal(captured.status, 'failed');
    assert.equal(captured.error.code, 'INVALID_UTF8_RESPONSE');
    assert.equal(captured.attempts, 1);
    assert.equal(captured.contentPath, null);
    assert.deepEqual(await readFile(captured.rawResponsePaths[0]), raw);
    const record = JSON.parse(await readFile(captured.captureRecord, 'utf8'));
    assert.equal(record.attempts[0].responseBytes, raw.length);
    assert.equal(record.attempts[0].responseHash, createHash('sha256').update(raw).digest('hex'));
    assert.equal(record.attempts[0].responseComplete, true, 'the transport completed even though its encoding was invalid');
    assert.equal(record.attempts[0].responseTruncated, false);
    const status = await runCommand('status', {}, { dataDir: root });
    assert.deepEqual(status.baseline, baselineBefore);
    assert.equal(status.latestObservation.disposition, 'capture_failed');
    assert.equal(status.pendingApplicabilityReviewId, null);
  }
  assert.equal((await runCommand('status', {}, { dataDir: root })).requestBudget.used, invalidSequences.length);
});

test('capture preserves complete valid UTF-8 bodies and decodes their content without changing bytes', async (t) => {
  const root = await fixture(t);
  const body = tavilyBody(5_500, 'v2', ' Rīga — café, 中文.');
  const raw = Buffer.from(JSON.stringify(body), 'utf8');
  await setScenario(root, { default: { rawBase64: raw.toString('base64'), httpStatus: 200 } });
  const captured = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  assert.equal(captured.status, 'captured');
  assert.deepEqual(await readFile(captured.rawResponsePaths[0]), raw);
  assert.equal(await readFile(captured.contentPath, 'utf8'), body.results[0].raw_content);
  const record = JSON.parse(await readFile(captured.captureRecord, 'utf8'));
  assert.equal(record.attempts[0].responseBytes, raw.length);
  assert.equal(record.attempts[0].responseHash, createHash('sha256').update(raw).digest('hex'));
});

test('capture never follows redirects and records a 3xx as one failed transmission', async (t) => {
  const root = await fixture(t);
  const argsPath = path.join(root, 'redirect-curl-args.json');
  await setScenario(root, {
    argsPath,
    default: { raw: '<html>moved</html>', httpStatus: 302 },
  });
  const result = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  assert.equal(result.status, 'failed');
  assert.equal(result.error.code, 'HTTP_302');
  assert.equal(result.attempts, 1);
  const observed = JSON.parse(await readFile(argsPath, 'utf8'));
  assert.ok(!observed.args.includes('--location'));
  assert.ok(!observed.args.includes('--max-redirs'));
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.requestBudget.used, 1);
  assert.equal(status.latestObservation.disposition, 'capture_failed');
});

test('capture sends only keyless Tavily auth and never exposes an API key to curl', async (t) => {
  const root = await fixture(t);
  const argsPath = path.join(root, 'curl-args.json');
  const oldKey = process.env.TAVILY_API_KEY;
  process.env.TAVILY_API_KEY = 'tvly-must-not-reach-child';
  t.after(() => {
    if (oldKey === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = oldKey;
  });
  await setScenario(root, { argsPath, default: { body: tavilyBody(5_500), httpStatus: 200 } });
  const result = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  assert.equal(result.status, 'captured');
  const observed = JSON.parse(await readFile(argsPath, 'utf8'));
  const args = observed.args;
  assert.ok(args.includes('X-Tavily-Access-Mode: keyless'));
  assert.ok(!args.some((arg) => /authorization/i.test(arg)));
  assert.ok(!args.some((arg) => arg.includes('tvly-must-not-reach-child')));
  assert.equal(observed.tavilyApiKey, null);
});

test('controlled replay enforces declared URL and marker; live projects forbid source overrides', async (t) => {
  const root = await fixture(t);
  await setScenario(root, { default: { body: tavilyBody(5_500, 'v2').results.map ? {
    ...tavilyBody(5_500, 'v2'),
    results: [{ url: V2, raw_content: 'wrong marker $55' }],
  } : {}, httpStatus: 200 } });
  const wrongMarker = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  assert.equal(wrongMarker.error.code, 'REPLAY_MARKER_MISMATCH');

  const liveRoot = await mkdtemp(path.join(os.tmpdir(), 'evidence-domino-live-'));
  t.after(async () => rm(liveRoot, { recursive: true, force: true }));
  const live = initInput({ mode: 'live', controlledReplay: undefined });
  await runCommand('init', live, { dataDir: liveRoot });
  await expectCode(runCommand('capture', { sourceUrl: V2 }, { dataDir: liveRoot }), 'SOURCE_OVERRIDE_FORBIDDEN');
});

test('stage at $42 changes cost and remaining sentences but preserves the true minimum sentence', async (t) => {
  const root = await fixture(t);
  const { staged } = await captureAndStage(root, 4_200);
  assert.equal(staged.status, 'awaiting_applicability_review');
  assert.deepEqual(staged.changedRoles, ['cost', 'remaining']);
  const proposed = await readFile(staged.proposedDocument, 'utf8');
  assert.match(proposed, /at \$42 each, costing \$4,200/);
  assert.match(proposed, /leaves \$1,800 before other costs/);
  assert.match(proposed, /This meets our minimum remaining amount of \$1,500\./);
  assert.match(proposed, /Event date: October 18, 2026\./);
});

test('stage renders the exact conditional shortfall, escaped evidence, immutable artifacts, and a proposed revision', async (t) => {
  const root = await fixture(t);
  const extra = '\n<script>alert("source")</script>';
  const supportingPassage = `ED-DEMO-V2\nFolding chairs are listed at $55 per unit for standard one-day pickup.${extra}`;
  const { staged } = await captureAndStage(root, 5_500, 'v2', { supportingPassage }, extra);
  assert.equal(staged.headline, 'At this listed price, your draft would miss its target by $1,000.');
  assert.deepEqual(staged.calculation, {
    trackedCostCents: 550_000,
    remainingCents: 50_000,
    meetsTarget: false,
    shortfallCents: 100_000,
  });
  assert.deepEqual(staged.changedRoles, ['cost', 'remaining', 'minimum']);
  const html = await readFile(staged.reportHtml, 'utf8');
  assert.match(html, /Applicability awaiting review/);
  assert.match(html, /Controlled source replay/);
  assert.match(html, /Previous owner-confirmed passage/);
  assert.match(html, /Folding chairs were listed at \$40 per unit/);
  assert.match(html, /New Tavily-returned passage/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x onerror=alert/);
  assert.match(html, /Event date: October 18, 2026/);
  const unitCard = html.indexOf('<small>Unit price</small>');
  const remainingCard = html.indexOf('<small>Remaining before other costs</small>');
  const costCard = html.indexOf('<small>Tracked supplier cost</small>');
  assert.ok(unitCard < remainingCard && remainingCard < costCard);
  assert.match(html, /\$2,000 → \$500/);
  assert.match(html, /href="https:\/\/supplier\.example\.test\/chairs-v1"/);
  assert.match(html, /href="https:\/\/supplier\.example\.test\/chairs-v2"/);
  assert.match(html, new RegExp(`Revision ID:<\\/strong> ${staged.revisionId}`));
  assert.match(html, new RegExp(`Confirm that this observed price applies and adopt revision ${staged.revisionId}\\.`));
  assert.match(html, /immutable snapshot\. Ask for current status in chat/);
  const markdown = await readFile(staged.reportMarkdown, 'utf8');
  assert.match(markdown, /Previous owner-confirmed draft source passage/);
  assert.match(markdown, /New Tavily-returned passage/);
  assert.match(markdown, /    <script>alert\("source"\)<\/script>/);
  assert.doesNotMatch(markdown, /^<script>/m);
  await assert.rejects(writeFile(path.join(path.dirname(staged.reportHtml), 'review.json'), '{}', { flag: 'wx' }));
});

test('same observed price records a check without creating an adoptable change', async (t) => {
  const root = await fixture(t);
  const { staged } = await captureAndStage(root, 4_000, 'v1');
  assert.equal(staged.status, 'no_material_change');
  assert.equal(staged.revisionId, null);
  assert.deepEqual(staged.changedRoles, []);
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.pendingApplicabilityReviewId, null);
  assert.equal(status.baseline.version, 1);
  const html = await readFile(staged.reportHtml, 'utf8');
  assert.match(html, /Revision ID:<\/strong> None/);
  assert.doesNotMatch(html, /Exact approval phrase/);
});

test('stage rejects ambiguity, different terms, absent evidence, price mismatch, and failed captures', async (t) => {
  const root = await fixture(t);
  const captured = await capture(root, 5_500);
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(5_500, 'ED-DEMO-V2', { candidateCount: 2, alternatives: ['$60'] }),
  }, { dataDir: root }), 'AMBIGUOUS_EVIDENCE');
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(5_500, 'ED-DEMO-V2', {
      comparability: { item: 'same', unitBasis: 'same', currency: 'same', terms: 'different' },
    }),
  }, { dataDir: root }), 'APPLICABILITY_REVIEW_REQUIRED');
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(5_500, 'ED-DEMO-V2', {
      currency: 'EUR',
      comparability: { item: 'same', unitBasis: 'same', currency: 'different', terms: 'same' },
    }),
  }, { dataDir: root }), 'UNSUPPORTED_CURRENCY');
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(5_500, 'ED-DEMO-V2', {
      unitBasis: 'boxes of ten',
      comparability: { item: 'same', unitBasis: 'different', currency: 'same', terms: 'same' },
    }),
  }, { dataDir: root }), 'APPLICABILITY_REVIEW_REQUIRED');
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(5_500, 'ED-DEMO-V2', {
      item: 'linen napkins',
      comparability: { item: 'different', unitBasis: 'same', currency: 'same', terms: 'same' },
    }),
  }, { dataDir: root }), 'APPLICABILITY_REVIEW_REQUIRED');
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(5_500, 'ED-DEMO-V2', { supportingPassage: 'Invented passage at $55.' }),
  }, { dataDir: root }), 'EVIDENCE_NOT_IN_CAPTURE');
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(500, 'ED-DEMO-V2', {
      priceLiteral: '$5',
      unitPriceCents: 500,
      supportingPassage: 'ED-DEMO-V2\nFolding chairs are listed at $55 per unit for standard one-day pickup.',
    }),
  }, { dataDir: root }), 'PRICE_NOT_IN_PASSAGE');
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(500, 'ED-DEMO-V2', {
      priceLiteral: '$5',
      unitPriceCents: 500,
      supportingPassage: 'ED-DEMO-V2\nFolding chairs are listed at $5',
    }),
  }, { dataDir: root }), 'PRICE_NOT_IN_PASSAGE');
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(5_500, 'ED-DEMO-V2', { unitPriceCents: 5_501 }),
  }, { dataDir: root }), 'PRICE_MISMATCH');
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(5_500, 'ED-DEMO-V2', {
      priceLiteral: '-$55',
      unitPriceCents: -5_500,
    }),
  }, { dataDir: root }), 'INVALID_INPUT');

  const decimalRoot = await fixture(t, { projectId: 'decimal-prefix-check' });
  const decimalCapture = await capture(decimalRoot, 4_501);
  await expectCode(runCommand('stage', {
    captureId: decimalCapture.captureId,
    interpretation: interpretation(4_500, 'ED-DEMO-V2', {
      priceLiteral: '$45',
      unitPriceCents: 4_500,
      supportingPassage: 'ED-DEMO-V2\nFolding chairs are listed at $45.01 per unit for standard one-day pickup.',
    }),
  }, { dataDir: decimalRoot }), 'PRICE_NOT_IN_PASSAGE');

  await setScenario(root, { default: { body: { detail: 'nope' }, httpStatus: 429 } });
  const failed = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  await expectCode(runCommand('stage', {
    captureId: failed.captureId,
    interpretation: interpretation(5_500),
  }, { dataDir: root }), 'CAPTURE_FAILED');
});

test('approval is explicit, hash-bound, version-bound, atomic, and idempotent', async (t) => {
  const root = await fixture(t);
  const { staged } = await captureAndStage(root, 5_500);
  const approval = {
    reviewId: staged.reviewId,
    revisionId: staged.revisionId,
    reviewHash: staged.reviewHash,
    confirmation: staged.requiredConfirmation,
  };
  await expectCode(runCommand('approve', { ...approval, confirmation: 'approve it' }, { dataDir: root }), 'OWNER_CONFIRMATION_REQUIRED');
  await expectCode(runCommand('approve', { ...approval, reviewHash: '0'.repeat(64) }, { dataDir: root }), 'REVIEW_INTEGRITY_FAILED');
  const adopted = await runCommand('approve', approval, { dataDir: root });
  assert.equal(adopted.status, 'approved');
  assert.equal(adopted.baselineVersion, 2);
  const document = await readFile(adopted.adoptedDocument, 'utf8');
  assert.match(document, /at \$55 each, costing \$5,500/);
  assert.match(document, /does not meet our minimum remaining amount of \$1,500/);
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.latestReview.statusWhenGenerated, 'awaiting_applicability_review');
  assert.equal(status.latestReview.currentDisposition, 'approved');
  assert.equal(status.pendingApplicabilityReviewId, null);
  const again = await runCommand('approve', approval, { dataDir: root });
  assert.equal(again.status, 'already_approved');
});

test('a failing minimum sentence stays accurate and unchanged across later failing prices', async (t) => {
  const root = await fixture(t);
  const at55 = await captureAndStage(root, 5_500);
  await runCommand('approve', {
    reviewId: at55.staged.reviewId,
    revisionId: at55.staged.revisionId,
    reviewHash: at55.staged.reviewHash,
    confirmation: at55.staged.requiredConfirmation,
  }, { dataDir: root });

  const at60 = await captureAndStage(root, 6_000);
  assert.deepEqual(at60.staged.changedRoles, ['cost', 'remaining']);
  let proposed = await readFile(at60.staged.proposedDocument, 'utf8');
  assert.match(proposed, /This does not meet our minimum remaining amount of \$1,500\./);
  assert.doesNotMatch(proposed, /by \$1,000/);
  await runCommand('approve', {
    reviewId: at60.staged.reviewId,
    revisionId: at60.staged.revisionId,
    reviewHash: at60.staged.reviewHash,
    confirmation: at60.staged.requiredConfirmation,
  }, { dataDir: root });

  const at65 = await captureAndStage(root, 6_500);
  assert.deepEqual(at65.staged.changedRoles, ['cost', 'remaining']);
  assert.equal(at65.staged.calculation.shortfallCents, 200_000);
  proposed = await readFile(at65.staged.proposedDocument, 'utf8');
  assert.match(proposed, /This does not meet our minimum remaining amount of \$1,500\./);
  assert.doesNotMatch(proposed, /by \$1,500|by \$2,000/);
});

test('a newer material review invalidates an older approval', async (t) => {
  const root = await fixture(t);
  const first = await captureAndStage(root, 5_500);
  const second = await captureAndStage(root, 4_200);
  assert.notEqual(first.staged.reviewId, second.staged.reviewId);
  await expectCode(runCommand('approve', {
    reviewId: first.staged.reviewId,
    revisionId: first.staged.revisionId,
    reviewHash: first.staged.reviewHash,
    confirmation: first.staged.requiredConfirmation,
  }, { dataDir: root }), 'STALE_APPROVAL');
});

test('a newer failed capture persists its disposition and invalidates an older pending review', async (t) => {
  const root = await fixture(t);
  const first = await captureAndStage(root, 5_500);
  await setScenario(root, { default: { body: { detail: { error: 'rate limited' } }, httpStatus: 429 } });
  const failed = await runCommand('capture', { replayVersion: 'v2' }, { dataDir: root });
  assert.equal(failed.status, 'failed');
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.latestObservation.sequence, failed.sequence);
  assert.equal(status.latestObservation.disposition, 'capture_failed');
  assert.equal(status.latestObservation.captureError.code, 'HTTP_429');
  assert.equal(status.pendingApplicabilityReviewId, null);
  await expectCode(runCommand('approve', {
    reviewId: first.staged.reviewId,
    revisionId: first.staged.revisionId,
    reviewHash: first.staged.reviewHash,
    confirmation: first.staged.requiredConfirmation,
  }, { dataDir: root }), 'STALE_APPROVAL');
});

test('newer ambiguous interpretation is visible, invalidates an older review, and can be repaired once', async (t) => {
  const root = await fixture(t);
  const first = await captureAndStage(root, 5_500);
  const ambiguousCapture = await capture(root, 4_200);
  const uncertain = interpretation(4_200, 'ED-DEMO-V2', {
    candidateCount: 2,
    alternatives: ['$43'],
    uncertainties: ['Two pickup terms appear applicable.'],
  });
  await expectCode(runCommand('stage', {
    captureId: ambiguousCapture.captureId,
    interpretation: uncertain,
  }, { dataDir: root }), 'AMBIGUOUS_EVIDENCE');
  let status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.latestObservation.disposition, 'interpretation_needs_review');
  assert.equal(status.latestObservation.sequence, ambiguousCapture.sequence);
  assert.deepEqual(status.latestObservation.interpretationUncertainty.alternatives, ['$43']);
  assert.deepEqual(status.latestObservation.interpretationUncertainty.uncertainties, ['Two pickup terms appear applicable.']);
  assert.equal(status.pendingApplicabilityReviewId, null);
  await expectCode(runCommand('approve', {
    reviewId: first.staged.reviewId,
    revisionId: first.staged.revisionId,
    reviewHash: first.staged.reviewHash,
    confirmation: first.staged.requiredConfirmation,
  }, { dataDir: root }), 'STALE_APPROVAL');

  const repaired = await runCommand('stage', {
    captureId: ambiguousCapture.captureId,
    interpretation: interpretation(4_200),
  }, { dataDir: root });
  assert.equal(repaired.status, 'awaiting_applicability_review');
  status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.latestObservation.disposition, 'review_staged');
  assert.equal(status.latestObservation.interpretationUncertainty, null);
  assert.equal(status.pendingApplicabilityReviewId, repaired.reviewId);
});

test('a delayed old stage cannot overwrite a newer ambiguous observation, while that same newer capture can be repaired', async (t) => {
  const root = await fixture(t, { projectId: 'delayed-stage-order' });
  const older = await capture(root, 5_500);
  const newer = await capture(root, 4_200);
  await expectCode(runCommand('stage', {
    captureId: newer.captureId,
    interpretation: interpretation(4_200, 'ED-DEMO-V2', {
      candidateCount: 2,
      alternatives: ['$43'],
      uncertainties: ['Pickup duration is unclear.'],
    }),
  }, { dataDir: root }), 'AMBIGUOUS_EVIDENCE');

  await expectCode(runCommand('stage', {
    captureId: older.captureId,
    interpretation: interpretation(5_500),
  }, { dataDir: root }), 'STALE_CAPTURE');
  let status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.latestObservation.sequence, newer.sequence);
  assert.equal(status.latestObservation.disposition, 'interpretation_needs_review');

  const repaired = await runCommand('stage', {
    captureId: newer.captureId,
    interpretation: interpretation(4_200),
  }, { dataDir: root });
  assert.equal(repaired.status, 'awaiting_applicability_review');
  status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.latestObservation.sequence, newer.sequence);
  assert.equal(status.latestObservation.disposition, 'review_staged');
  assert.equal(status.pendingApplicabilityReviewId, repaired.reviewId);
});

test('duplicate pending material is suppressed and a post-approval return to $40 is a new event', async (t) => {
  const root = await fixture(t);
  const first = await captureAndStage(root, 5_500);
  const duplicateCapture = await capture(root, 5_500);
  const duplicate = await runCommand('stage', {
    captureId: duplicateCapture.captureId,
    interpretation: interpretation(5_500),
  }, { dataDir: root });
  assert.equal(duplicate.status, 'duplicate_suppressed');
  assert.equal(duplicate.existingReviewId, first.staged.reviewId);
  await runCommand('approve', {
    reviewId: first.staged.reviewId,
    revisionId: first.staged.revisionId,
    reviewHash: first.staged.reviewHash,
    confirmation: first.staged.requiredConfirmation,
  }, { dataDir: root });
  const returned = await captureAndStage(root, 4_000, 'v1');
  assert.equal(returned.staged.status, 'awaiting_applicability_review');
  assert.match(returned.staged.headline, /leave \$2,000 before other costs/);
  assert.notEqual(returned.staged.reviewId, first.staged.reviewId);
});

test('out-of-order stages cannot let an older capture supersede a newer result', async (t) => {
  const root = await fixture(t);
  const older = await capture(root, 5_500);
  const newer = await capture(root, 4_200);
  const latest = await runCommand('stage', {
    captureId: newer.captureId,
    interpretation: interpretation(4_200),
  }, { dataDir: root });
  assert.equal(latest.status, 'awaiting_applicability_review');
  await expectCode(runCommand('stage', {
    captureId: older.captureId,
    interpretation: interpretation(5_500),
  }, { dataDir: root }), 'STALE_CAPTURE');
});

test('concurrent capture reservations allocate unique monotonic sequences', async (t) => {
  const root = await fixture(t);
  await setScenario(root, { default: { body: tavilyBody(5_500), httpStatus: 200 } });
  const results = await Promise.all(Array.from({ length: 5 }, () =>
    runCommand('capture', { replayVersion: 'v2' }, { dataDir: root })));
  assert.deepEqual(results.map((entry) => entry.sequence).sort((a, b) => a - b), [1, 2, 3, 4, 5]);
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.requestBudget.used, 5);
});

test('interrupted temporary publications do not replace the last complete baseline', async (t) => {
  const root = await fixture(t);
  const tempBaseline = path.join(root, 'baselines', 'v0002.tmp-interrupted');
  await mkdir(tempBaseline, { recursive: true });
  await writeFile(path.join(tempBaseline, 'baseline.json'), '{incomplete');
  await writeFile(path.join(root, 'active.json.tmp-interrupted'), '{incomplete');
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.baseline.version, 1);
  assert.equal(status.baseline.documentHash.length, 64);
});

test('stale document anchors and review tampering are detected', async (t) => {
  const root = await fixture(t);
  const captured = await capture(root, 5_500);
  const documentPath = path.join(root, 'baselines', 'v0001', 'document.md');
  await writeFile(documentPath, DOCUMENT.replace('We need', 'We require'));
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(5_500),
  }, { dataDir: root }), 'STATE_CORRUPT');

  const cleanRoot = await fixture(t, { projectId: 'tamper-check' });
  const { staged } = await captureAndStage(cleanRoot, 5_500);
  const reviewPath = path.join(cleanRoot, 'reviews', staged.reviewId, 'review.json');
  const review = JSON.parse(await readFile(reviewPath, 'utf8'));
  review.headline = 'tampered';
  await writeFile(reviewPath, JSON.stringify(review));
  await expectCode(runCommand('approve', {
    reviewId: staged.reviewId,
    revisionId: staged.revisionId,
    reviewHash: staged.reviewHash,
    confirmation: staged.requiredConfirmation,
  }, { dataDir: cleanRoot }), 'REVIEW_INTEGRITY_FAILED');

  const artifactRoot = await fixture(t, { projectId: 'artifact-tamper-check' });
  const artifactStage = await captureAndStage(artifactRoot, 5_500);
  await writeFile(artifactStage.staged.reportHtml, '<h1>changed after review</h1>');
  await expectCode(runCommand('approve', {
    reviewId: artifactStage.staged.reviewId,
    revisionId: artifactStage.staged.revisionId,
    reviewHash: artifactStage.staged.reviewHash,
    confirmation: artifactStage.staged.requiredConfirmation,
  }, { dataDir: artifactRoot }), 'REVIEW_INTEGRITY_FAILED');
});

test('capture content tampering is detected before interpretation can be staged', async (t) => {
  const root = await fixture(t);
  const captured = await capture(root, 5_500);
  await writeFile(path.join(root, 'captures', captured.captureId, 'content.md'), 'ED-DEMO-V2\nFolding chairs are listed at $1 per unit.');
  await expectCode(runCommand('stage', {
    captureId: captured.captureId,
    interpretation: interpretation(100, 'ED-DEMO-V2', {
      supportingPassage: 'ED-DEMO-V2\nFolding chairs are listed at $1 per unit.',
    }),
  }, { dataDir: root }), 'CAPTURE_INTEGRITY_FAILED');
});

test('daily budget exhaustion blocks another transmission and status exposes recovery guidance for locks', async (t) => {
  const root = await fixture(t);
  const activePath = path.join(root, 'active.json');
  const active = JSON.parse(await readFile(activePath, 'utf8'));
  active.dailyAttempts = { day: new Date().toISOString().slice(0, 10), count: 20 };
  await writeFile(activePath, `${JSON.stringify(active, null, 2)}\n`);
  await expectCode(runCommand('capture', { replayVersion: 'v2' }, { dataDir: root }), 'DAILY_ATTEMPT_LIMIT');

  const lockDir = path.join(root, '.lock');
  await mkdir(lockDir);
  await writeFile(path.join(lockDir, 'owner.json'), JSON.stringify({ token: 'orphan', pid: 999999, acquiredAt: '2026-01-01T00:00:00.000Z' }));
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.lock.active, true);
  assert.match(status.lock.recovery, /Confirm no Evidence Domino process is running/);
});

test('CLI emits structured JSON on stdout for status and errors', async (t) => {
  const root = await fixture(t);
  const { execFile } = await import('node:child_process');
  const run = (args) => new Promise((resolve) => execFile(process.execPath, [path.join(HERE, 'evidence-domino.mjs'), ...args], (error, stdout) => resolve({ error, stdout })));
  const status = await run(['status', '--data-dir', root]);
  assert.equal(status.error, null);
  assert.equal(JSON.parse(status.stdout).command, 'status');
  const bad = await run(['stage', '--data-dir', root]);
  assert.ok(bad.error);
  assert.equal(JSON.parse(bad.stdout).error.code, 'USAGE');
});
