import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { BASELINE_CONFIRMATION, calculate, formatUsd, recoveryAnalysis, runCommand } from './evidence-domino.mjs';

const PROJECT = { quantity: 100, customerQuoteCents: 600_000, minimumRemainingCents: 150_000 };
const LIMIT = 1_000_000_000_000_000;
const URL = 'https://supplier.example.test/listing';
const HERE = path.dirname(fileURLToPath(import.meta.url));

test('recovery gives the $45 ceiling and hypothetical $7,000 quote without mutating inputs', () => {
  const project = Object.freeze({ ...PROJECT });
  const value = recoveryAnalysis(project, 5_500);
  assert.deepEqual(value, {
    calculation: { trackedCostCents: 550_000, remainingCents: 50_000, meetsTarget: false, shortfallCents: 100_000 },
    feasibleAtZeroPrice: true, supplierBudgetCents: 450_000, priceCeilingCents: 4_500,
    unitHeadroomCents: 0, unitOverageCents: 1_000, remainingHeadroomCents: -100_000,
    requiredQuoteCents: 700_000, quoteIncreaseNeededCents: 100_000,
  });
  assert.deepEqual(project, PROJECT);
});

test('recovery distinguishes room, equality, exact cents and negative remaining', () => {
  for (const [price, headroom, increase] of [[4_200, 30_000, 0], [4_500, 0, 0], [4_501, -100, 100], [7_000, -250_000, 250_000]]) {
    const value = recoveryAnalysis(PROJECT, price);
    assert.equal(value.remainingHeadroomCents, headroom);
    assert.equal(value.quoteIncreaseNeededCents, increase);
    assert.equal(value.calculation.meetsTarget, increase === 0);
  }
  assert.equal(recoveryAnalysis(PROJECT, 7_000).calculation.remainingCents, -100_000);
});

test('non-round quantities floor the ceiling so the next cent cannot meet the target', () => {
  for (const project of [
    { quantity: 3, customerQuoteCents: 101, minimumRemainingCents: 1 },
    { quantity: 7, customerQuoteCents: 12_346, minimumRemainingCents: 457 },
    { quantity: 999_999_937, customerQuoteCents: LIMIT, minimumRemainingCents: 0 },
  ]) {
    const value = recoveryAnalysis(project, 0);
    const budget = BigInt(project.customerQuoteCents - project.minimumRemainingCents);
    assert.ok(BigInt(value.priceCeilingCents) * BigInt(project.quantity) <= budget);
    assert.ok(BigInt(value.priceCeilingCents + 1) * BigInt(project.quantity) > budget);
  }
  const value = recoveryAnalysis({ quantity: 3, customerQuoteCents: 101, minimumRemainingCents: 1 }, 33);
  assert.equal(value.priceCeilingCents, 33);
  assert.equal(value.remainingHeadroomCents, 1);
  assert.equal(value.unitHeadroomCents, 0);
});

test('quote below target is infeasible even at zero supplier price, while equality permits zero', () => {
  const value = recoveryAnalysis({ quantity: 3, customerQuoteCents: 100, minimumRemainingCents: 101 }, 0);
  assert.equal(value.feasibleAtZeroPrice, false);
  assert.equal(value.priceCeilingCents, null);
  assert.equal(value.unitHeadroomCents, null);
  assert.equal(value.unitOverageCents, null);
  assert.equal(value.quoteIncreaseNeededCents, 1);
  assert.equal(recoveryAnalysis({ quantity: 3, customerQuoteCents: 100, minimumRemainingCents: 100 }, 0).priceCeilingCents, 0);
});

test('recovery rejects invalid inputs and overflow, including the hypothetical quote sum', () => {
  for (const [project, price] of [[{ ...PROJECT, quantity: 1.2 }, 40], [PROJECT, -1], [PROJECT, 1.2], [null, 40]]) {
    assert.throws(() => recoveryAnalysis(project, price), { code: 'INVALID_INPUT' });
  }
  assert.throws(() => recoveryAnalysis({ quantity: 2, customerQuoteCents: 0, minimumRemainingCents: 0 }, LIMIT), { code: 'AMOUNT_OUT_OF_RANGE' });
  // Existing cost/remaining/shortfall fit; only the required quote is out of range.
  assert.throws(() => recoveryAnalysis({ quantity: 1, customerQuoteCents: LIMIT, minimumRemainingCents: 1 }, LIMIT), { code: 'AMOUNT_OUT_OF_RANGE' });
});

