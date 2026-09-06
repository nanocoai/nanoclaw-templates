#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { open, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FACT_STATES = new Set(['SUPPORTED', 'CONFLICTED', 'USER_STATED', 'MISSING', 'UNREADABLE']);
const CASE_STATES = new Set(['NEW', 'OPEN', 'INGESTED', 'REVIEW_NEEDED', 'PACK_READY', 'DRAFT_READY', 'CLOSED']);
const PRIORITIES = new Set(['BLOCKING', 'HIGH', 'MEDIUM', 'LOW']);
const EXTRACTION_STATUSES = new Set(['pending', 'complete', 'partial', 'unreadable', 'failed']);

async function readJson(file, errors, label, required = true) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (!required && error.code === 'ENOENT') return undefined;
    errors.push(`${label}: ${error.message}`);
    return undefined;
  }
}

async function readJsonLines(file, errors, label, required = true) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if (!required && error.code === 'ENOENT') return undefined;
    errors.push(`${label}: ${error.message}`);
    return undefined;
  }
  const records = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line));
    } catch (error) {
      errors.push(`${label} line ${index + 1}: ${error.message}`);
    }
  }
  return records;
}

async function sha256(file) {
  const handle = await open(file, 'r');
  const hash = createHash('sha256');
  try {
    for await (const chunk of handle.createReadStream()) hash.update(chunk);
  } finally {
    await handle.close().catch(() => {});
  }
  return hash.digest('hex');
}

function requireString(value, label, errors, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && value.trim() === '')) {
    errors.push(`${label} must be ${allowEmpty ? 'a string' : 'a non-empty string'}`);
    return false;
  }
  return true;
}

function checkUnique(records, key, label, errors) {
  const seen = new Set();
  for (const [index, record] of records.entries()) {
    const value = record?.[key];
    if (!requireString(value, `${label}[${index}].${key}`, errors)) continue;
    if (seen.has(value)) errors.push(`${label}: duplicate ${key} ${value}`);
    seen.add(value);
  }
  return seen;
}

function checkCitations(citations, label, exhibitIds, errors, required = true) {
  if (!Array.isArray(citations)) {
    errors.push(`${label} must be an array`);
    return;
  }
  if (required && citations.length === 0) errors.push(`${label} must contain at least one citation`);
  for (const [index, citation] of citations.entries()) {
    if (!requireString(citation?.exhibitId, `${label}[${index}].exhibitId`, errors)) continue;
    if (!exhibitIds.has(citation.exhibitId)) {
      errors.push(`${label}[${index}] references unknown exhibit ${citation.exhibitId}`);
    }
    requireString(citation?.pinpoint, `${label}[${index}].pinpoint`, errors);
    if (citation?.quote !== undefined && typeof citation.quote !== 'string') {
      errors.push(`${label}[${index}].quote must be a string when present`);
    }
  }
}

function requireArray(value, label, errors, fallback = []) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return fallback;
  }
  return value;
}

