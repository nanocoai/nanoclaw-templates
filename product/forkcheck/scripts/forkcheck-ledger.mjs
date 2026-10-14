#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const STATUSES = new Set(['SUPPORTED', 'REFUTED', 'MIXED', 'UNRESOLVED', 'INVALIDATED']);
const CONFIDENCES = new Set(['LOW', 'MEDIUM', 'HIGH']);
const VOLATILITIES = new Set(['LOW', 'MEDIUM', 'HIGH']);
const RECHECK_OUTCOMES = new Set(['UNCHANGED', 'STRENGTHENED', 'WEAKENED', 'INVALIDATED', 'UNRESOLVED']);

function fail(message) {
  process.stderr.write(`ForkCheck ledger error: ${message}\n`);
  process.exitCode = 1;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith('--')) throw new Error(`unexpected argument: ${token}`);
    const key = token.slice(2);
    const value = rest[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  return { command, options };
}

function resolveDataDir(options) {
  return path.resolve(
    options['data-dir'] ||
      process.env.PLUGIN_DATA ||
      path.join(process.cwd(), '.forkcheck-data'),
  );
}

function emptyLedger() {
  return {
    schemaVersion: 1,
    nextId: 1,
    records: [],
  };
}

function ensureDataDir(dataDir) {
  fs.mkdirSync(path.join(dataDir, 'receipts'), { recursive: true });
}

function ledgerPath(dataDir) {
  return path.join(dataDir, 'ledger.json');
}

function readLedger(dataDir) {
  const file = ledgerPath(dataDir);
  if (!fs.existsSync(file)) return emptyLedger();
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (parsed?.schemaVersion !== 1 || !Number.isInteger(parsed.nextId) || !Array.isArray(parsed.records)) {
    throw new Error(`unsupported or malformed ledger: ${file}`);
  }
  return parsed;
}

function writeJsonSafely(file, value) {
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  try {
    fs.renameSync(temporary, file);
  } catch (error) {
    if (!['EEXIST', 'EPERM'].includes(error?.code)) throw error;
    fs.copyFileSync(temporary, file);
    fs.unlinkSync(temporary);
  }
}

function writeLedger(dataDir, ledger) {
  ensureDataDir(dataDir);
  writeJsonSafely(ledgerPath(dataDir), ledger);
}