async function stagedFixture(t, project = PROJECT, baselinePrice = 4_000, observedPrice = 5_500) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ed-recovery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const calculation = calculate(project.quantity, baselinePrice, project.customerQuoteCents, project.minimumRemainingCents);
  const anchors = {
    cost: `We need ${project.quantity} units at ${formatUsd(baselinePrice)} each, costing ${formatUsd(calculation.trackedCostCents)}.`,
    remaining: `Our ${formatUsd(project.customerQuoteCents)} customer quote leaves ${formatUsd(calculation.remainingCents)} before other costs.`,
    minimum: `This ${calculation.meetsTarget ? 'meets' : 'does not meet'} our minimum remaining amount of ${formatUsd(project.minimumRemainingCents)}.`,
  };
  await runCommand('init', {
    ...project, projectId: 'recovery-test', mode: 'live', sourceUrl: URL,
    item: 'folding chairs', unitBasis: 'units', currency: 'USD', baselineUnitPriceCents: baselinePrice,
    baselineEvidence: { priceLiteral: formatUsd(baselinePrice), supportingPassage: `Folding chairs at ${formatUsd(baselinePrice)} per unit.`, sourceUrl: URL },
    pricingAssumption: 'public_list_price_estimate', remainingMeaning: 'before_other_costs',
    document: `# Proposal\n\nEvent date: October 18, 2026.\n\n${Object.values(anchors).join('\n')}\n`, anchors,
    documentValues: { ...project, unitPriceCents: baselinePrice, ...calculation },
    confirmation: BASELINE_CONFIRMATION,
  }, { dataDir: root });
  const passage = `Folding chairs at ${formatUsd(observedPrice)} per unit.`;
  const scenario = path.join(root, 'scenario.json');
  await writeFile(scenario, JSON.stringify({ default: { httpStatus: 200, body: { results: [{ url: URL, raw_content: passage }], failed_results: [] } } }));
  process.env.EVIDENCE_DOMINO_TEST_CURL_BIN = path.join(HERE, 'mock-curl.mjs');
  process.env.EVIDENCE_DOMINO_TEST_SCENARIO = scenario;
  const capture = await runCommand('capture', {}, { dataDir: root });
  const staged = await runCommand('stage', {
    captureId: capture.captureId,
    interpretation: { candidateCount: 1, priceLiteral: formatUsd(observedPrice), unitPriceCents: observedPrice, supportingPassage: passage,
      item: 'folding chairs', unitBasis: 'units', currency: 'USD',
      comparability: { item: 'same', unitBasis: 'same', currency: 'same', terms: 'same' }, alternatives: [], uncertainties: [] },
  }, { dataDir: root });
  return { root, staged };
}

test('staging publishes conditional recovery facts and adoption keeps quote and quantity fixed', async (t) => {
  const { root, staged } = await stagedFixture(t);
  assert.equal(staged.recovery.requiredQuoteCents, 700_000);
  const html = await readFile(staged.reportHtml, 'utf8');
  const markdown = await readFile(staged.reportMarkdown, 'utf8');
  for (const report of [html, markdown]) {
    assert.match(report, /Supplier price limit: \$45 per unit/);
    assert.match(report, /hypothetical customer quote of \$7,000/);
    assert.match(report, /customer quote and quantity stay unchanged/);
  }
  const before = await runCommand('status', {}, { dataDir: root });
  assert.equal(before.baseline.recovery.remainingHeadroomCents, 50_000);
  assert.deepEqual(before.latestReview.recovery, staged.recovery);
  await runCommand('approve', { reviewId: staged.reviewId, revisionId: staged.revisionId, reviewHash: staged.reviewHash, confirmation: staged.requiredConfirmation }, { dataDir: root });
  const after = await runCommand('status', {}, { dataDir: root });
  assert.equal(after.baseline.recovery.requiredQuoteCents, 700_000);
  const proposal = await readFile(after.baseline.documentPath, 'utf8');
  assert.match(proposal, /100 units/);
  assert.match(proposal, /\$6,000 customer quote/);
  assert.doesNotMatch(proposal, /\$7,000/);
});

test('recovery fields are bound by approval hash; status does not rewrite older snapshots', async (t) => {
  const { root, staged } = await stagedFixture(t);
  const reviewPath = path.join(root, 'reviews', staged.reviewId, 'review.json');
  const review = JSON.parse(await readFile(reviewPath, 'utf8'));
  review.recovery.requiredQuoteCents = 1;
  await writeFile(reviewPath, JSON.stringify(review));
  await assert.rejects(runCommand('approve', { reviewId: staged.reviewId, revisionId: staged.revisionId, reviewHash: staged.reviewHash, confirmation: staged.requiredConfirmation }, { dataDir: root }), { code: 'REVIEW_INTEGRITY_FAILED' });
  delete review.recovery;
  const stable = (value) => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])) : value;
  const { reviewHash, ...contents } = review;
  review.reviewHash = createHash('sha256').update(JSON.stringify(stable(contents))).digest('hex');
  const legacy = JSON.stringify(review);
  await writeFile(reviewPath, legacy);
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.latestReview.recovery, null);
  assert.equal(await readFile(reviewPath, 'utf8'), legacy);
});


test('optional recovery overflow does not block valid review, status or approval', async (t) => {
  const project = { quantity: 1, customerQuoteCents: LIMIT, minimumRemainingCents: 1 };
  const { root, staged } = await stagedFixture(t, project, LIMIT - 1, LIMIT);
  assert.equal(staged.calculation.shortfallCents, 1);
  assert.equal(staged.recovery, null);
  assert.equal(staged.recoveryError.code, 'AMOUNT_OUT_OF_RANGE');
  assert.match(await readFile(staged.reportHtml, 'utf8'), /Planning options are unavailable/);
  await runCommand('approve', { reviewId: staged.reviewId, revisionId: staged.revisionId, reviewHash: staged.reviewHash, confirmation: staged.requiredConfirmation }, { dataDir: root });
  const status = await runCommand('status', {}, { dataDir: root });
  assert.equal(status.baseline.recovery, null);
  assert.equal(status.baseline.recoveryError.code, 'AMOUNT_OUT_OF_RANGE');
  assert.equal(status.baseline.calculation.shortfallCents, 1);
});