export async function validateCase(caseDirectory) {
  const caseDir = path.resolve(caseDirectory);
  const errors = [];
  const warnings = [];
  const caseRecord = await readJson(path.join(caseDir, 'case.json'), errors, 'case.json');
  const manifest = await readJson(path.join(caseDir, 'manifest.json'), errors, 'manifest.json');
  if (!caseRecord || !manifest) return { ok: false, caseDir, errors, warnings, counts: {} };

  requireString(caseRecord.caseId, 'case.json.caseId', errors);
  requireString(caseRecord.title, 'case.json.title', errors);
  requireString(caseRecord.requestedOutcome, 'case.json.requestedOutcome', errors);
  if (!CASE_STATES.has(caseRecord.state)) errors.push(`case.json.state is invalid: ${caseRecord.state}`);
  if (caseRecord.caseId !== path.basename(caseDir)) errors.push('case.json.caseId must match the case directory name');
  if (manifest.caseId !== caseRecord.caseId) errors.push('manifest.json.caseId must match case.json.caseId');

  const exhibits = requireArray(manifest.exhibits, 'manifest.json.exhibits', errors);
  const exhibitIds = checkUnique(exhibits, 'exhibitId', 'exhibits', errors);
  const hashes = new Set();
  const sourceRoot = path.resolve(caseDir, 'source');
  const sourcePrefix = `${sourceRoot}${path.sep}`;
  const packetRequired = ['PACK_READY', 'DRAFT_READY', 'CLOSED'].includes(caseRecord.state);
  let pendingExtractions = 0;
  let unreadableExtractions = 0;
  for (const [index, exhibit] of exhibits.entries()) {
    const label = `exhibits[${index}]`;
    requireString(exhibit?.originalName, `${label}.originalName`, errors);
    requireString(exhibit?.storedName, `${label}.storedName`, errors);
    requireString(exhibit?.sha256, `${label}.sha256`, errors);
    requireString(exhibit?.mediaType, `${label}.mediaType`, errors);
    if (!EXTRACTION_STATUSES.has(exhibit?.extractionStatus)) {
      errors.push(`${label}.extractionStatus is invalid: ${exhibit?.extractionStatus}`);
    }
    if (exhibit?.extractionStatus === 'pending') pendingExtractions += 1;
    if (['unreadable', 'failed'].includes(exhibit?.extractionStatus)) unreadableExtractions += 1;
    if (!/^[a-f0-9]{64}$/.test(exhibit?.sha256 ?? '')) errors.push(`${label}.sha256 must be lowercase SHA-256 hex`);
    if (hashes.has(exhibit?.sha256)) errors.push(`${label}.sha256 duplicates another unique exhibit`);
    hashes.add(exhibit?.sha256);
    if (!Number.isSafeInteger(exhibit?.byteLength) || exhibit.byteLength < 0) {
      errors.push(`${label}.byteLength must be a non-negative safe integer`);
    }
    if (typeof exhibit?.storedName !== 'string') continue;
    const source = path.resolve(sourceRoot, exhibit.storedName);
    if (!source.startsWith(sourcePrefix)) {
      errors.push(`${label}.storedName escapes the source directory`);
      continue;
    }
    try {
      const details = await stat(source);
      if (!details.isFile()) errors.push(`${label} source is not a regular file`);
      if (details.size !== exhibit.byteLength) errors.push(`${label} source byte length changed`);
      if ((await sha256(source)) !== exhibit.sha256) errors.push(`${label} source checksum changed`);
    } catch (error) {
      errors.push(`${label} source cannot be verified: ${error.message}`);
    }
  }

  if (packetRequired && pendingExtractions > 0) {
    errors.push('PACK_READY/DRAFT_READY/CLOSED case cannot contain pending exhibit extraction');
  }
  if (unreadableExtractions > 0) {
    warnings.push(`${unreadableExtractions} exhibit(s) are unreadable or failed extraction`);
  }

  const facts = (await readJsonLines(path.join(caseDir, 'facts.jsonl'), errors, 'facts.jsonl', packetRequired)) ?? [];
  const factIds = checkUnique(facts, 'factId', 'facts', errors);
  const supportedFactIds = new Set();
  for (const [index, fact] of facts.entries()) {
    const label = `facts[${index}]`;
    requireString(fact?.field, `${label}.field`, errors);
    if (!FACT_STATES.has(fact?.state)) errors.push(`${label}.state is invalid: ${fact?.state}`);
    if (fact?.state === 'SUPPORTED') supportedFactIds.add(fact.factId);
    const citationsRequired = ['SUPPORTED', 'CONFLICTED', 'UNREADABLE'].includes(fact?.state);
    checkCitations(fact?.citations, `${label}.citations`, exhibitIds, errors, citationsRequired);
  }

  const timeline = (await readJson(path.join(caseDir, 'timeline.json'), errors, 'timeline.json', packetRequired)) ?? [];
  requireArray(timeline, 'timeline.json', errors);
  checkUnique(Array.isArray(timeline) ? timeline : [], 'eventId', 'timeline', errors);
  for (const [index, event] of (Array.isArray(timeline) ? timeline : []).entries()) {
    const label = `timeline[${index}]`;
    requireString(event?.date, `${label}.date`, errors, true);
    requireString(event?.description, `${label}.description`, errors);
    requireString(event?.actor, `${label}.actor`, errors);
    if (!FACT_STATES.has(event?.state)) errors.push(`${label}.state is invalid: ${event?.state}`);
    checkCitations(event?.citations, `${label}.citations`, exhibitIds, errors, event?.state === 'SUPPORTED');
  }

  const conflicts = (await readJson(path.join(caseDir, 'conflicts.json'), errors, 'conflicts.json', packetRequired)) ?? [];
  requireArray(conflicts, 'conflicts.json', errors);
  checkUnique(Array.isArray(conflicts) ? conflicts : [], 'conflictId', 'conflicts', errors);
  for (const [index, conflict] of (Array.isArray(conflicts) ? conflicts : []).entries()) {
    const label = `conflicts[${index}]`;
    requireString(conflict?.field, `${label}.field`, errors);
    requireString(conflict?.whyItMatters, `${label}.whyItMatters`, errors);
    requireString(conflict?.resolutionNeeded, `${label}.resolutionNeeded`, errors);
    const alternatives = requireArray(conflict?.alternatives, `${label}.alternatives`, errors);
    if (alternatives.length < 2) errors.push(`${label}.alternatives must contain at least two values`);
    for (const [alternativeIndex, alternative] of alternatives.entries()) {
      requireString(String(alternative?.value ?? ''), `${label}.alternatives[${alternativeIndex}].value`, errors);
      checkCitations(
        alternative?.citations,
        `${label}.alternatives[${alternativeIndex}].citations`,
        exhibitIds,
        errors,
        true,
      );
    }
  }

  const missing = (await readJson(path.join(caseDir, 'missing.json'), errors, 'missing.json', packetRequired)) ?? [];
  requireArray(missing, 'missing.json', errors);
  checkUnique(Array.isArray(missing) ? missing : [], 'missingId', 'missing', errors);
  for (const [index, item] of (Array.isArray(missing) ? missing : []).entries()) {
    const label = `missing[${index}]`;
    if (!PRIORITIES.has(item?.priority)) errors.push(`${label}.priority is invalid: ${item?.priority}`);
    requireString(item?.item, `${label}.item`, errors);
    requireString(item?.whyItMatters, `${label}.whyItMatters`, errors);
    requireString(item?.whereToFind, `${label}.whereToFind`, errors);
    if (typeof item?.canProceed !== 'boolean') errors.push(`${label}.canProceed must be boolean`);
  }

  const draft = await readJson(path.join(caseDir, 'draft.json'), errors, 'draft.json', false);
  if (caseRecord.state === 'DRAFT_READY' && !draft) errors.push('draft.json is required for DRAFT_READY');
  if (draft) {
    requireString(draft.subject, 'draft.json.subject', errors);
    requireString(draft.body, 'draft.json.body', errors);
    const draftFactIds = requireArray(draft.factIds, 'draft.json.factIds', errors);
    for (const factId of draftFactIds) {
      if (!factIds.has(factId)) errors.push(`draft.json.factIds references unknown fact ${factId}`);
      else if (!supportedFactIds.has(factId)) {
        errors.push(`draft.json.factIds references non-SUPPORTED fact ${factId}`);
      }
    }
  }

  if (exhibits.length === 0) warnings.push('case contains no exhibits');
  if (facts.length === 0) warnings.push('case contains no extracted facts');
  const blocking = Array.isArray(missing) ? missing.filter((item) => item?.priority === 'BLOCKING').length : 0;
  if (packetRequired && blocking > 0) errors.push('PACK_READY/DRAFT_READY/CLOSED case cannot contain BLOCKING missing items');

  return {
    ok: errors.length === 0,
    caseDir,
    state: caseRecord.state,
    errors,
    warnings,
    counts: {
      exhibits: exhibits.length,
      duplicates: Array.isArray(manifest.duplicates) ? manifest.duplicates.length : 0,
      facts: facts.length,
      timelineEvents: Array.isArray(timeline) ? timeline.length : 0,
      conflicts: Array.isArray(conflicts) ? conflicts.length : 0,
      missing: Array.isArray(missing) ? missing.length : 0,
      blocking,
    },
  };
}

async function main() {
  if (process.argv.length !== 3) throw new Error('Usage: node validate-case.mjs <case-dir>');
  const result = await validateCase(process.argv[2]);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  main().catch((error) => {
    process.stderr.write(`${JSON.stringify({ ok: false, error: error.message }, null, 2)}\n`);
    process.exitCode = 1;
  });
}
