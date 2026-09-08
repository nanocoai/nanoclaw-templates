#!/usr/bin/env node

import { execFile as execFileCallback } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import {
  access,
  mkdir,
  open,
  readFile,
  rename,
  rmdir,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

export const DEFAULT_DATA_DIR = '/workspace/agent/plugin-data/evidence-domino';
export const TAVILY_ENDPOINT = 'https://api.tavily.com/extract';
export const DAILY_ATTEMPT_LIMIT = 20;
export const MAX_DOCUMENT_BYTES = 20 * 1024;
export const MAX_RESPONSE_BYTES = 1024 * 1024;
export const BASELINE_CONFIRMATION = 'I confirm this mapping uses a public-list-price estimate, not a locked supplier quotation, and start monitoring.';
const LOCK_WAIT_MS = 2_000;
const LOCK_POLL_MS = 25;
const MONEY_LIMIT_CENTS = 1_000_000_000_000_000;
const PROJECT_ID_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
const COMMANDS = new Set(['init', 'capture', 'stage', 'approve', 'status']);

export class EvidenceDominoError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = 'EvidenceDominoError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new EvidenceDominoError(code, message, details);
}

function nowIso() {
  return new Date().toISOString();
}

function utcDay(iso = nowIso()) {
  return iso.slice(0, 10);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireObject(value, label) {
  if (!isPlainObject(value)) fail('INVALID_INPUT', `${label} must be an object.`);
  return value;
}

function requireString(value, label, maxLength = 20_000) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail('INVALID_INPUT', `${label} must be a non-empty string.`);
  }
  if (value.length > maxLength) fail('INVALID_INPUT', `${label} is too long.`);
  return value;
}

function requireSafeInteger(value, label, { min = 0, max = MONEY_LIMIT_CENTS } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    fail('INVALID_INPUT', `${label} must be a safe integer from ${min} through ${max}.`);
  }
  return value;
}

function checkedMultiply(left, right, label) {
  const result = left * right;
  if (!Number.isSafeInteger(result) || Math.abs(result) > MONEY_LIMIT_CENTS) {
    fail('AMOUNT_OUT_OF_RANGE', `${label} is outside the supported integer-cent range.`);
  }
  return result;
}

function checkedSubtract(left, right, label) {
  const result = left - right;
  if (!Number.isSafeInteger(result) || Math.abs(result) > MONEY_LIMIT_CENTS) {
    fail('AMOUNT_OUT_OF_RANGE', `${label} is outside the supported integer-cent range.`);
  }
  return result;
}

export function calculate(quantity, unitPriceCents, customerQuoteCents, minimumRemainingCents) {
  requireSafeInteger(quantity, 'quantity', { min: 1, max: 1_000_000_000 });
  requireSafeInteger(unitPriceCents, 'unitPriceCents');
  requireSafeInteger(customerQuoteCents, 'customerQuoteCents');
  requireSafeInteger(minimumRemainingCents, 'minimumRemainingCents');
  const trackedCostCents = checkedMultiply(quantity, unitPriceCents, 'tracked cost');
  const remainingCents = checkedSubtract(customerQuoteCents, trackedCostCents, 'remaining amount');
  const meetsTarget = remainingCents >= minimumRemainingCents;
  const shortfallCents = meetsTarget
    ? 0
    : checkedSubtract(minimumRemainingCents, remainingCents, 'shortfall');
  return { trackedCostCents, remainingCents, meetsTarget, shortfallCents };
}

// These are conditional planning facts. They never amend the approved quote or quantity.
export function recoveryAnalysis(project, unitPriceCents) {
  requireObject(project, 'project');
  const { quantity, customerQuoteCents, minimumRemainingCents } = project;
  const calculation = calculate(quantity, unitPriceCents, customerQuoteCents, minimumRemainingCents);
  const supplierBudgetCents = checkedSubtract(customerQuoteCents, minimumRemainingCents, 'supplier budget');
  const feasibleAtZeroPrice = supplierBudgetCents >= 0;
  // BigInt division avoids rounding a fractional cent up at the supported upper bound.
  const priceCeilingCents = feasibleAtZeroPrice
    ? Number(BigInt(supplierBudgetCents) / BigInt(quantity))
    : null;
  const remainingHeadroomCents = checkedSubtract(calculation.remainingCents, minimumRemainingCents, 'remaining headroom');
  const requiredQuoteCents = checkedSubtract(calculation.trackedCostCents, -minimumRemainingCents, 'required quote');
  return {
    calculation,
    feasibleAtZeroPrice,
    supplierBudgetCents,
    priceCeilingCents,
    unitHeadroomCents: feasibleAtZeroPrice ? Math.max(0, priceCeilingCents - unitPriceCents) : null,
    unitOverageCents: feasibleAtZeroPrice ? Math.max(0, unitPriceCents - priceCeilingCents) : null,
    remainingHeadroomCents,
    requiredQuoteCents,
    quoteIncreaseNeededCents: Math.max(0, checkedSubtract(requiredQuoteCents, customerQuoteCents, 'quote increase needed')),
  };
}

function recoveryForReview(project, unitPriceCents) {
  try {
    return { recovery: recoveryAnalysis(project, unitPriceCents), recoveryError: null };
  } catch (error) {
    // Optional planning arithmetic must not break a previously supported baseline or review.
    if (!(error instanceof EvidenceDominoError) || error.code !== 'AMOUNT_OUT_OF_RANGE') throw error;
    return { recovery: null, recoveryError: { code: error.code, message: error.message } };
  }
}

function recoveryFacts(recovery, recoveryError) {
  if (!recovery) return [`Planning options are unavailable: ${recoveryError?.message ?? 'No planning analysis is stored.'} The tracked-cost calculation above remains the review basis.`];
  const ceiling = recovery.feasibleAtZeroPrice
    ? `Supplier price limit: ${formatUsd(recovery.priceCeilingCents)} per unit at the fixed quantity and customer quote.`
    : 'The customer quote is below the minimum remaining target, even if this supplier costs $0.';
  const position = recovery.remainingHeadroomCents >= 0
    ? `Room above the remaining target: ${formatUsd(recovery.remainingHeadroomCents)} before other costs.`
    : `Shortfall against the remaining target: ${formatUsd(-recovery.remainingHeadroomCents)}.`;
  const option = recovery.quoteIncreaseNeededCents > 0
    ? `If this price applies, a hypothetical customer quote of ${formatUsd(recovery.requiredQuoteCents)} (${formatUsd(recovery.quoteIncreaseNeededCents)} higher) would retain the minimum remaining amount.`
    : `At this price, the fixed customer quote already meets the minimum remaining target.`;
  return [ceiling, position, option];
}