function readPayload(file) {
  if (!file) throw new Error('--input is required');
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

function requireText(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be a nonempty string`);
  return value.trim();
}

function requireEnum(value, allowed, label) {
  if (!allowed.has(value)) throw new Error(`${label} must be one of: ${[...allowed].join(', ')}`);
  return value;
}

function requireHypotheses(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('hypotheses must be an object');
  }
  const entries = Object.entries(value);
  if (entries.length < 2) throw new Error('at least two hypotheses are required');
  return Object.fromEntries(entries.map(([key, hypothesis]) => [key, requireText(hypothesis, `hypotheses.${key}`)]));
}

function requireStringArray(value, label, allowEmpty = true) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`${label} must be ${allowEmpty ? 'an' : 'a nonempty'} array`);
  }
  return value.map((item, index) => requireText(item, `${label}[${index}]`));
}

function normalizeEvidence(items, recordedAt, metadata = {}) {
  if (!Array.isArray(items)) throw new Error('evidence must be an array');
  return items.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`evidence[${index}] must be an object`);
    }
    const classification = requireEnum(
      item.classification,
      new Set(['OBSERVED', 'INFERRED', 'CLAIMED', 'NOT TESTED']),
      `evidence[${index}].classification`,
    );
    return {
      ...item,
      classification,
      title: requireText(item.title, `evidence[${index}].title`),
      finding: requireText(item.finding, `evidence[${index}].finding`),
      recordedAt,
      ...metadata,
    };
  });
}

function isoOrNull(value, label) {
  if (value === null || value === undefined) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error(`${label} must be an ISO-8601 date`);
  return date.toISOString();
}

function nextCheckFrom(recordedAt, intervalDays) {
  if (!Number.isFinite(intervalDays) || intervalDays <= 0) {
    throw new Error('recheckIntervalDays must be a positive number');
  }
  return new Date(new Date(recordedAt).valueOf() + intervalDays * 86_400_000).toISOString();
}

function allocateId(ledger) {
  const id = `FC-${String(ledger.nextId).padStart(4, '0')}`;
  ledger.nextId += 1;
  return id;
}

function renderEvidence(evidence) {
  if (!evidence.length) return '- No evidence recorded.';
  return evidence
    .map((item) => {
      const source = item.source ? ` — ${item.source}` : '';
      const timestamp = item.retrievedAt || item.executedAt || item.recordedAt;
      return `- [${item.classification}] ${item.title}${source}\n  - Finding: ${item.finding}\n  - Timestamp: ${timestamp}`;
    })
    .join('\n');
}

function renderHypotheses(hypotheses) {
  return Object.entries(hypotheses)
    .map(([key, value]) => `${key.toUpperCase()}:\n${value}`)
    .join('\n\n');
}

function renderReceipt(record, event) {
  const latestHistory = record.history.at(-1);
  const supported = record.supportedHypotheses?.length
    ? record.supportedHypotheses.map((key) => key.toUpperCase()).join(', ')
    : 'None assigned';
  const header = event === 'INVALIDATED' ? '⚠️ VERDICT INVALIDATED' : `FORKCHECK VERDICT ${record.id}`;
  const invalidation = event === 'INVALIDATED'
    ? `\nPrevious conclusion:\n${latestHistory.previousStatus} — ${(latestHistory.previousSupportedHypotheses || []).map((key) => key.toUpperCase()).join(', ') || 'no hypothesis recorded'}\n\nRecommended action:\nReopen decisions that depended on ${record.id}.\n`
    : '';

  return `${header}\n\nForkCheck verdict:\n${record.id}\n\nQuestion:\n${record.question}\n\nHypotheses:\n${renderHypotheses(record.hypotheses)}\n\nTest:\n${record.decisiveTest.name}\n${record.decisiveTest.method || ''}\nExecuted: ${record.decisiveTest.executed === true ? 'yes' : 'no'}\n\nObserved:\n${record.observation}\n\nSupporting evidence:\n${renderEvidence(record.evidence)}\n\nVerdict:\n${record.status}${record.status === 'SUPPORTED' || record.status === 'REFUTED' ? ` — ${supported}` : ''}\n\nConfidence:\n${record.confidence}\n\nVolatility:\n${record.volatility}\n\nRecheck:\n${record.nextCheckAt || 'No automatic recheck scheduled'}\n\nCreated:\n${record.createdAt}\n\nLast checked:\n${record.lastCheckedAt}\n\nLimitations:\n${record.limitations.length ? record.limitations.map((item) => `- ${item}`).join('\n') : '- None recorded.'}\n${invalidation}`;
}

function writeReceipt(dataDir, record, event) {
  const directory = path.join(dataDir, 'receipts', record.id);
  fs.mkdirSync(directory, { recursive: true });
  const sequence = String(record.receipts.length + 1).padStart(3, '0');
  const slug = event.toLowerCase().replaceAll('_', '-');
  const relative = path.join('receipts', record.id, `${sequence}-${slug}.md`);
  const content = renderReceipt(record, event);
  fs.writeFileSync(path.join(dataDir, relative), content, 'utf8');
  fs.writeFileSync(path.join(directory, 'latest.md'), content, 'utf8');
  record.receipts.push(relative.replaceAll('\\', '/'));
  return relative.replaceAll('\\', '/');
}

function validateLedger(ledger) {
  const ids = new Set();
  for (const record of ledger.records) {
    requireText(record.id, 'record.id');
    if (ids.has(record.id)) throw new Error(`duplicate record id: ${record.id}`);
    ids.add(record.id);
    requireText(record.question, `${record.id}.question`);
    requireHypotheses(record.hypotheses);
    requireEnum(record.status, STATUSES, `${record.id}.status`);
    requireEnum(record.confidence, CONFIDENCES, `${record.id}.confidence`);
    requireEnum(record.volatility, VOLATILITIES, `${record.id}.volatility`);
    if (!Array.isArray(record.evidence) || !Array.isArray(record.history) || !Array.isArray(record.receipts)) {
      throw new Error(`${record.id} has malformed evidence, history, or receipts`);
    }
  }
  return { valid: true, records: ledger.records.length, nextId: ledger.nextId };
}

function recordVerdict(dataDir, ledger, payload) {
  const now = new Date().toISOString();
  const status = requireEnum(payload.status, new Set(['SUPPORTED', 'REFUTED', 'MIXED', 'UNRESOLVED']), 'status');
  const confidence = requireEnum(payload.confidence, CONFIDENCES, 'confidence');
  const volatility = requireEnum(payload.volatility, VOLATILITIES, 'volatility');
  const intervalDays = Number(payload.recheckIntervalDays);
  const hypotheses = requireHypotheses(payload.hypotheses);
  const supportedHypotheses = requireStringArray(payload.supportedHypotheses || [], 'supportedHypotheses');
  for (const key of supportedHypotheses) {
    if (!(key in hypotheses)) throw new Error(`supported hypothesis does not exist: ${key}`);
  }
  if (!payload.decisiveTest || typeof payload.decisiveTest !== 'object') {
    throw new Error('decisiveTest must be an object');
  }

  const id = allocateId(ledger);
  const record = {
    id,
    question: requireText(payload.question, 'question'),
    hypotheses,
    status,
    supportedHypotheses,
    confidence,
    evidence: normalizeEvidence(payload.evidence || [], now),
    decisiveTest: {
      ...payload.decisiveTest,
      name: requireText(payload.decisiveTest.name, 'decisiveTest.name'),
      executed: payload.decisiveTest.executed === true,
    },
    observation: requireText(payload.observation, 'observation'),
    volatility,
    recheckIntervalDays: intervalDays,
    createdAt: now,
    lastCheckedAt: now,
    nextCheckAt: payload.nextCheckAt
      ? isoOrNull(payload.nextCheckAt, 'nextCheckAt')
      : nextCheckFrom(now, intervalDays),
    limitations: requireStringArray(payload.limitations || [], 'limitations'),
    history: [
      {
        at: now,
        event: 'CREATED',
        status,
        supportedHypotheses,
        observation: requireText(payload.observation, 'observation'),
      },
    ],
    receipts: [],
  };
  const receipt = writeReceipt(dataDir, record, 'CREATED');
  ledger.records.push(record);
  writeLedger(dataDir, ledger);
  return { id, status, receipt: path.join(dataDir, receipt), nextCheckAt: record.nextCheckAt };
}

function recheckVerdict(dataDir, ledger, id, payload) {
  const record = ledger.records.find((item) => item.id === id);
  if (!record) throw new Error(`verdict not found: ${id}`);
  const now = new Date().toISOString();
  const outcome = requireEnum(payload.outcome, RECHECK_OUTCOMES, 'outcome');
  const previousStatus = record.status;
  const previousConfidence = record.confidence;
  const previousSupportedHypotheses = [...record.supportedHypotheses];
  const previousLastCheckedAt = record.lastCheckedAt;
  const newEvidence = normalizeEvidence(payload.evidence || [], now, { recheckOutcome: outcome });

  record.evidence.push(...newEvidence);
  record.observation = requireText(payload.observation, 'observation');
  record.lastCheckedAt = now;
  if (payload.confidence !== undefined) {
    record.confidence = requireEnum(payload.confidence, CONFIDENCES, 'confidence');
  }
  if (payload.limitations !== undefined) {
    record.limitations = requireStringArray(payload.limitations, 'limitations');
  }

  if (outcome === 'INVALIDATED') {
    record.status = 'INVALIDATED';
    record.reopenedAt = now;
    record.nextCheckAt = null;
  } else if (outcome === 'UNRESOLVED') {
    record.status = 'UNRESOLVED';
    record.nextCheckAt = payload.nextCheckAt
      ? isoOrNull(payload.nextCheckAt, 'nextCheckAt')
      : nextCheckFrom(now, record.recheckIntervalDays);
  } else {
    record.nextCheckAt = payload.nextCheckAt
      ? isoOrNull(payload.nextCheckAt, 'nextCheckAt')
      : nextCheckFrom(now, record.recheckIntervalDays);
  }

  record.history.push({
    at: now,
    event: outcome === 'UNCHANGED' ? 'VERIFIED_AGAIN' : outcome,
    previousStatus,
    status: record.status,
    previousConfidence,
    confidence: record.confidence,
    previousSupportedHypotheses,
    supportedHypotheses: [...record.supportedHypotheses],
    previousLastCheckedAt,
    observation: record.observation,
    evidenceAdded: newEvidence.length,
  });
  const receipt = writeReceipt(dataDir, record, outcome);
  writeLedger(dataDir, ledger);
  return {
    id,
    outcome,
    status: record.status,
    receipt: path.join(dataDir, receipt),
    previousStatus,
    nextCheckAt: record.nextCheckAt,
  };
}

function listDue(ledger, at) {
  const cutoff = new Date(at || Date.now());
  if (Number.isNaN(cutoff.valueOf())) throw new Error('--at must be an ISO-8601 date');
  return ledger.records
    .filter((record) => record.status !== 'INVALIDATED' && record.nextCheckAt)
    .filter((record) => new Date(record.nextCheckAt) <= cutoff)
    .map((record) => ({
      id: record.id,
      question: record.question,
      status: record.status,
      volatility: record.volatility,
      nextCheckAt: record.nextCheckAt,
    }));
}

function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  const dataDir = resolveDataDir(options);
  ensureDataDir(dataDir);
  const ledger = readLedger(dataDir);

  switch (command) {
    case 'init':
      if (!fs.existsSync(ledgerPath(dataDir))) writeLedger(dataDir, ledger);
      return { initialized: true, dataDir, ledger: ledgerPath(dataDir) };
    case 'record':
      return recordVerdict(dataDir, ledger, readPayload(options.input));
    case 'show': {
      const record = ledger.records.find((item) => item.id === options.id);
      if (!record) throw new Error(`verdict not found: ${options.id || '(missing --id)'}`);
      return record;
    }
    case 'list':
      return ledger.records.map(({ id, question, status, confidence, volatility, nextCheckAt }) => ({
        id,
        question,
        status,
        confidence,
        volatility,
        nextCheckAt,
      }));
    case 'list-due':
      return listDue(ledger, options.at);
    case 'recheck':
      if (!options.id) throw new Error('--id is required');
      return recheckVerdict(dataDir, ledger, options.id, readPayload(options.input));
    case 'validate':
      return validateLedger(ledger);
    default:
      throw new Error('command must be one of: init, record, show, list, list-due, recheck, validate');
  }
}

try {
  const result = main();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