export function formatUsd(cents) {
  if (!Number.isSafeInteger(cents)) fail('INVALID_MONEY', 'Money must be represented as integer cents.');
  const negative = cents < 0;
  const absolute = Math.abs(cents);
  const dollars = Math.floor(absolute / 100).toLocaleString('en-US');
  const fractional = absolute % 100;
  return `${negative ? '−' : ''}$${dollars}${fractional === 0 ? '' : `.${String(fractional).padStart(2, '0')}`}`;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function readJson(target, code = 'STATE_CORRUPT') {
  let text;
  try {
    text = await readFile(target, 'utf8');
  } catch (error) {
    fail(code, `Cannot read ${target}.`, { cause: error.message });
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(code, `Invalid JSON in ${target}.`, { cause: error.message });
  }
}

async function writeNewFile(target, content) {
  const handle = await open(target, 'wx', 0o600);
  try {
    await handle.writeFile(content);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function atomicWriteJson(target, value) {
  await mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temp, target);
}

async function writeImmutableDirectory(finalDir, files) {
  if (await pathExists(finalDir)) fail('IMMUTABLE_CONFLICT', `${finalDir} already exists.`);
  await mkdir(path.dirname(finalDir), { recursive: true });
  const tempDir = `${finalDir}.tmp-${process.pid}-${randomUUID()}`;
  await mkdir(tempDir, { recursive: false, mode: 0o700 });
  try {
    for (const [relative, content] of Object.entries(files)) {
      const target = path.join(tempDir, relative);
      await mkdir(path.dirname(target), { recursive: true });
      await writeNewFile(target, content);
    }
    await rename(tempDir, finalDir);
  } catch (error) {
    // A failed staged directory is intentionally left for inspection when cleanup is unsafe.
    if (error instanceof EvidenceDominoError) throw error;
    fail('WRITE_FAILED', `Could not publish immutable directory ${finalDir}.`, {
      cause: error.message,
      stagedDirectory: tempDir,
    });
  }
}

async function acquireLock(root) {
  await mkdir(root, { recursive: true });
  const lockDir = path.join(root, '.lock');
  const owner = { token: randomUUID(), pid: process.pid, acquiredAt: nowIso() };
  const deadline = Date.now() + LOCK_WAIT_MS;
  while (true) {
    try {
      await mkdir(lockDir, { mode: 0o700 });
      await writeNewFile(path.join(lockDir, 'owner.json'), `${JSON.stringify(owner, null, 2)}\n`);
      return { lockDir, owner };
    } catch (error) {
      if (error?.code !== 'EEXIST' || Date.now() >= deadline) {
        let existingOwner = null;
        try {
          existingOwner = await readJson(path.join(lockDir, 'owner.json'));
        } catch {
          // The lock may have been interrupted before its owner record was written.
        }
        fail('LOCKED', 'Evidence Domino state is locked by another or interrupted operation.', {
          existingOwner,
          recovery: 'Confirm no Evidence Domino process is running, inspect .lock/owner.json, then remove only that .lock directory.',
        });
      }
      await sleep(LOCK_POLL_MS);
    }
  }
}

async function releaseLock(lock) {
  let current;
  try {
    current = await readJson(path.join(lock.lockDir, 'owner.json'));
  } catch {
    return;
  }
  if (current.token !== lock.owner.token) return;
  await unlink(path.join(lock.lockDir, 'owner.json'));
  await rmdir(lock.lockDir);
}

async function withLock(root, action) {
  const lock = await acquireLock(root);
  try {
    return await action();
  } finally {
    await releaseLock(lock);
  }
}

function normalizePublicHttpsUrl(value, label = 'sourceUrl') {
  requireString(value, label, 2_048);
  let url;
  try {
    url = new URL(value);
  } catch {
    fail('INVALID_SOURCE_URL', `${label} must be a valid public HTTPS URL.`);
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    fail('INVALID_SOURCE_URL', `${label} must be a public HTTPS URL without embedded credentials.`);
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const ipVersion = isIP(host);
  const privateHost =
    host === 'localhost' || host.endsWith('.localhost') ||
    (ipVersion === 6 && (host === '::1' || host.startsWith('fc') || host.startsWith('fd') ||
      host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb'))) ||
    (ipVersion === 4 && (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host === '0.0.0.0'));
  if (privateHost) fail('INVALID_SOURCE_URL', `${label} must not target a local or private address.`);
  for (const key of url.searchParams.keys()) {
    const normalizedKey = key.toLowerCase().replaceAll('-', '_');
    if (/(^|_)(?:api_key|token|secret|password|auth|credential|private_key)(?:_|$)/.test(normalizedKey)) {
      fail('CREDENTIAL_IN_SOURCE_URL', `${label} must not contain credential-shaped query parameters.`, { key });
    }
  }
  url.hash = '';
  if (url.port === '443') url.port = '';
  return url.toString();
}

function validateControlledReplay(value) {
  const replay = requireObject(value, 'controlledReplay');
  const logicalSourceId = requireString(replay.logicalSourceId, 'controlledReplay.logicalSourceId', 100);
  if (!Array.isArray(replay.versions) || replay.versions.length < 2 || replay.versions.length > 10) {
    fail('INVALID_INPUT', 'controlledReplay.versions must contain 2 through 10 versions.');
  }
  const names = new Set();
  const urls = new Set();
  const versions = replay.versions.map((entry, index) => {
    requireObject(entry, `controlledReplay.versions[${index}]`);
    const name = requireString(entry.name, `controlledReplay.versions[${index}].name`, 80);
    const url = normalizePublicHttpsUrl(entry.url, `controlledReplay.versions[${index}].url`);
    const marker = requireString(entry.marker, `controlledReplay.versions[${index}].marker`, 200);
    if (names.has(name) || urls.has(url)) fail('INVALID_INPUT', 'Controlled replay version names and URLs must be unique.');
    names.add(name);
    urls.add(url);
    return { name, url, marker };
  });
  return { logicalSourceId, versions };
}

function findUniqueAnchor(document, text, role) {
  requireString(text, `anchors.${role}`, MAX_DOCUMENT_BYTES);
  const first = document.indexOf(text);
  const second = first < 0 ? -1 : document.indexOf(text, first + 1);
  if (first < 0) fail('ANCHOR_MISSING', `The ${role} anchor is absent from the document.`);
  if (second >= 0) fail('ANCHOR_NOT_UNIQUE', `The ${role} anchor occurs more than once.`);
  return { role, text, start: first, end: first + text.length };
}

export function validateAnchors(document, anchors) {
  requireObject(anchors, 'anchors');
  const spans = [
    findUniqueAnchor(document, anchors.cost, 'cost'),
    findUniqueAnchor(document, anchors.remaining, 'remaining'),
    findUniqueAnchor(document, anchors.minimum, 'minimum'),
  ].sort((a, b) => a.start - b.start);
  for (let index = 1; index < spans.length; index += 1) {
    if (spans[index].start < spans[index - 1].end) {
      fail('ANCHORS_OVERLAP', `${spans[index - 1].role} and ${spans[index].role} anchors overlap.`);
    }
  }
  if (new Set(spans.map((span) => span.text)).size !== 3) {
    fail('ANCHOR_NOT_UNIQUE', 'Each sentence role must use a different exact anchor.');
  }
  return Object.fromEntries(spans.map((span) => [span.role, span.text]));
}

const USD_TOKEN_RE = /(?<![\p{L}\p{N}_\-−])(?:[\-−]?\$\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?|[\-−]?USD\s+(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?|[\-−]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?\s+USD)(?![\p{L}\p{N}_]|[.,]\d)/giu;

export function containsExactUsdAmount(text, cents) {
  if (typeof text !== 'string' || !Number.isSafeInteger(cents)) return false;
  return usdAmountTokens(text).some((token) => token.cents === cents);
}

function usdAmountTokens(text) {
  if (typeof text !== 'string') return [];
  const tokens = [];
  for (const match of text.matchAll(USD_TOKEN_RE)) {
    try {
      const prefix = text.slice(0, match.index);
      // A separated sign is part of the expression, except a Markdown list marker.
      const separatedSign = prefix.match(/([+\-−])\s*$/u);
      const listMarker = separatedSign && /^[ \t]*-[ \t]+$/u.test(prefix.slice(prefix.lastIndexOf('\n') + 1));
      if (separatedSign && !listMarker) continue;
      // Accounting notation is deliberately unsupported, including spaced parentheses.
      if (/\(\s*$/u.test(prefix) || /^\s*\)/u.test(text.slice(match.index + match[0].length))) continue;
      tokens.push({ text: match[0], cents: parseUsdLiteral(match[0]), start: match.index, end: match.index + match[0].length });
    } catch {
      // The tokenizer is deliberately conservative; ignore any token it cannot parse.
    }
  }
  return tokens;
}

function passageContainsBoundedUsdAmount(sourceContent, passage, cents) {
  const relativeTokens = usdAmountTokens(passage).filter((token) => token.cents === cents);
  if (relativeTokens.length === 0) return false;
  const fullTokens = usdAmountTokens(sourceContent).filter((token) => token.cents === cents);
  let from = 0;
  while (true) {
    const passageStart = sourceContent.indexOf(passage, from);
    if (passageStart < 0) return false;
    if (relativeTokens.some((relative) => fullTokens.some((full) =>
      full.start === passageStart + relative.start && full.end === passageStart + relative.end))) return true;
    from = passageStart + Math.max(1, passage.length);
  }
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function containsExactQuantityAndBasis(text, quantity, unitBasis) {
  if (typeof text !== 'string' || !Number.isSafeInteger(quantity) || quantity < 1 || typeof unitBasis !== 'string') return false;
  const grouped = quantity.toLocaleString('en-US');
  const forms = grouped === String(quantity) ? escapeRegExp(grouped) : `(?:${escapeRegExp(grouped)}|${quantity})`;
  const basis = escapeRegExp(unitBasis.trim()).replace(/\\ /g, '\\s+');
  const pattern = new RegExp(`(?<![$\\p{L}\\p{N}_.,])${forms}\\s+${basis}(?![\\p{L}\\p{N}_])`, 'iu');
  return pattern.test(text);
}

export function containsExactWholeNumber(text, quantity) {
  if (typeof text !== 'string' || !Number.isSafeInteger(quantity) || quantity < 1) return false;
  const grouped = quantity.toLocaleString('en-US');
  const forms = grouped === String(quantity) ? escapeRegExp(grouped) : `(?:${escapeRegExp(grouped)}|${quantity})`;
  const pattern = new RegExp(`(?<![$\\p{L}\\p{N}_.,/⁄∕%\\-−+])${forms}(?![\\p{L}\\p{N}_/⁄∕%]|[.,]\\d)`, 'gu');
  return [...text.matchAll(pattern)].some((match) => {
    const prefix = text.slice(0, match.index);
    const suffix = text.slice(match.index + match[0].length);
    if (/(?:[$€£¥+−/⁄∕%]|USD|EUR|GBP|\d\s*[.,])\s*$/iu.test(prefix)) return false;
    if (/-\s*$/u.test(prefix) && !/^[ \t]*-[ \t]+$/u.test(prefix.slice(prefix.lastIndexOf('\n') + 1))) return false;
    if (/^\s*(?:[/⁄∕%]|USD\b|EUR\b|GBP\b)/iu.test(suffix)) return false;
    return true;
  });
}

function validateMinimumSentence(sentence, project, calculation) {
  const tokens = usdAmountTokens(sentence);
  const suggestion = buildSentences(project, project.baselineUnitPriceCents, calculation).minimum;
  if (tokens.length === 1 && tokens[0].cents === project.minimumRemainingCents) {
    const token = tokens[0];
    const skeleton = (sentence.slice(0, token.start) + '<target>' + sentence.slice(token.end)).trim();
    // Finite grammar: only the target is numeric; no remaining/shortfall claims can go stale.
    const positive = /^(?:This meets our minimum remaining amount of|That remaining amount satisfies our minimum buffer of) <target>\.$/u;
    const negative = /^(?:This does not meet our minimum remaining amount of|That remaining amount does not satisfy our minimum buffer of) <target>\.$/u;
    if ((calculation.meetsTarget ? positive : negative).test(skeleton)) return;
  }
  fail('UNSUPPORTED_MINIMUM_SENTENCE', 'The minimum sentence must state only whether the fixed target is met. Ask the owner to approve a document edit using the suggested sentence, then map and initialize the edited document. The original has not been rewritten.', { suggestion });
}

function validateInitialDocumentValues(input, project, calculation, anchors) {
  validateMinimumSentence(anchors.minimum, project, calculation);
  const values = requireObject(input.documentValues, 'documentValues');
  const expected = {
    quantity: project.quantity,
    unitPriceCents: project.baselineUnitPriceCents,
    trackedCostCents: calculation.trackedCostCents,
    customerQuoteCents: project.customerQuoteCents,
    remainingCents: calculation.remainingCents,
    minimumRemainingCents: project.minimumRemainingCents,
    meetsTarget: calculation.meetsTarget,
  };
  const mismatches = [];
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (values[key] !== expectedValue) mismatches.push({ field: key, expected: expectedValue, received: values[key] });
  }
  if (mismatches.length) {
    fail('INCONSISTENT_DRAFT', 'The declared document values do not match the deterministic calculation.', { mismatches });
  }
  if (!containsExactWholeNumber(anchors.cost, project.quantity)) {
    fail('INCONSISTENT_DRAFT', 'The cost sentence does not contain the exact configured whole-number quantity.', {
      quantity: project.quantity,
    });
  }
  const checks = [
    ['cost', project.baselineUnitPriceCents],
    ['cost', calculation.trackedCostCents],
    ['remaining', project.customerQuoteCents],
    ['remaining', calculation.remainingCents],
    ['minimum', project.minimumRemainingCents],
  ];
  const missing = checks.filter(([role, cents]) => !containsExactUsdAmount(anchors[role], cents));
  if (missing.length) {
    fail('INCONSISTENT_DRAFT', 'An owner-mapped sentence does not contain its declared USD amount.', {
      missing: missing.map(([role, cents]) => ({ role, amount: formatUsd(cents) })),
    });
  }
}

function validateProjectInput(input) {
  requireObject(input, 'input');
  const projectId = requireString(input.projectId, 'projectId', 63);
  if (!PROJECT_ID_RE.test(projectId)) fail('INVALID_INPUT', 'projectId must be a lowercase slug.');
  const mode = input.mode ?? 'live';
  if (!['live', 'controlled_replay'].includes(mode)) fail('INVALID_INPUT', 'mode must be live or controlled_replay.');
  const sourceUrl = normalizePublicHttpsUrl(input.sourceUrl);
  const item = requireString(input.item, 'item', 200).trim();
  const unitBasis = requireString(input.unitBasis, 'unitBasis', 120).trim();
  const quantity = requireSafeInteger(input.quantity, 'quantity', { min: 1, max: 1_000_000_000 });
  if (input.currency !== 'USD') fail('UNSUPPORTED_CURRENCY', 'Evidence Domino v1 supports USD only.');
  const customerQuoteCents = requireSafeInteger(input.customerQuoteCents, 'customerQuoteCents');
  const minimumRemainingCents = requireSafeInteger(input.minimumRemainingCents, 'minimumRemainingCents');
  const baselineUnitPriceCents = requireSafeInteger(input.baselineUnitPriceCents, 'baselineUnitPriceCents');
  if (input.pricingAssumption !== 'public_list_price_estimate') {
    fail('INVALID_PRICING_ASSUMPTION', 'pricingAssumption must be public_list_price_estimate.');
  }
  if (input.remainingMeaning !== 'before_other_costs') {
    fail('INVALID_REMAINING_MEANING', 'remainingMeaning must be before_other_costs.');
  }
  const controlledReplay = mode === 'controlled_replay' ? validateControlledReplay(input.controlledReplay) : null;
  if (controlledReplay && !controlledReplay.versions.some((entry) => entry.url === sourceUrl)) {
    fail('INVALID_INPUT', 'sourceUrl must be one of the declared controlled replay versions.');
  }
  if (mode === 'live' && input.controlledReplay !== undefined) {
    fail('INVALID_INPUT', 'controlledReplay is only allowed in controlled_replay mode.');
  }
  return {
    schemaVersion: 1,
    projectId,
    mode,
    sourceUrl,
    controlledReplay,
    item,
    unitBasis,
    quantity,
    currency: 'USD',
    customerQuoteCents,
    minimumRemainingCents,
    baselineUnitPriceCents,
    pricingAssumption: 'public_list_price_estimate',
    remainingMeaning: 'before_other_costs',
    createdAt: nowIso(),
  };
}

function buildSentences(project, unitPriceCents, calculation) {
  return {
    cost: `We need ${project.quantity.toLocaleString('en-US')} ${project.unitBasis} at ${formatUsd(unitPriceCents)} each, costing ${formatUsd(calculation.trackedCostCents)}.`,
    remaining: `Our ${formatUsd(project.customerQuoteCents)} customer quote leaves ${formatUsd(calculation.remainingCents)} before other costs.`,
    minimum: calculation.meetsTarget
      ? `This meets our minimum remaining amount of ${formatUsd(project.minimumRemainingCents)}.`
      : `This does not meet our minimum remaining amount of ${formatUsd(project.minimumRemainingCents)}.`,
  };
}

function occurrenceCount(text, needle) {
  let count = 0;
  let from = 0;
  while (true) {
    const index = text.indexOf(needle, from);
    if (index < 0) return count;
    count += 1;
    from = index + Math.max(needle.length, 1);
  }
}

function applySentencePatch(document, oldAnchors, newSentences, changedRoles) {
  const ranges = changedRoles.map((role) => {
    const oldText = oldAnchors[role];
    if (occurrenceCount(document, oldText) !== 1) {
      fail('STALE_DOCUMENT_ANCHOR', `The ${role} sentence is no longer an exact unique anchor.`);
    }
    const start = document.indexOf(oldText);
    return { role, start, end: start + oldText.length, oldText, newText: newSentences[role] };
  }).sort((a, b) => b.start - a.start);
  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index - 1].start < ranges[index].end) fail('ANCHORS_OVERLAP', 'Replacement anchors overlap.');
  }
  let proposed = document;
  for (const range of ranges) proposed = `${proposed.slice(0, range.start)}${range.newText}${proposed.slice(range.end)}`;

  // Prove that applying the inverse replacements recreates the exact original bytes.
  let inverse = proposed;
  const newRanges = ranges.map((range) => {
    const count = occurrenceCount(inverse, range.newText);
    if (count !== 1) fail('PATCH_NOT_REVERSIBLE', `Generated ${range.role} sentence is not uniquely anchorable.`);
    const start = inverse.indexOf(range.newText);
    return { ...range, start, end: start + range.newText.length };
  }).sort((a, b) => b.start - a.start);
  for (const range of newRanges) inverse = `${inverse.slice(0, range.start)}${range.oldText}${inverse.slice(range.end)}`;
  if (inverse !== document) fail('PATCH_INTEGRITY_FAILED', 'Untracked document bytes changed during sentence repair.');

  const nextAnchors = { ...oldAnchors };
  for (const role of changedRoles) nextAnchors[role] = newSentences[role];
  validateAnchors(proposed, nextAnchors);
  return { proposed, nextAnchors, changes: ranges.sort((a, b) => a.start - b.start) };
}

export function parseUsdLiteral(literal) {
  requireString(literal, 'interpretation.priceLiteral', 80);
  const trimmed = literal.trim();
  const match = trimmed.match(/^([\-−]?)(?:\$\s*|USD\s+)(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{2}))?(?:\s*USD)?$/i) ??
    trimmed.match(/^([\-−]?)(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{2}))?\s+USD$/i);
  if (!match) fail('AMBIGUOUS_PRICE_LITERAL', 'priceLiteral must be an unambiguous USD amount with zero or two decimal places.');
  const dollars = Number(match[2].replaceAll(',', ''));
  const cents = Number(match[3] ?? '00');
  const magnitude = dollars * 100 + cents;
  const total = match[1] ? -magnitude : magnitude;
  return requireSafeInteger(total, 'parsed price', { min: -MONEY_LIMIT_CENTS, max: MONEY_LIMIT_CENTS });
}

function comparableText(left, right) {
  return left.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US') === right.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

function validateInterpretation(value, project, capture, sourceContent) {
  const interpretation = requireObject(value, 'interpretation');
  if (interpretation.candidateCount !== 1) {
    fail('AMBIGUOUS_EVIDENCE', 'The interpretation must declare exactly one applicable price candidate.');
  }
  const alternatives = interpretation.alternatives ?? [];
  const uncertainties = interpretation.uncertainties ?? [];
  if (!Array.isArray(alternatives) || !Array.isArray(uncertainties)) {
    fail('INVALID_INPUT', 'interpretation alternatives and uncertainties must be arrays.');
  }
  if (alternatives.length || uncertainties.length) {
    fail('AMBIGUOUS_EVIDENCE', 'The source has competing prices or unresolved applicability questions.', {
      alternatives,
      uncertainties,
    });
  }
  const priceLiteral = requireString(interpretation.priceLiteral, 'interpretation.priceLiteral', 80);
  const unitPriceCents = requireSafeInteger(interpretation.unitPriceCents, 'interpretation.unitPriceCents');
  const parsed = parseUsdLiteral(priceLiteral);
  if (parsed !== unitPriceCents) {
    fail('PRICE_MISMATCH', 'priceLiteral does not equal interpretation.unitPriceCents.', { parsed, unitPriceCents });
  }
  const supportingPassage = requireString(interpretation.supportingPassage, 'interpretation.supportingPassage', 8_000);
  if (!sourceContent.includes(supportingPassage)) {
    fail('EVIDENCE_NOT_IN_CAPTURE', 'The supporting passage is not an exact substring of the preserved extraction.');
  }
  if (!passageContainsBoundedUsdAmount(sourceContent, supportingPassage, unitPriceCents)) {
    fail('PRICE_NOT_IN_PASSAGE', 'The quoted passage does not contain the selected price as the same complete USD token in the full capture.');
  }
  const item = requireString(interpretation.item, 'interpretation.item', 200);
  const unitBasis = requireString(interpretation.unitBasis, 'interpretation.unitBasis', 120);
  if (interpretation.currency !== 'USD') fail('UNSUPPORTED_CURRENCY', 'The observed price is not confirmed as USD.');
  const comparability = requireObject(interpretation.comparability, 'interpretation.comparability');
  for (const field of ['item', 'unitBasis', 'currency', 'terms']) {
    if (comparability[field] !== 'same') {
      fail('APPLICABILITY_REVIEW_REQUIRED', `${field} is not confirmed comparable to the active baseline.`, {
        field,
        assessment: comparability[field] ?? 'missing',
      });
    }
  }
  if (!comparableText(item, project.item) || !comparableText(unitBasis, project.unitBasis)) {
    fail('APPLICABILITY_REVIEW_REQUIRED', 'The interpreted item or unit basis differs from the owner-approved project.');
  }
  return {
    status: 'candidate_awaiting_applicability_review',
    priceLiteral,
    unitPriceCents,
    supportingPassage,
    item: project.item,
    unitBasis: project.unitBasis,
    currency: 'USD',
    comparability: { item: 'same', unitBasis: 'same', currency: 'same', terms: 'same' },
    candidateCount: 1,
    alternatives: [],
    uncertainties: [],
    captureId: capture.captureId,
    sourceUrl: capture.requestedUrl,
    retrievedAt: capture.completedAt,
  };
}

function captureDir(root, captureId) {
  return path.join(root, 'captures', captureId);
}

function baselineDir(root, version) {
  return path.join(root, 'baselines', `v${String(version).padStart(4, '0')}`);
}

function reviewDir(root, reviewId) {
  return path.join(root, 'reviews', reviewId);
}

async function loadActive(root) {
  return readJson(path.join(root, 'active.json'), 'NOT_INITIALIZED');
}

async function loadProject(root) {
  return readJson(path.join(root, 'project.json'), 'NOT_INITIALIZED');
}

async function loadBaseline(root, version) {
  return readJson(path.join(baselineDir(root, version), 'baseline.json'));
}

async function loadCapture(root, captureId) {
  return readJson(path.join(captureDir(root, captureId), 'capture.json'), 'CAPTURE_NOT_FOUND');
}

async function loadReview(root, reviewId) {
  return readJson(path.join(reviewDir(root, reviewId), 'review.json'), 'REVIEW_NOT_FOUND');
}

async function persistObservationDisposition(root, observation, { invalidateOlderReview = false, markProcessed = false } = {}) {
  return withLock(root, async () => {
    const active = await loadActive(root);
    if (active.latestProcessedSequence >= observation.sequence) return false;
    if (active.latestObservation && observation.sequence < active.latestObservation.sequence) return false;
    let latestApplicableReviewId = active.latestApplicableReviewId;
    if (invalidateOlderReview && latestApplicableReviewId) {
      const pending = await loadReview(root, latestApplicableReviewId);
      if (observation.sequence > pending.captureSequence) latestApplicableReviewId = null;
    }
    await atomicWriteJson(path.join(root, 'active.json'), {
      ...active,
      latestApplicableReviewId,
      latestObservation: observation,
      latestProcessedSequence: markProcessed
        ? Math.max(active.latestProcessedSequence, observation.sequence)
        : active.latestProcessedSequence,
      updatedAt: nowIso(),
    });
    return true;
  });
}

export async function initCommand(input, root) {
  const document = requireString(input.document, 'document', MAX_DOCUMENT_BYTES);
  if (Buffer.byteLength(document, 'utf8') > MAX_DOCUMENT_BYTES) {
    fail('DOCUMENT_TOO_LARGE', `The Markdown document exceeds ${MAX_DOCUMENT_BYTES} UTF-8 bytes.`);
  }
  if (input.confirmation !== BASELINE_CONFIRMATION) {
    fail('OWNER_CONFIRMATION_REQUIRED', `The exact baseline confirmation is required: ${BASELINE_CONFIRMATION}`);
  }
  const project = validateProjectInput(input);
  const baselineEvidenceInput = requireObject(input.baselineEvidence, 'baselineEvidence');
  const baselinePriceLiteral = requireString(baselineEvidenceInput.priceLiteral, 'baselineEvidence.priceLiteral', 80);
  const baselineEvidencePriceCents = parseUsdLiteral(baselinePriceLiteral);
  if (baselineEvidencePriceCents !== project.baselineUnitPriceCents) {
    fail('PRICE_MISMATCH', 'baselineEvidence.priceLiteral does not match baselineUnitPriceCents.', {
      parsed: baselineEvidencePriceCents,
      baselineUnitPriceCents: project.baselineUnitPriceCents,
    });
  }
  const baselineSupportingPassage = requireString(
    baselineEvidenceInput.supportingPassage,
    'baselineEvidence.supportingPassage',
    8_000,
  );
  if (!containsExactUsdAmount(baselineSupportingPassage, project.baselineUnitPriceCents)) {
    fail('PRICE_NOT_IN_PASSAGE', 'The owner-confirmed source passage does not contain an exact USD token equal to the baseline price.');
  }
  const baselineEvidenceUrl = normalizePublicHttpsUrl(
    baselineEvidenceInput.sourceUrl ?? project.sourceUrl,
    'baselineEvidence.sourceUrl',
  );
  if (baselineEvidenceUrl !== project.sourceUrl) {
    fail('BASELINE_SOURCE_MISMATCH', 'baselineEvidence.sourceUrl must match the approved starting source URL.');
  }
  const anchors = validateAnchors(document, input.anchors);
  const calculation = calculate(
    project.quantity,
    project.baselineUnitPriceCents,
    project.customerQuoteCents,
    project.minimumRemainingCents,
  );
  validateInitialDocumentValues(input, project, calculation, anchors);
  const createdAt = nowIso();
  const baseline = {
    schemaVersion: 1,
    version: 1,
    createdAt,
    documentHash: sha256(document),
    anchors,
    unitPriceCents: project.baselineUnitPriceCents,
    calculation,
    conditionStatus: calculation.meetsTarget ? 'meets_target' : 'existing_issue',
    interpretation: {
      status: 'owner_confirmed_draft_source_passage',
      priceLiteral: baselinePriceLiteral,
      unitPriceCents: project.baselineUnitPriceCents,
      currency: 'USD',
      sourceUrl: baselineEvidenceUrl,
      supportingPassage: baselineSupportingPassage,
      confirmedAt: createdAt,
      captureId: null,
    },
    adoptedReviewId: null,
  };
  const active = {
    schemaVersion: 1,
    projectId: project.projectId,
    currentBaselineVersion: 1,
    latestCaptureSequence: 0,
    latestProcessedSequence: 0,
    latestReviewId: null,
    latestApplicableReviewId: null,
    latestObservation: null,
    latestMaterialFingerprint: sha256(stableJson({ unitPriceCents: project.baselineUnitPriceCents, baselineVersion: 1 })),
    dailyAttempts: { day: utcDay(createdAt), count: 0 },
    updatedAt: createdAt,
  };

  return withLock(root, async () => {
    if (await pathExists(path.join(root, 'active.json'))) fail('ALREADY_INITIALIZED', 'This data directory already has an active project.');
    await mkdir(root, { recursive: true });
    await writeNewFile(path.join(root, 'project.json'), `${JSON.stringify(project, null, 2)}\n`);
    await writeNewFile(path.join(root, 'original.md'), document);
    await writeImmutableDirectory(baselineDir(root, 1), {
      'baseline.json': `${JSON.stringify(baseline, null, 2)}\n`,
      'document.md': document,
    });
    await atomicWriteJson(path.join(root, 'active.json'), active);
    return {
      ok: true,
      command: 'init',
      status: baseline.conditionStatus === 'existing_issue' ? 'initialized_with_existing_issue' : 'initialized',
      projectId: project.projectId,
      baselineVersion: 1,
      documentHash: baseline.documentHash,
      calculation,
      monitoring: 'manual',
    };
  });
}

async function reserveCapture(root) {
  return withLock(root, async () => {
    const active = await loadActive(root);
    const day = utcDay();
    const dailyAttempts = active.dailyAttempts?.day === day ? active.dailyAttempts : { day, count: 0 };
    if (dailyAttempts.count >= DAILY_ATTEMPT_LIMIT) {
      fail('DAILY_ATTEMPT_LIMIT', `The daily HTTP-attempt budget of ${DAILY_ATTEMPT_LIMIT} is exhausted.`, { day });
    }
    const sequence = active.latestCaptureSequence + 1;
    const next = {
      ...active,
      latestCaptureSequence: sequence,
      dailyAttempts: { day, count: dailyAttempts.count + 1 },
      updatedAt: nowIso(),
    };
    await atomicWriteJson(path.join(root, 'active.json'), next);
    return { sequence, baselineVersion: active.currentBaselineVersion, attemptNumber: dailyAttempts.count + 1, day };
  });
}

async function reserveRetry(root, expectedSequence) {
  return withLock(root, async () => {
    const active = await loadActive(root);
    if (active.latestCaptureSequence < expectedSequence) fail('STATE_CORRUPT', 'Capture sequence moved backwards.');
    const day = utcDay();
    const dailyAttempts = active.dailyAttempts?.day === day ? active.dailyAttempts : { day, count: 0 };
    if (dailyAttempts.count >= DAILY_ATTEMPT_LIMIT) return { allowed: false, day, count: dailyAttempts.count };
    const next = {
      ...active,
      dailyAttempts: { day, count: dailyAttempts.count + 1 },
      updatedAt: nowIso(),
    };
    await atomicWriteJson(path.join(root, 'active.json'), next);
    return { allowed: true, day, count: dailyAttempts.count + 1 };
  });
}

function chooseCaptureSource(project, input) {
  if (project.mode === 'live') {
    if (input.replayVersion !== undefined || input.sourceUrl !== undefined) {
      fail('SOURCE_OVERRIDE_FORBIDDEN', 'A live project always uses its owner-approved source URL.');
    }
    return { url: project.sourceUrl, replayVersion: null, expectedMarker: null, logicalSourceId: null };
  }
  const name = requireString(input.replayVersion, 'replayVersion', 80);
  const version = project.controlledReplay.versions.find((entry) => entry.name === name);
  if (!version) fail('UNKNOWN_REPLAY_VERSION', `Unknown controlled replay version: ${name}.`);
  return {
    url: version.url,
    replayVersion: version.name,
    expectedMarker: version.marker,
    logicalSourceId: project.controlledReplay.logicalSourceId,
  };
}

function parseCurlEnvelope(stdout) {
  const marker = Buffer.from('\n__ED_HTTP_STATUS__:');
  const index = stdout.lastIndexOf(marker);
  if (index < 0) fail('RETRIEVAL_FAILED', 'curl did not return an HTTP status marker.');
  const raw = stdout.subarray(0, index);
  const statusText = stdout.subarray(index + marker.length).toString('ascii').trim();
  const httpStatus = Number(statusText);
  if (!Number.isInteger(httpStatus) || httpStatus < 0 || httpStatus > 599) {
    fail('RETRIEVAL_FAILED', 'curl returned an invalid HTTP status marker.', { statusText });
  }
  return { raw, httpStatus };
}

async function invokeCurl(sourceUrl) {
  const payload = JSON.stringify({
    urls: [sourceUrl],
    extract_depth: 'basic',
    format: 'markdown',
    timeout: 10,
    include_usage: true,
  });
  const args = [
    '--silent',
    '--show-error',
    '--connect-timeout', '5',
    '--max-time', '20',
    '--request', 'POST',
    '--header', 'Content-Type: application/json',
  ];
  // Credentials never enter this template. A host gateway may inject them externally;
  // otherwise Tavily's documented keyless allowance handles the request.
  args.push('--header', 'X-Tavily-Access-Mode: keyless');
  args.push('--data-binary', payload, '--write-out', '\n__ED_HTTP_STATUS__:%{http_code}', TAVILY_ENDPOINT);
  // This override exists only so automated tests can substitute a deterministic executable.
  const binary = process.env.EVIDENCE_DOMINO_TEST_CURL_BIN || 'curl';
  const childEnv = { ...process.env };
  delete childEnv.TAVILY_API_KEY;
  let result;
  try {
    const { stdout, stderr } = await execFile(binary, args, {
      // Preserve response bytes before decoding. Invalid UTF-8 must never be
      // silently replaced in the evidence retained for the owner.
      encoding: 'buffer',
      maxBuffer: MAX_RESPONSE_BYTES + 16_384,
      timeout: 25_000,
      env: childEnv,
      windowsHide: true,
    });
    result = { raw: stdout, stderr: stderr.toString('utf8'), exitCode: 0, httpStatus: 0 };
  } catch (error) {
    const stdout = Buffer.isBuffer(error.stdout) ? error.stdout : Buffer.alloc(0);
    result = {
      raw: stdout,
      httpStatus: 0,
      stderr: Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8') : error.message,
      exitCode: Number.isInteger(error.code) ? error.code : null,
      signal: error.signal ?? null,
      executionCode: typeof error.code === 'string' ? error.code : null,
      responseComplete: false,
    };
  }
  let envelopeComplete = false;
  try {
    result = { ...result, ...parseCurlEnvelope(result.raw) };
    envelopeComplete = true;
  } catch {
    // The bounded stdout is retained even when no complete envelope was received.
    result.responseComplete = false;
  }
  const observedBytes = result.raw.length;
  if (observedBytes > MAX_RESPONSE_BYTES || result.executionCode === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
    const retained = result.raw.subarray(0, MAX_RESPONSE_BYTES);
    return { ...result, raw: retained, errorCode: 'RESPONSE_TOO_LARGE', responseComplete: false,
      responseTruncated: true, observedResponseBytes: observedBytes,
      responseSizeKnown: envelopeComplete && result.executionCode !== 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER' };
  }
  return { ...result, responseComplete: result.responseComplete ?? true,
    responseTruncated: false, observedResponseBytes: observedBytes, responseSizeKnown: result.responseComplete !== false };
}

function isTransientAttempt(attempt) {
  if (attempt.errorCode === 'RESPONSE_TOO_LARGE') return false;
  return attempt.httpStatus >= 500 || attempt.httpStatus === 0 || attempt.exitCode === 28 || attempt.signal === 'SIGTERM';
}

function parseTavilySuccess(attempt, source) {
  if (attempt.errorCode) return { ok: false, code: attempt.errorCode, message: 'Tavily response exceeded 1 MB; only a bounded diagnostic prefix was retained.' };
  if (attempt.httpStatus !== 200) {
    return { ok: false, code: `HTTP_${attempt.httpStatus || 'ERROR'}`, message: 'Tavily did not return HTTP 200.' };
  }
  let responseText;
  try {
    // captureCommand has already saved the original bytes at this point.
    responseText = new TextDecoder('utf-8', { fatal: true }).decode(attempt.raw);
  } catch {
    return { ok: false, code: 'INVALID_UTF8_RESPONSE', message: 'Tavily returned invalid UTF-8. The original response bytes were retained without interpreting them.' };
  }
  let body;
  try {
    body = JSON.parse(responseText);
  } catch (error) {
    return { ok: false, code: 'MALFORMED_RESPONSE', message: error.message };
  }
  if (!isPlainObject(body) || !Array.isArray(body.results)) return { ok: false, code: 'MALFORMED_RESPONSE', message: 'results is missing.' };
  const requested = normalizePublicHttpsUrl(source.url);
  const matching = body.results.filter((entry) => {
    if (!isPlainObject(entry) || typeof entry.url !== 'string') return false;
    try {
      return normalizePublicHttpsUrl(entry.url, 'result.url') === requested;
    } catch {
      return false;
    }
  });
  if (matching.length !== 1) {
    return { ok: false, code: 'RESULT_URL_MISMATCH', message: 'Tavily did not return exactly one result for the approved URL.' };
  }
  const content = matching[0].raw_content;
  if (typeof content !== 'string' || content.trim() === '') {
    return { ok: false, code: 'MISSING_CONTENT', message: 'The matching Tavily result has no extracted content.' };
  }
  if (Buffer.byteLength(content, 'utf8') > MAX_RESPONSE_BYTES) {
    return { ok: false, code: 'CONTENT_TOO_LARGE', message: 'Extracted content exceeds 1 MB.' };
  }
  if (source.expectedMarker && !content.includes(source.expectedMarker)) {
    return { ok: false, code: 'REPLAY_MARKER_MISMATCH', message: 'Controlled replay content lacks its declared version marker.' };
  }
  return {
    ok: true,
    content,
    resultUrl: matching[0].url,
    requestId: typeof body.request_id === 'string' ? body.request_id : null,
    usage: body.usage === undefined ? null : body.usage,
    failedResults: Array.isArray(body.failed_results) ? body.failed_results : [],
  };
}

export async function captureCommand(input, root) {
  requireObject(input, 'input');
  const project = await loadProject(root);
  const source = chooseCaptureSource(project, input);
  const reservation = await reserveCapture(root);
  const captureId = `capture-${String(reservation.sequence).padStart(6, '0')}`;
  const capturesRoot = path.join(root, 'captures');
  await mkdir(capturesRoot, { recursive: true });
  const stagedDir = path.join(capturesRoot, `.${captureId}.staged-${randomUUID()}`);
  await mkdir(stagedDir, { mode: 0o700 });
  const startedAt = nowIso();
  const attempts = [];
  let parsed = null;
  for (let index = 0; index < 2; index += 1) {
    if (index === 1) {
      const retry = await reserveRetry(root, reservation.sequence);
      if (!retry.allowed) break;
    }
    const attemptedAt = nowIso();
    const result = await invokeCurl(source.url);
    const raw = result.raw ?? Buffer.alloc(0);
    // Evidence ordering invariant: fsync the exact response body before any JSON,
    // URL, marker, or content parsing. An interrupted staged directory is retained.
    await writeNewFile(path.join(stagedDir, `attempt-${String(index + 1).padStart(2, '0')}.raw`), raw);
    attempts.push({
      number: index + 1,
      attemptedAt,
      httpStatus: result.httpStatus,
      exitCode: result.exitCode,
      signal: result.signal ?? null,
      executionCode: result.executionCode ?? null,
      stderr: result.stderr?.slice(0, 4_096) ?? '',
      responseBytes: raw.length,
      responseHash: sha256(raw),
      responseComplete: result.responseComplete,
      responseTruncated: result.responseTruncated,
      observedResponseBytes: result.observedResponseBytes,
      responseSizeKnown: result.responseSizeKnown,
    });
    parsed = parseTavilySuccess(result, source);
    if (parsed.ok || !isTransientAttempt(result)) break;
  }
  const finishedAt = nowIso();
  const successful = parsed?.ok === true;
  const record = {
    schemaVersion: 1,
    captureId,
    sequence: reservation.sequence,
    baselineVersion: reservation.baselineVersion,
    requestedAt: startedAt,
    completedAt: finishedAt,
    requestedUrl: source.url,
    logicalSourceId: source.logicalSourceId,
    replayVersion: source.replayVersion,
    expectedMarker: source.expectedMarker,
    controlledReplay: project.mode === 'controlled_replay',
    outcome: successful ? 'success' : 'failure',
    error: successful ? null : parsed ?? { code: 'RETRIEVAL_FAILED', message: 'No retrieval attempt completed.' },
    resultUrl: successful ? parsed.resultUrl : null,
    contentHash: successful ? sha256(parsed.content) : null,
    contentBytes: successful ? Buffer.byteLength(parsed.content, 'utf8') : 0,
    requestId: successful ? parsed.requestId : null,
    usage: successful ? parsed.usage : null,
    failedResults: successful ? parsed.failedResults : [],
    attempts: attempts.map(({ raw, ...attempt }) => attempt),
  };
  const finalDir = captureDir(root, captureId);
  if (await pathExists(finalDir)) fail('IMMUTABLE_CONFLICT', `${finalDir} already exists.`, { stagedDirectory: stagedDir });
  try {
    await writeNewFile(path.join(stagedDir, 'capture.json'), `${JSON.stringify(record, null, 2)}\n`);
    if (successful) await writeNewFile(path.join(stagedDir, 'content.md'), parsed.content);
    await rename(stagedDir, finalDir);
  } catch (error) {
    if (error instanceof EvidenceDominoError) throw error;
    fail('WRITE_FAILED', `Could not publish immutable capture ${captureId}.`, {
      cause: error.message,
      stagedDirectory: stagedDir,
    });
  }
  await persistObservationDisposition(root, {
    sequence: record.sequence,
    captureId: record.captureId,
    baselineVersion: record.baselineVersion,
    disposition: successful ? 'awaiting_interpretation' : 'capture_failed',
    decisionBasisChanged: !successful,
    observedAt: record.completedAt,
    captureError: successful ? null : record.error,
    interpretationUncertainty: null,
  }, {
    invalidateOlderReview: !successful,
    markProcessed: !successful,
  });
  return {
    ok: true,
    command: 'capture',
    status: successful ? 'captured' : 'failed',
    captureId,
    sequence: reservation.sequence,
    baselineVersion: reservation.baselineVersion,
    controlledReplay: record.controlledReplay,
    replayVersion: record.replayVersion,
    outcome: record.outcome,
    error: record.error,
    requestId: record.requestId,
    usage: record.usage,
    attempts: record.attempts.length,
    captureRecord: path.join(finalDir, 'capture.json'),
    contentPath: successful ? path.join(finalDir, 'content.md') : null,
    rawResponsePaths: record.attempts.map((_, index) => path.join(finalDir, `attempt-${String(index + 1).padStart(2, '0')}.raw`)),
  };
}

function materialFingerprint(baselineVersion, interpretation) {
  return sha256(stableJson({
    baselineVersion,
    unitPriceCents: interpretation.unitPriceCents,
    item: interpretation.item,
    unitBasis: interpretation.unitBasis,
    currency: interpretation.currency,
    terms: interpretation.comparability.terms,
  }));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function markdownCodeBlock(value) {
  return String(value).split('\n').map((line) => `    ${line}`).join('\n');
}

function markdownUrl(value) {
  return String(value).replaceAll('(', '%28').replaceAll(')', '%29');
}

function headlineFor(calculation, changed) {
  if (!changed) return 'The listed price matches the active draft assumption.';
  if (!calculation.meetsTarget) {
    return `At this listed price, your draft would miss its target by ${formatUsd(calculation.shortfallCents)}.`;
  }
  return `At this listed price, your draft would leave ${formatUsd(calculation.remainingCents)} before other costs.`;
}

function renderMarkdown(review, project, baseline, document, proposedDocument) {
  const lines = [
    '# Evidence Domino review',
    '',
    `> ${review.headline}`,
    '',
    `**Status when generated:** ${review.statusLabel}`,
    `**Generated:** ${review.createdAt}`,
    `**Document version:** ${baseline.version}`,
    `**Review ID:** ${review.reviewId}`,
    review.controlledReplay ? '**Controlled source replay:** Yes' : '**Controlled source replay:** No',
    '',
    '## Consequence',
    '',
    `- Listed unit price: ${formatUsd(baseline.unitPriceCents)} → ${formatUsd(review.interpretation.unitPriceCents)}`,
    `- Tracked supplier cost: ${formatUsd(baseline.calculation.trackedCostCents)} → ${formatUsd(review.calculation.trackedCostCents)}`,
    `- Remaining before other costs: ${formatUsd(baseline.calculation.remainingCents)} → ${formatUsd(review.calculation.remainingCents)}`,
    `- Minimum remaining amount: ${formatUsd(project.minimumRemainingCents)}`,
    `- Conditional shortfall: ${formatUsd(review.calculation.shortfallCents)}`,
    '',
    '## Before sending: price limit and options',
    '',
    ...recoveryFacts(review.recovery, review.recoveryError).map((fact) => `- ${fact}`),
    '',
    'These are conditional planning facts for the one tracked supplier cost. The customer quote and quantity stay unchanged; a different quote requires a separate business decision.',
    '',
    '## Affected sentences',
    '',
  ];
  if (review.changes.length === 0) lines.push('No tracked sentence needs revision.');
  for (const change of review.changes) {
    lines.push(
      `### ${change.role}`,
      '',
      'Before:',
      '',
      markdownCodeBlock(change.oldText),
      '',
      'After:',
      '',
      markdownCodeBlock(change.newText),
    );
  }
  lines.push(
    '',
    '## Evidence',
    '',
    '- Previous owner-confirmed draft source passage:',
    '',
    markdownCodeBlock(baseline.interpretation.supportingPassage),
    '',
    `- [Previous source URL](${markdownUrl(baseline.interpretation.sourceUrl)})`,
    baseline.interpretation.retrievedAt
      ? `- Previous passage retrieved: ${baseline.interpretation.retrievedAt}`
      : `- Previous passage owner-confirmed: ${baseline.interpretation.confirmedAt ?? 'Time not recorded'}`,
    '',
    '- New Tavily-returned passage:',
    '',
    markdownCodeBlock(review.interpretation.supportingPassage),
    '',
    `- [New source URL](${markdownUrl(review.source.requestedUrl)})`,
    `- Retrieved: ${review.source.retrievedAt}`,
    `- Capture ID: ${review.source.captureId}`,
    '',
    'This passage is a Tavily extraction of a public listing. It is not proof that a supplier contract changed. Applicability remains for the owner to confirm.',
    '',
    '## Proposed document',
    '',
    markdownCodeBlock(proposedDocument),
    '',
    '## Calculation',
    '',
    `- ${project.quantity} × ${formatUsd(review.interpretation.unitPriceCents)} = ${formatUsd(review.calculation.trackedCostCents)}`,
    `- ${formatUsd(project.customerQuoteCents)} − ${formatUsd(review.calculation.trackedCostCents)} = ${formatUsd(review.calculation.remainingCents)} before other costs`,
    `- Shortfall against ${formatUsd(project.minimumRemainingCents)} = ${formatUsd(review.calculation.shortfallCents)}`,
    '',
    '## Limits',
    '',
    '- Evidence Domino tracks exactly three owner-approved proposal sentences.',
    '- It does not validate every claim in the proposal.',
    '- Retrieval time is not the publisher’s modification time.',
    '- Owner approval is required before the observed price becomes the new baseline.',
    '',
    '## Snapshot',
    '',
    `- Revision ID: ${review.revisionId ?? 'None'}`,
    ...(review.revisionId
      ? [`- Exact approval phrase: Confirm that this observed price applies and adopt revision ${review.revisionId}.`]
      : []),
    '- This is an immutable snapshot. Ask for current status in chat before acting on an older report.',
    '',
    '## Original document snapshot',
    '',
    markdownCodeBlock(document),
    '',
  );
  return lines.join('\n');
}

function renderHtml(review, project, baseline, document, proposedDocument) {
  const h = escapeHtml;
  const minimumChange = review.changes.find((change) => change.role === 'minimum');
  const oldMinimum = baseline.anchors.minimum;
  const newMinimum = minimumChange?.newText ?? oldMinimum;
  const changeCards = review.changes.length === 0
    ? '<p class="quiet">No tracked sentence needs revision.</p>'
    : review.changes.map((change) => `<article class="change"><h3>${h(change.role)}</h3><p><span class="label">Before</span><del>${h(change.oldText)}</del></p><p><span class="label">Proposed</span><ins>${h(change.newText)}</ins></p></article>`).join('');
  // Show only context that is byte-identical in both documents; do not infer a date.
  const unchangedDate = document.split('\n').find((line) => /event date:/i.test(line) && proposedDocument.split('\n').includes(line));
  const passage = review.interpretation.supportingPassage;
  const literalIndex = passage.indexOf(review.interpretation.priceLiteral);
  const excerptStart = Math.max(0, literalIndex - 90);
  const excerpt = passage.slice(excerptStart, excerptStart + 260);
  const excerptLabel = `${excerptStart > 0 ? '…' : ''}${excerpt}${excerptStart + excerpt.length < passage.length ? '…' : ''}`;
  const replayBadge = review.controlledReplay ? '<span class="badge replay">Controlled source replay</span>' : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Evidence Domino — ${h(review.reviewId)}</title>
<style>
:root{color-scheme:light;--ink:#20201e;--muted:#605f59;--line:#dedbd4;--paper:#fff;--wash:#f7f6f2;--amber:#835000;--red:#992c20;--green:#24613a;--focus:#2357d8}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow-wrap:anywhere}main{max-width:1320px;margin:auto;padding:24px 32px}h1{font-size:clamp(1.65rem,2.65vw,2.25rem);line-height:1.15;max-width:1100px;margin:12px 0}h2{font-size:.76rem;letter-spacing:.06em;text-transform:uppercase;margin:0 0 12px;color:var(--muted)}h3{font-size:.95rem;margin:12px 0 6px}.topline,.badges{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.topline{justify-content:space-between}.eyebrow{letter-spacing:.08em;text-transform:uppercase;font-size:.78rem;font-weight:750}.badge{border-radius:5px;padding:4px 8px;font-weight:650;font-size:.75rem;background:#fff1d7;color:var(--amber)}.replay{background:#edf1fc;color:#29478a}.meta,.quiet{color:var(--muted);font-size:.8rem}.meta{margin:8px 0}.numbers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));background:var(--wash);border:1px solid var(--line);border-radius:8px;margin:18px 0}.number{min-width:0;padding:12px 16px;border-right:1px solid var(--line)}.number:last-child{border:0}.number small{display:block;color:var(--muted);font-size:.78rem}.number b{font-size:1.5rem;line-height:1.5;letter-spacing:-.03em}.grid{display:grid;grid-template-columns:1fr 1fr 1.08fr;border:1px solid var(--line);border-radius:8px;overflow:hidden}.panel{min-width:0;padding:18px;border-right:1px solid var(--line)}.panel:last-child{border:0}.sentence,blockquote,pre{font:1.06rem/1.5 Georgia,serif}.sentence{margin:8px 0}.label{display:block;font:600 .72rem/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--muted);margin-bottom:4px}.proposed{background:#fcfaf5}del{color:var(--red);text-decoration-thickness:1px}ins{text-decoration:none;color:var(--green)}blockquote{margin:8px 0;padding-left:12px;border-left:3px solid #b27620}.basis{font-size:.82rem;margin:10px 0}.context{border-bottom:1px solid var(--line);padding:10px 0;font-size:.82rem;margin:0}.approval{margin:14px 0;padding:12px 16px;background:var(--wash);border-left:3px solid #b27620}.approval p{margin:4px 0}.approval .phrase{font-size:.88rem}details{border:1px solid var(--line);border-radius:8px;padding:12px 16px;margin:12px 0;min-width:0}summary{cursor:pointer;font-weight:650}a{color:#214eb3}a:focus-visible,summary:focus-visible{outline:3px solid var(--focus);outline-offset:4px}pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:14px 0}.change{border-top:1px solid var(--line);padding:8px 0}.change:first-child{border:0}.change p{margin:8px 0}.change del,.change ins{font:1rem/1.5 Georgia,serif}.documents{display:grid;grid-template-columns:1fr 1fr;gap:24px}.documents>*{min-width:0}.warning{color:var(--amber)}footer{margin:16px 0;font-size:.8rem;color:var(--muted)}@media(max-width:760px){main{padding:16px}.topline{align-items:flex-start;gap:10px}h1{font-size:1.6rem}.numbers{grid-template-columns:repeat(2,minmax(0,1fr))}.number{padding:10px}.number:nth-child(2){border-right:0}.number:nth-child(-n+2){border-bottom:1px solid var(--line)}.number b{font-size:1.3rem}.grid,.documents{grid-template-columns:minmax(0,1fr)}.panel{border-right:0;border-bottom:1px solid var(--line);padding:16px}.panel:last-child{border:0}}
</style></head><body><main>
<header class="mast"><div class="topline"><div class="eyebrow">Evidence Domino</div><div class="badges"><span class="badge">${h(review.statusLabel)}</span>${replayBadge}</div></div><h1>${h(review.headline)}</h1><p class="meta">Status when generated · ${h(review.createdAt)} · document v${baseline.version} · ${h(review.reviewId)}</p></header>
<section class="numbers" aria-label="Calculation summary">
<div class="number"><small>Unit price</small><b>${h(formatUsd(baseline.unitPriceCents))} → ${h(formatUsd(review.interpretation.unitPriceCents))}</b></div>
<div class="number"><small>Remaining before other costs</small><b>${h(formatUsd(baseline.calculation.remainingCents))} → ${h(formatUsd(review.calculation.remainingCents))}</b></div>
<div class="number"><small>Tracked supplier cost</small><b>${h(formatUsd(review.calculation.trackedCostCents))}</b></div>
<div class="number"><small>Conditional shortfall</small><b>${h(formatUsd(review.calculation.shortfallCents))}</b></div></section>
<section class="grid" aria-label="Evidence and proposal consequence">
<article class="panel"><h2>What your draft says</h2><p class="label">Exact tracked minimum sentence</p><p class="sentence">${minimumChange ? `<del>${h(oldMinimum)}</del>` : h(oldMinimum)}</p><p class="meta">Minimum remaining amount: ${h(formatUsd(project.minimumRemainingCents))}</p></article>
<article class="panel proposed"><h2>${minimumChange ? 'Proposed repair' : 'Minimum sentence unchanged'}</h2><p class="label">${minimumChange ? 'If this observed price applies' : 'No condition change'}</p><p class="sentence" id="minimum-repair">${minimumChange ? `<ins>${h(newMinimum)}</ins>` : h(newMinimum)}</p><p class="meta">${review.changes.length ? `${review.changes.length} of 3 tracked sentences need revision.` : 'No tracked sentence needs revision.'} Full sentence changes below.</p></article>
<article class="panel"><h2>What the source now says</h2><blockquote id="source-excerpt">${h(excerptLabel)}</blockquote><p class="basis">${h(project.item)} · ${project.quantity.toLocaleString('en-US')} ${h(project.unitBasis)} · USD</p><p class="meta"><a href="${h(review.source.requestedUrl)}" target="_blank" rel="noopener noreferrer">Open new source</a> · retrieved ${h(review.source.retrievedAt)}</p><p class="meta warning">A public listing is not proof that a supplier contract changed.</p></article></section>
${unchangedDate ? `<p class="context"><strong>Unchanged context:</strong> ${h(unchangedDate)}</p>` : ''}
<section class="approval" aria-label="Owner review"><p><strong>${review.revisionId ? 'What needs your approval' : 'No revision to approve'}</strong></p><p>${review.revisionId ? 'Confirm that the item, unit and listed terms apply to this draft before adopting the proposed document.' : 'The observed price does not require a document change.'}</p>${review.revisionId ? `<p class="phrase"><strong>Exact approval phrase:</strong> ${h(`Confirm that this observed price applies and adopt revision ${review.revisionId}.`)}</p>` : ''}</section>
<details open><summary>Before sending: price limit and options</summary>${recoveryFacts(review.recovery, review.recoveryError).map((fact) => `<p>${h(fact)}</p>`).join('')}<p class="meta">Conditional planning facts for one tracked supplier cost. The customer quote and quantity stay unchanged; a different quote requires a separate business decision. This is not a complete proposal check.</p></details>
<details><summary>Affected tracked sentences (${review.changes.length} changed)</summary>${changeCards}</details>
<details><summary>Full evidence and source context</summary><h3>Previous owner-confirmed passage</h3><blockquote>${h(baseline.interpretation.supportingPassage)}</blockquote><p class="meta"><a href="${h(baseline.interpretation.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open previous source</a> · ${baseline.interpretation.retrievedAt ? `retrieved ${h(baseline.interpretation.retrievedAt)}` : `owner-confirmed ${h(baseline.interpretation.confirmedAt ?? 'Time not recorded')}`}</p><h3>New Tavily-returned passage</h3><blockquote>${h(passage)}</blockquote><p class="meta">${h(review.source.requestedUrl)}<br>Retrieved: ${h(review.source.retrievedAt)} · capture ${h(review.source.captureId)}</p><p>These are transformed extraction passages, not authenticated copies of the publisher’s website. Review the full passage and applicable offer terms.</p></details>
<details><summary>Full original and proposed documents</summary><div class="documents"><section><h3>Original document v${baseline.version}</h3><pre>${h(document)}</pre></section><section><h3>Proposed document</h3><pre>${h(proposedDocument)}</pre></section></div></details>
<details><summary>Calculation and limits</summary><p>${project.quantity.toLocaleString('en-US')} × ${h(formatUsd(review.interpretation.unitPriceCents))} = ${h(formatUsd(review.calculation.trackedCostCents))}. ${h(formatUsd(project.customerQuoteCents))} − ${h(formatUsd(review.calculation.trackedCostCents))} = ${h(formatUsd(review.calculation.remainingCents))} before other costs.</p><p>Minimum: ${h(formatUsd(project.minimumRemainingCents))}. Conditional shortfall: ${h(formatUsd(review.calculation.shortfallCents))}.</p><p>Evidence Domino tracks exactly three owner-approved sentences. It does not validate every claim in the proposal. Retrieval time is not publisher modification time. The owner must confirm applicability before adoption.</p></details>
<footer><p><strong>Revision ID:</strong> ${h(review.revisionId ?? 'None')}</p><p>This is an immutable snapshot. Ask for current status in chat before acting on an older report.</p></footer>
</main></body></html>`;
}

export async function stageCommand(input, root) {
  requireObject(input, 'input');
  const captureId = requireString(input.captureId, 'captureId', 100);
  const capture = await loadCapture(root, captureId);
  if (capture.outcome !== 'success') fail('CAPTURE_FAILED', 'Cannot stage a review from a failed capture.', { captureId, error: capture.error });
  const preflightActive = await loadActive(root);
  if (capture.sequence <= preflightActive.latestProcessedSequence) {
    fail('STALE_CAPTURE', 'A newer or equal observation has already been processed.', {
      captureSequence: capture.sequence,
      latestProcessedSequence: preflightActive.latestProcessedSequence,
    });
  }
  if (preflightActive.latestObservation && capture.sequence < preflightActive.latestObservation.sequence) {
    fail('STALE_CAPTURE', 'A newer observation already exists, so this delayed capture cannot be staged.', {
      captureSequence: capture.sequence,
      latestObservationSequence: preflightActive.latestObservation.sequence,
    });
  }
  let project;
  let interpretation;
  try {
    const content = await readFile(path.join(captureDir(root, captureId), 'content.md'), 'utf8');
    if (sha256(content) !== capture.contentHash) {
      fail('CAPTURE_INTEGRITY_FAILED', 'The preserved extraction no longer matches its immutable capture record.');
    }
    project = await loadProject(root);
    interpretation = validateInterpretation(input.interpretation, project, capture, content);
  } catch (error) {
    if (error instanceof EvidenceDominoError) {
      const candidate = isPlainObject(input.interpretation) ? input.interpretation : {};
      await persistObservationDisposition(root, {
        sequence: capture.sequence,
        captureId: capture.captureId,
        baselineVersion: capture.baselineVersion,
        disposition: 'interpretation_needs_review',
        decisionBasisChanged: true,
        observedAt: nowIso(),
        captureError: null,
        interpretationUncertainty: {
          code: error.code,
          message: error.message,
          candidateCount: candidate.candidateCount ?? null,
          alternatives: Array.isArray(candidate.alternatives) ? candidate.alternatives.slice(0, 10) : [],
          uncertainties: Array.isArray(candidate.uncertainties) ? candidate.uncertainties.slice(0, 10) : [],
          comparability: isPlainObject(candidate.comparability) ? candidate.comparability : null,
        },
      }, { invalidateOlderReview: true, markProcessed: false });
    }
    throw error;
  }

  return withLock(root, async () => {
    const active = await loadActive(root);
    if (capture.sequence <= active.latestProcessedSequence) {
      fail('STALE_CAPTURE', 'A newer or equal capture sequence has already been processed.', {
        captureSequence: capture.sequence,
        latestProcessedSequence: active.latestProcessedSequence,
      });
    }
    if (active.latestObservation && capture.sequence < active.latestObservation.sequence) {
      fail('STALE_CAPTURE', 'A newer observation arrived before this stage could commit.', {
        captureSequence: capture.sequence,
        latestObservationSequence: active.latestObservation.sequence,
      });
    }
    if (capture.baselineVersion !== active.currentBaselineVersion) {
      fail('STALE_CAPTURE', 'The active baseline changed after this capture began.', {
        captureBaselineVersion: capture.baselineVersion,
        currentBaselineVersion: active.currentBaselineVersion,
      });
    }
    const baseline = await loadBaseline(root, active.currentBaselineVersion);
    const document = await readFile(path.join(baselineDir(root, baseline.version), 'document.md'), 'utf8');
    if (sha256(document) !== baseline.documentHash) fail('STATE_CORRUPT', 'Active document hash does not match its baseline record.');
    validateAnchors(document, baseline.anchors);
    validateMinimumSentence(baseline.anchors.minimum, project, baseline.calculation);
    const fingerprint = materialFingerprint(baseline.version, interpretation);
    const pendingReview = active.latestApplicableReviewId ? await loadReview(root, active.latestApplicableReviewId) : null;
    if (fingerprint === active.latestMaterialFingerprint && pendingReview?.baselineRecordHash === sha256(stableJson(baseline))) {
      const next = {
        ...active,
        latestProcessedSequence: capture.sequence,
        latestObservation: {
          sequence: capture.sequence,
          captureId,
          baselineVersion: baseline.version,
          disposition: 'duplicate_suppressed',
          decisionBasisChanged: false,
          observedAt: nowIso(),
          captureError: null,
          interpretationUncertainty: null,
        },
        updatedAt: nowIso(),
      };
      await atomicWriteJson(path.join(root, 'active.json'), next);
      return {
        ok: true,
        command: 'stage',
        status: 'duplicate_suppressed',
        captureId,
        existingReviewId: active.latestApplicableReviewId,
        baselineVersion: baseline.version,
      };
    }
    const calculation = calculate(project.quantity, interpretation.unitPriceCents, project.customerQuoteCents, project.minimumRemainingCents);
    const { recovery, recoveryError } = recoveryForReview(project, interpretation.unitPriceCents);
    const changed = interpretation.unitPriceCents !== baseline.unitPriceCents;
    const newSentences = buildSentences(project, interpretation.unitPriceCents, calculation);
    const changedRoles = changed
      ? ['cost', 'remaining', ...(calculation.meetsTarget !== baseline.calculation.meetsTarget ? ['minimum'] : [])]
      : [];
    const patch = applySentencePatch(document, baseline.anchors, newSentences, changedRoles);
    const proposedDocumentHash = sha256(patch.proposed);
    const revisionSeed = stableJson({
      captureId,
      baselineVersion: baseline.version,
      documentHash: baseline.documentHash,
      proposedDocumentHash,
      calculation,
      interpretation,
    });
    const revisionId = changed ? `revision-${String(capture.sequence).padStart(6, '0')}-${sha256(revisionSeed).slice(0, 10)}` : null;
    const reviewId = `review-${String(capture.sequence).padStart(6, '0')}-${sha256(revisionSeed).slice(0, 10)}`;
    const createdAt = nowIso();
    const reviewWithoutHash = {
      schemaVersion: 1,
      reviewId,
      revisionId,
      createdAt,
      status: changed ? 'awaiting_applicability_review' : 'no_material_change',
      statusLabel: changed ? 'Applicability awaiting review' : 'No material change',
      headline: headlineFor(calculation, changed),
      controlledReplay: capture.controlledReplay,
      baselineVersion: baseline.version,
      baselineDocumentHash: baseline.documentHash,
      baselineRecordHash: sha256(stableJson(baseline)),
      captureSequence: capture.sequence,
      source: {
        captureId,
        requestedUrl: capture.requestedUrl,
        resultUrl: capture.resultUrl,
        retrievedAt: capture.completedAt,
        requestId: capture.requestId,
        replayVersion: capture.replayVersion,
      },
      interpretation,
      calculation,
      recovery,
      recoveryError,
      changed,
      changedRoles,
      changes: patch.changes.map(({ role, oldText, newText }) => ({ role, oldText, newText })),
      nextAnchors: patch.nextAnchors,
      proposedDocumentHash,
      materialFingerprint: fingerprint,
      artifactPaths: {
        html: `reviews/${reviewId}/report.html`,
        markdown: `reviews/${reviewId}/report.md`,
        proposedDocument: `reviews/${reviewId}/proposed.md`,
      },
    };
    const provisionalReview = { ...reviewWithoutHash, reviewHash: null };
    const markdown = renderMarkdown(provisionalReview, project, baseline, document, patch.proposed);
    const html = renderHtml(provisionalReview, project, baseline, document, patch.proposed);
    const artifactHashes = {
      html: sha256(html),
      markdown: sha256(markdown),
      proposedDocument: proposedDocumentHash,
    };
    const reviewWithArtifacts = { ...reviewWithoutHash, artifactHashes };
    const reviewHash = sha256(stableJson(reviewWithArtifacts));
    const review = { ...reviewWithArtifacts, reviewHash };
    await writeImmutableDirectory(reviewDir(root, reviewId), {
      'review.json': `${JSON.stringify(review, null, 2)}\n`,
      'report.md': markdown,
      'report.html': html,
      'proposed.md': patch.proposed,
    });
    const next = {
      ...active,
      latestProcessedSequence: capture.sequence,
      latestReviewId: reviewId,
      latestApplicableReviewId: changed ? reviewId : null,
      latestMaterialFingerprint: fingerprint,
      latestObservation: {
        sequence: capture.sequence,
        captureId,
        baselineVersion: baseline.version,
        disposition: changed ? 'review_staged' : 'no_material_change',
        decisionBasisChanged: changed,
        observedAt: createdAt,
        reviewId,
        captureError: null,
        interpretationUncertainty: null,
      },
      updatedAt: nowIso(),
    };
    await atomicWriteJson(path.join(root, 'active.json'), next);
    return {
      ok: true,
      command: 'stage',
      status: changed ? 'awaiting_applicability_review' : 'no_material_change',
      reviewId,
      revisionId,
      reviewHash,
      baselineVersion: baseline.version,
      headline: review.headline,
      calculation,
      recovery,
      recoveryError,
      changedRoles,
      reportHtml: path.join(reviewDir(root, reviewId), 'report.html'),
      reportMarkdown: path.join(reviewDir(root, reviewId), 'report.md'),
      proposedDocument: path.join(reviewDir(root, reviewId), 'proposed.md'),
      requiredConfirmation: changed
        ? `Confirm that this observed price applies and adopt revision ${revisionId}.`
        : null,
    };
  });
}

function reviewHashOf(review) {
  const { reviewHash, ...withoutHash } = review;
  return sha256(stableJson(withoutHash));
}

export async function approveCommand(input, root) {
  requireObject(input, 'input');
  const reviewId = requireString(input.reviewId, 'reviewId', 120);
  const revisionId = requireString(input.revisionId, 'revisionId', 120);
  const suppliedHash = requireString(input.reviewHash, 'reviewHash', 128);
  const expectedConfirmation = `Confirm that this observed price applies and adopt revision ${revisionId}.`;
  if (input.confirmation !== expectedConfirmation) {
    fail('OWNER_CONFIRMATION_REQUIRED', `Approval requires the exact confirmation: ${expectedConfirmation}`);
  }
  return withLock(root, async () => {
    const active = await loadActive(root);
    const review = await loadReview(root, reviewId);
    const storedHash = reviewHashOf(review);
    if (storedHash !== review.reviewHash || suppliedHash !== review.reviewHash) {
      fail('REVIEW_INTEGRITY_FAILED', 'The displayed or stored review hash is no longer valid.');
    }
    if (review.revisionId !== revisionId || !review.changed) fail('INVALID_REVISION', 'The named review has no matching adoptable revision.');
    if (
      active.latestCaptureSequence > active.latestProcessedSequence ||
      (active.latestObservation?.decisionBasisChanged === true &&
      active.latestObservation.sequence > review.captureSequence)
    ) {
      fail('STALE_APPROVAL', 'A newer capture is incomplete, awaits interpretation, or superseded this review. Validate the latest observation before approval.', {
        latestObservation: active.latestObservation,
      });
    }
    if (active.currentBaselineVersion > review.baselineVersion) {
      const current = await loadBaseline(root, active.currentBaselineVersion);
      if (current.adoptedReviewId === reviewId) {
        return {
          ok: true,
          command: 'approve',
          status: 'already_approved',
          reviewId,
          revisionId,
          baselineVersion: current.version,
          documentHash: current.documentHash,
        };
      }
      fail('STALE_APPROVAL', 'The active baseline changed after this review was prepared.');
    }
    if (active.currentBaselineVersion !== review.baselineVersion || active.latestApplicableReviewId !== reviewId) {
      fail('STALE_APPROVAL', 'This is not the latest applicable review for the active baseline.');
    }
    const current = await loadBaseline(root, active.currentBaselineVersion);
    if (!review.baselineRecordHash || review.baselineRecordHash !== sha256(stableJson(current))) {
      fail('STALE_APPROVAL', 'The baseline metadata changed or this legacy review lacks a baseline-record hash. Capture and stage a fresh review.');
    }
    const currentDocument = await readFile(path.join(baselineDir(root, current.version), 'document.md'), 'utf8');
    if (sha256(currentDocument) !== current.documentHash || current.documentHash !== review.baselineDocumentHash) {
      fail('STALE_APPROVAL', 'The active document changed after this review was prepared.');
    }
    const proposedPath = path.join(reviewDir(root, reviewId), 'proposed.md');
    const proposed = await readFile(proposedPath, 'utf8');
    if (sha256(proposed) !== review.proposedDocumentHash) fail('REVIEW_INTEGRITY_FAILED', 'The proposed document no longer matches the review.');
    const reportHtml = await readFile(path.join(reviewDir(root, reviewId), 'report.html'), 'utf8');
    const reportMarkdown = await readFile(path.join(reviewDir(root, reviewId), 'report.md'), 'utf8');
    if (
      sha256(reportHtml) !== review.artifactHashes?.html ||
      sha256(reportMarkdown) !== review.artifactHashes?.markdown ||
      sha256(proposed) !== review.artifactHashes?.proposedDocument
    ) {
      fail('REVIEW_INTEGRITY_FAILED', 'A displayed review artifact changed after staging.');
    }
    validateAnchors(proposed, review.nextAnchors);
    const nextVersion = current.version + 1;
    const adoptedAt = nowIso();
    const nextBaseline = {
      schemaVersion: 1,
      version: nextVersion,
      createdAt: adoptedAt,
      documentHash: review.proposedDocumentHash,
      anchors: review.nextAnchors,
      unitPriceCents: review.interpretation.unitPriceCents,
      calculation: review.calculation,
      conditionStatus: review.calculation.meetsTarget ? 'meets_target' : 'misses_target',
      interpretation: {
        ...review.interpretation,
        status: 'owner_confirmed_applicable',
        approvedAt: adoptedAt,
      },
      adoptedReviewId: reviewId,
      approval: {
        revisionId,
        confirmation: input.confirmation,
        reviewHash: review.reviewHash,
        approvedAt: adoptedAt,
      },
    };
    const target = baselineDir(root, nextVersion);
    if (await pathExists(target)) {
      const existing = await loadBaseline(root, nextVersion);
      if (existing.adoptedReviewId !== reviewId || existing.documentHash !== nextBaseline.documentHash) {
        fail('IMMUTABLE_CONFLICT', 'A different immutable baseline already occupies the next version.');
      }
    } else {
      await writeImmutableDirectory(target, {
        'baseline.json': `${JSON.stringify(nextBaseline, null, 2)}\n`,
        'document.md': proposed,
      });
    }
    const nextActive = {
      ...active,
      currentBaselineVersion: nextVersion,
      latestApplicableReviewId: null,
      latestMaterialFingerprint: sha256(stableJson({ unitPriceCents: nextBaseline.unitPriceCents, baselineVersion: nextVersion })),
      updatedAt: adoptedAt,
    };
    await atomicWriteJson(path.join(root, 'active.json'), nextActive);
    return {
      ok: true,
      command: 'approve',
      status: 'approved',
      reviewId,
      revisionId,
      baselineVersion: nextVersion,
      documentHash: nextBaseline.documentHash,
      calculation: nextBaseline.calculation,
      adoptedDocument: path.join(target, 'document.md'),
    };
  });
}

export async function statusCommand(root) {
  const active = await loadActive(root);
  const project = await loadProject(root);
  const baseline = await loadBaseline(root, active.currentBaselineVersion);
  const day = utcDay();
  const used = active.dailyAttempts?.day === day ? active.dailyAttempts.count : 0;
  let latestReview = null;
  if (active.latestReviewId) {
    const review = await loadReview(root, active.latestReviewId);
    latestReview = {
      reviewId: review.reviewId,
      revisionId: review.revisionId,
      status: review.status,
      statusWhenGenerated: review.status,
      currentDisposition: baseline.adoptedReviewId === review.reviewId
        ? 'approved'
        : active.latestApplicableReviewId === review.reviewId
          ? 'awaiting_applicability_review'
          : 'informational_or_superseded',
      headline: review.headline,
      // Older snapshots intentionally have no recovery field; never rewrite their hashes.
      recovery: review.recovery ?? null,
      recoveryError: review.recoveryError ?? null,
      reviewHash: review.reviewHash,
      reportHtml: path.join(reviewDir(root, review.reviewId), 'report.html'),
    };
  }
  let lock = null;
  try {
    lock = await readJson(path.join(root, '.lock', 'owner.json'));
  } catch {
    // No readable lock exists.
  }
  return {
    ok: true,
    command: 'status',
    projectId: project.projectId,
    mode: project.mode,
    monitoring: 'manual',
    baseline: {
      version: baseline.version,
      documentHash: baseline.documentHash,
      unitPriceCents: baseline.unitPriceCents,
      calculation: baseline.calculation,
      ...recoveryForReview(project, baseline.unitPriceCents),
      conditionStatus: baseline.conditionStatus,
      documentPath: path.join(baselineDir(root, baseline.version), 'document.md'),
    },
    latestCaptureSequence: active.latestCaptureSequence,
    latestProcessedSequence: active.latestProcessedSequence,
    latestReview,
    latestObservation: active.latestObservation ?? null,
    pendingApplicabilityReviewId: active.latestApplicableReviewId,
    requestBudget: { day, used, limit: DAILY_ATTEMPT_LIMIT, remaining: Math.max(0, DAILY_ATTEMPT_LIMIT - used) },
    lock: lock ? {
      active: true,
      owner: lock,
      recovery: 'Confirm no Evidence Domino process is running, inspect .lock/owner.json, then remove only that .lock directory.',
    } : { active: false },
  };
}

export async function runCommand(command, input, options = {}) {
  const root = path.resolve(options.dataDir ?? DEFAULT_DATA_DIR);
  if (!COMMANDS.has(command)) fail('UNKNOWN_COMMAND', `Unknown command: ${command}.`);
  if (command === 'init') return initCommand(input, root);
  if (command === 'capture') return captureCommand(input, root);
  if (command === 'stage') return stageCommand(input, root);
  if (command === 'approve') return approveCommand(input, root);
  return statusCommand(root);
}

function parseCliArgs(argv) {
  const [command, ...rest] = argv;
  if (!COMMANDS.has(command)) {
    fail('USAGE', 'Usage: evidence-domino.mjs <init|capture|stage|approve|status> [--input file.json] [--data-dir directory]');
  }
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === '--input' || token === '--data-dir') {
      if (!rest[index + 1]) fail('USAGE', `${token} requires a value.`);
      options[token.slice(2).replace('-', '')] = rest[index + 1];
      index += 1;
    } else {
      fail('USAGE', `Unknown argument: ${token}.`);
    }
  }
  if (command !== 'status' && !options.input) fail('USAGE', `${command} requires --input file.json.`);
  return { command, inputPath: options.input, dataDir: options.datadir };
}

export async function main(argv = process.argv.slice(2)) {
  try {
    const parsed = parseCliArgs(argv);
    const input = parsed.inputPath ? await readJson(path.resolve(parsed.inputPath), 'INVALID_INPUT_FILE') : {};
    const result = await runCommand(parsed.command, input, { dataDir: parsed.dataDir });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    const known = error instanceof EvidenceDominoError;
    const response = {
      ok: false,
      error: {
        code: known ? error.code : 'INTERNAL_ERROR',
        message: error.message,
        ...(known && error.details !== undefined ? { details: error.details } : {}),
      },
    };
    process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
    process.exitCode = 1;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
