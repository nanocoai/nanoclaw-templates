import * as fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export const DEFAULT_DATA_DIR = '/workspace/agent/plugin-data/remote-hands-reviewer';
const MAX_IMAGE = 5 * 1024 * 1024;
// JSON escaping can expand each permitted input byte to six bytes. Keep write
// bounds identical to read bounds, including when long-lived history grows.
const MAX_INTAKE = 512 * 1024;
const MAX_REVIEW = 1024 * 1024;
const MAX_STATE = 8 * 1024 * 1024;
const RECORD_LIMITS = { 'intake.json': MAX_INTAKE, 'original.md': 20 * 1024, 'review.json': MAX_REVIEW, 'report.html': 100 * 1024 * 1024, 'recorded.json': 16 * 1024 };
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const VERSION_ID = /^v\d{6,12}-[a-f0-9-]{36}$/;
const HASH = /^[a-f0-9]{64}$/;
const IMAGE_PATH = /^evidence\/evidence-[a-f0-9-]{36}\.(png|jpg)$/;
const REVIEW_PATH = /^versions\/v\d{6,12}-[a-f0-9-]{36}\/(review\.json|report\.html)$/;

export class DomainError extends Error {
  constructor(code, message, details) { super(message); this.name = 'DomainError'; this.code = code; this.details = details; }
}
function fail(code, message, details) { throw new DomainError(code, message, details); }
function check(value, code, message, details) { if (!value) fail(code, message, details); }
function object(value, label) { check(value !== null && typeof value === 'object' && !Array.isArray(value), 'invalid_input', `${label} must be an object.`); }
function fields(value, allowed, label) {
  object(value, label);
  for (const key of Object.keys(value)) check(allowed.includes(key), 'invalid_input', `Unexpected ${label} field: ${key}`);
}
function string(value, label, max = 2048, empty = false) {
  check(typeof value === 'string' && value.isWellFormed() && !value.includes('\0') && Buffer.byteLength(value) <= max && (empty || value.trim().length > 0), 'invalid_input', `${label} must be ${empty ? 'a' : 'a nonempty'} UTF-8 string of at most ${max} bytes.`);
  return value;
}
function identifier(value, label) { check(typeof value === 'string' && ID.test(value), 'invalid_input', `${label} must be 1–64 letters, digits, underscores or hyphens, beginning with a letter or digit.`); return value; }
function version(value) { check(Number.isSafeInteger(value) && value >= 1, 'invalid_input', 'expectedVersion must be a positive safe integer.'); }
function sha(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function jsonBytes(value) { return Buffer.from(`${JSON.stringify(value, null, 2)}\n`); }
function parse(bytes, label) { try { return JSON.parse(bytes.toString('utf8')); } catch { fail('integrity_error', `${label} is not valid JSON.`); } }
function safeHash(value) { check(typeof value === 'string' && HASH.test(value), 'integrity_error', 'Invalid stored content hash.'); return value; }
function stale(state, expected) { check(state.version === expected, 'stale_version', 'This job changed. Request status and review its current version.', { expectedVersion: expected, currentVersion: state.version }); }

async function readRegular(file, max = MAX_STATE) {
  const resolved = path.resolve(file);
  let stat;
  try { stat = await fs.lstat(resolved); } catch (error) { if (error.code === 'ENOENT') fail('missing_file', 'A required file is missing.', { path: resolved }); throw error; }
  check(stat.isFile() && !stat.isSymbolicLink(), 'invalid_file', 'Only regular files are accepted; symlinks are not allowed.', { path: resolved });
  check(await fs.realpath(resolved) === resolved, 'invalid_file', 'A file path must not pass through a symlink.', { path: resolved });
  check(stat.size <= max, 'file_too_large', 'A file exceeds its size limit.', { maxBytes: max });
  const handle = await fs.open(resolved, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = await handle.stat();
    check(opened.isFile() && opened.size <= max, 'invalid_file', 'File changed while opening.');
    const bytes = await handle.readFile();
    check(bytes.length <= max, 'file_too_large', 'A file exceeds its size limit.', { maxBytes: max });
    return bytes;
  } finally { await handle.close(); }
}
async function writeNew(file, bytes) {
  const handle = await fs.open(file, 'wx', 0o600);
  try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
}
async function syncDirectory(dir) {
  const handle = await fs.open(dir, constants.O_RDONLY);
  try { await handle.sync(); } finally { await handle.close(); }
}
async function directory(dir) {
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const stat = await fs.lstat(dir);
  check(stat.isDirectory() && !stat.isSymbolicLink() && await fs.realpath(dir) === path.resolve(dir), 'invalid_file', 'State directories must not be symlinks.');
}
function imageType(bytes) {
  const dimensions = (width, height, type) => {
    check(width > 0 && height > 0 && width <= 12000 && height <= 12000 && width * height <= 40_000_000, 'image_dimensions', 'Images must be at most 12,000 pixels per side and 40 megapixels.');
    return { ...type, width, height };
  };
  if (bytes.length >= 33 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && bytes.readUInt32BE(8) === 13 && bytes.toString('ascii', 12, 16) === 'IHDR') return dimensions(bytes.readUInt32BE(16), bytes.readUInt32BE(20), { mimeType: 'image/png', extension: 'png' });
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9) {
    let offset = 2;
    while (offset < bytes.length - 2) {
      check(bytes[offset++] === 0xff, 'unsupported_image', 'Malformed JPEG marker.');
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      check(offset + 2 <= bytes.length, 'unsupported_image', 'Truncated JPEG marker.');
      const length = bytes.readUInt16BE(offset);
      check(length >= 2 && offset + length <= bytes.length, 'unsupported_image', 'Invalid JPEG segment length.');
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        check(length >= 8, 'unsupported_image', 'Truncated JPEG dimensions.');
        return dimensions(bytes.readUInt16BE(offset + 5), bytes.readUInt16BE(offset + 3), { mimeType: 'image/jpeg', extension: 'jpg' });
      }
      offset += length;
    }
  }
  fail('unsupported_image', 'Only JPEG or PNG bytes with the expected image signature are accepted. A file extension alone is not sufficient.');
}

export function createEngine(options = {}) {
  let canonicalRoot;
  const clock = options.now ?? (() => new Date().toISOString());
  async function root() {
    if (!canonicalRoot) {
      const requested = path.resolve(options.dataDir ?? DEFAULT_DATA_DIR);
      await fs.mkdir(requested, { recursive: true, mode: 0o700 });
      canonicalRoot = await fs.realpath(requested);
      await directory(path.join(canonicalRoot, 'jobs'));
    }
    return canonicalRoot;
  }
  async function jobDir(jobId, create = false) {
    identifier(jobId, 'jobId');
    const dir = path.join(await root(), 'jobs', jobId);
    if (create) await directory(dir);
    else {
      let stat;
      try { stat = await fs.lstat(dir); } catch (error) { if (error.code === 'ENOENT') fail('job_not_found', 'No job exists with this ID.'); throw error; }
      check(stat.isDirectory() && !stat.isSymbolicLink() && await fs.realpath(dir) === dir, 'invalid_file', 'Job directory is not a regular directory.');
    }
    return dir;
  }
  async function lock(dir, fn) {
    const lockDir = path.join(dir, 'lock');
    const token = randomUUID();
    try { await fs.mkdir(lockDir, { mode: 0o700 }); } catch (error) { if (error.code === 'EEXIST') fail('job_locked', 'Another operation owns this job lock. Do not delete a stale-looking lock automatically.'); throw error; }
    let ownerWritten = false;
    try {
      await writeNew(path.join(lockDir, 'owner.json'), jsonBytes({ token, pid: process.pid, createdAt: clock() }));
      ownerWritten = true;
      return await fn();
    } finally {
      // Release only a lock whose ownership token still belongs to this operation.
      if (ownerWritten) {
        try {
          const owner = parse(await readRegular(path.join(lockDir, 'owner.json'), 4096), 'Lock owner');
          if (owner.token === token) { await fs.unlink(path.join(lockDir, 'owner.json')); await fs.rmdir(lockDir); }
        } catch { /* An altered/incomplete lock needs explicit operator recovery. */ }
      }
    }
  }
  async function checkedFile(dir, relativePath, hash, pattern, max) {
    check(typeof relativePath === 'string' && pattern.test(relativePath), 'integrity_error', 'Stored path is outside the permitted record layout.');
    const bytes = await readRegular(path.join(dir, relativePath), max);
    check(sha(bytes) === safeHash(hash), 'integrity_error', 'Stored content changed; no state was adopted.', { relativePath });
    return bytes;
  }
  async function readReview(dir, ref) {
    check(ref && typeof ref === 'object', 'integrity_error', 'Missing review reference.');
    const bytes = await checkedFile(dir, ref.jsonPath, ref.hash, REVIEW_PATH, MAX_REVIEW);
    await checkedFile(dir, ref.reportPath, ref.reportHash, REVIEW_PATH, 100 * 1024 * 1024);
    const record = parse(bytes, 'Review');
    check(record.reviewId === ref.reviewId && record.version === ref.version, 'integrity_error', 'Review identity changed.');
    return record;
  }
  async function load(dir) {
    const pointer = parse(await readRegular(path.join(dir, 'active.json'), 4096), 'Active pointer');
    check(VERSION_ID.test(pointer.transactionId ?? '') && Number.isSafeInteger(pointer.version), 'integrity_error', 'Invalid active pointer.');
    const stateBytes = await readRegular(path.join(dir, 'versions', pointer.transactionId, 'state.json'));
    check(sha(stateBytes) === safeHash(pointer.stateHash), 'integrity_error', 'Active state content changed.');
    const state = parse(stateBytes, 'State');
    check(state.version === pointer.version && state.schemaVersion === 1 && Array.isArray(state.evidence) && Array.isArray(state.history), 'integrity_error', 'Invalid active state.');
    const intakeBytes = await checkedFile(dir, state.intake.path, state.intake.hash, /^versions\/v\d{6,12}-[a-f0-9-]{36}\/intake\.json$/, MAX_INTAKE);
    const job = parse(intakeBytes, 'Intake');
    check(job.jobId === path.basename(dir), 'integrity_error', 'Intake job identity changed.');
    const original = await checkedFile(dir, state.intake.originalPath, state.intake.originalHash, /^versions\/v\d{6,12}-[a-f0-9-]{36}\/original\.md$/, 20 * 1024);
    check(original.toString('utf8') === job.workOrder, 'integrity_error', 'Original work order differs from intake.');
    for (const evidence of state.evidence) await checkedFile(dir, evidence.relativePath, evidence.sha256, IMAGE_PATH, MAX_IMAGE);
    // Historical records are small; checking every review also preserves prior discrepancies.
    for (const ref of state.history) await readReview(dir, ref);
    if (state.recorded) {
      const bytes = await checkedFile(dir, state.recorded.path, state.recorded.hash, /^versions\/v\d{6,12}-[a-f0-9-]{36}\/recorded\.json$/, 16 * 1024);
      const recorded = parse(bytes, 'Recorded review');
      check(recorded.reviewId === state.recorded.reviewId, 'integrity_error', 'Recorded review identity changed.');
    }
    return { state, job };
  }
  async function publish(dir, state, files = {}, id) {
    const stateBytes = jsonBytes(state);
    check(stateBytes.length <= MAX_STATE, 'record_limit', 'This job has reached its retained history limit. Its previous state remains readable; start a new job for further work.');
    for (const [name, bytes] of Object.entries(files)) {
      check(Object.hasOwn(RECORD_LIMITS, name), 'internal_error', 'Unexpected transaction file.');
      check(Buffer.byteLength(bytes) <= RECORD_LIMITS[name], 'record_limit', 'The proposed record exceeds its readable size limit. No new state was adopted.', { record: name, maxBytes: RECORD_LIMITS[name] });
    }
    const transactionId = id ?? `v${String(state.version).padStart(6, '0')}-${randomUUID()}`;
    const versionsDir = path.join(dir, 'versions');
    await directory(versionsDir);
    const stage = path.join(dir, `.staging-${randomUUID()}`);
    await fs.mkdir(stage, { mode: 0o700 });
    for (const [name, bytes] of Object.entries(files)) { check(/^(intake\.json|original\.md|review\.json|report\.html|recorded\.json)$/.test(name), 'internal_error', 'Unexpected transaction file.'); await writeNew(path.join(stage, name), bytes); }
    await writeNew(path.join(stage, 'state.json'), stateBytes);
    await syncDirectory(stage);
    await fs.rename(stage, path.join(versionsDir, transactionId));
    await syncDirectory(versionsDir);
    // Optional fault-injection seam for deterministic recovery tests; never exposed by CLI.
    if (options.beforeActivate) await options.beforeActivate({ dir, version: state.version });
    const pointerTemp = path.join(dir, `.active-${randomUUID()}.tmp`);
    await writeNew(pointerTemp, jsonBytes({ schemaVersion: 1, version: state.version, transactionId, stateHash: sha(stateBytes) }));
    await fs.rename(pointerTemp, path.join(dir, 'active.json'));
    await syncDirectory(dir);
    return transactionId;
  }
  async function init(input) {
    fields(input, ['jobId', 'title', 'workOrder', 'requirements', 'confirmation'], 'init');
    identifier(input.jobId, 'jobId'); string(input.title, 'title', 240); string(input.workOrder, 'workOrder', 20 * 1024);
    check(input.confirmation === `Start job ${input.jobId}`, 'confirmation_required', `Confirm the mappings with: Start job ${input.jobId}`);
    check(Array.isArray(input.requirements) && input.requirements.length >= 1 && input.requirements.length <= 12, 'invalid_input', 'Provide 1–12 requirements.');
    const seen = new Set();
    const requirements = input.requirements.map(req => {
      fields(req, ['id', 'label', 'role', 'expectedValue', 'sourceQuote'], 'requirement');
      identifier(req.id, 'requirement id'); check(!seen.has(req.id), 'duplicate_requirement', 'Requirement IDs must be unique.'); seen.add(req.id);
      string(req.label, 'requirement label', 240); string(req.expectedValue, 'expectedValue', 256); string(req.sourceQuote, 'sourceQuote', 4096);
      check(['existing', 'replacement', 'asset'].includes(req.role), 'invalid_input', 'Requirement role must be existing, replacement or asset.');
      check(input.workOrder.includes(req.sourceQuote) && req.sourceQuote.includes(req.expectedValue), 'source_absent', 'Each sourceQuote must appear exactly in the work order and contain the exact expectedValue.', { requirementId: req.id });
      return { ...req };
    });
    const dir = await jobDir(input.jobId, true);
    return lock(dir, async () => {
      try { await fs.lstat(path.join(dir, 'active.json')); fail('job_exists', 'This job already exists. Its original request cannot be replaced.'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      const createdAt = clock();
      const job = { jobId: input.jobId, title: input.title, workOrder: input.workOrder, requirements, createdAt, confirmation: input.confirmation };
      const intakeBytes = jsonBytes(job); const originalBytes = Buffer.from(input.workOrder);
      const id = `v000001-${randomUUID()}`;
      const state = { schemaVersion: 1, version: 1, updatedAt: createdAt, intake: { path: `versions/${id}/intake.json`, hash: sha(intakeBytes), originalPath: `versions/${id}/original.md`, originalHash: sha(originalBytes) }, evidence: [], history: [], latestReview: null, recorded: null };
      await publish(dir, state, { 'intake.json': intakeBytes, 'original.md': originalBytes }, id);
      return { ok: true, jobId: job.jobId, version: 1, requirements: job.requirements, next: 'ingest' };
    });
  }
  async function ingest(input) {
    fields(input, ['jobId', 'expectedVersion', 'files'], 'ingest'); version(input.expectedVersion);
    const dir = await jobDir(input.jobId);
    check(Array.isArray(input.files) && input.files.length >= 1 && input.files.length <= 12, 'invalid_input', 'Provide 1–12 image files.');
    const candidates = [];
    for (const file of input.files) {
      fields(file, ['path', 'label'], 'file'); string(file.path, 'file path', 4096); string(file.label, 'file label', 240);
      const bytes = await readRegular(file.path, MAX_IMAGE); const type = imageType(bytes);
      const evidenceId = `evidence-${randomUUID()}`;
      candidates.push({ bytes, record: { evidenceId, label: file.label, originalName: path.basename(file.path), mimeType: type.mimeType, width: type.width, height: type.height, sha256: sha(bytes), byteLength: bytes.length, relativePath: `evidence/${evidenceId}.${type.extension}`, ingestedAt: clock() } });
    }
    return lock(dir, async () => {
      const { state } = await load(dir); stale(state, input.expectedVersion);
      check(state.evidence.length + candidates.length <= 12, 'evidence_limit', 'A job can retain at most 12 images, including earlier rounds.');
      const hashes = new Set(state.evidence.map(e => e.sha256));
      for (const c of candidates) { check(!hashes.has(c.record.sha256), 'duplicate_evidence', 'These image bytes are already present in this job or input batch. Reuse the existing evidence ID.'); hashes.add(c.record.sha256); }
      await directory(path.join(dir, 'evidence'));
      for (const c of candidates) await writeNew(path.join(dir, c.record.relativePath), c.bytes);
      await syncDirectory(path.join(dir, 'evidence'));
      const next = { ...state, version: state.version + 1, updatedAt: clock(), evidence: [...state.evidence, ...candidates.map(c => c.record)], recorded: null };
      await publish(dir, next);
      return { ok: true, jobId: input.jobId, version: next.version, evidence: next.evidence.map(e => ({ ...e, path: path.join(dir, e.relativePath) })), latestReviewApplicable: false, next: 'review' };
    });
  }
  async function review(input) {
    fields(input, ['jobId', 'expectedVersion', 'observations'], 'review'); version(input.expectedVersion);
    const dir = await jobDir(input.jobId);
    // Interpretations and rendering run outside the short publication lock.
    const { state, job } = await load(dir); stale(state, input.expectedVersion);
    check(Array.isArray(input.observations) && input.observations.length <= job.requirements.length, 'invalid_input', 'observations must be an array with at most one entry per requirement.');
    const mapped = new Map();
    for (const obs of input.observations) {
      fields(obs, ['requirementId', 'evidenceId', 'observedValue', 'readability', 'region', 'note'], 'observation');
      check(job.requirements.some(r => r.id === obs.requirementId), 'unknown_requirement', 'Observation refers to an unknown requirement.');
      check(!mapped.has(obs.requirementId), 'duplicate_observation', 'Provide at most one observation for each requirement.');
      check(state.evidence.some(e => e.evidenceId === obs.evidenceId), 'unknown_evidence', 'Observation refers to evidence outside this job.');
      check(['clear', 'unreadable', 'uncertain'].includes(obs.readability), 'invalid_input', 'Invalid readability.');
      if (obs.observedValue !== null) string(obs.observedValue, 'observedValue', 256);
      check(obs.readability !== 'clear' || typeof obs.observedValue === 'string', 'invalid_input', 'A clear observation needs an observedValue.');
      string(obs.note, 'observation note', 2048, true);
      check(Array.isArray(obs.region) && obs.region.length === 4 && obs.region.every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1) && obs.region[2] > 0 && obs.region[3] > 0 && obs.region[0] + obs.region[2] <= 1 + Number.EPSILON && obs.region[1] + obs.region[3] <= 1 + Number.EPSILON, 'invalid_region', 'region must be a positive normalized rectangle within the image.');
      mapped.set(obs.requirementId, structuredClone(obs));
    }
    const previous = state.latestReview ? await readReview(dir, state.latestReview) : null;
    const requirements = job.requirements.map(req => {
      const observation = mapped.get(req.id) ?? null;
      const status = !observation ? 'missing' : observation.readability !== 'clear' ? observation.readability : observation.observedValue.trim() === req.expectedValue.trim() ? 'supported' : 'mismatch';
      const prior = previous?.requirements.find(r => r.id === req.id);
      if (prior && ['mismatch', 'uncertain', 'unreadable'].includes(prior.status) && status === 'supported' && prior.observation?.evidenceId !== observation.evidenceId) check(observation.note.trim().length > 0, 'resolution_reason_required', 'Explain why newly selected evidence resolves the earlier discrepancy.', { requirementId: req.id });
      return { ...req, status, observation, previousStatus: prior?.status ?? null, changed: prior ? prior.status !== status || JSON.stringify(prior.observation) !== JSON.stringify(observation) : false };
    });
    const unresolved = requirements.filter(r => r.status !== 'supported');
    const reviewId = `review-${randomUUID()}`; const nextVersion = state.version + 1; const generatedAt = clock();
    const followUpDraft = unresolved.length ? `For ${job.title}:\n${unresolved.map(r => `- ${r.label}: ${r.status === 'mismatch' ? `image shows ${r.observation.observedValue}; send a clear label and context view for requested ${r.expectedValue}.` : r.status === 'missing' ? `send an identifying view for ${r.expectedValue}.` : `label is ${r.status}; send a close-up and context view for ${r.expectedValue}.`}`).join('\n')}` : 'The supplied observations support each requested identifier. Review the images before recording this check.';
    const record = { schemaVersion: 1, job: { jobId: job.jobId, title: job.title, workOrder: job.workOrder, requirements: job.requirements }, reviewId, generatedAt, version: nextVersion, status: unresolved.length ? 'needs_review' : 'ready_to_record', requirements, evidence: state.evidence, unresolvedCount: unresolved.length, followUpDraft, previousReviewId: previous?.reviewId ?? null, history: state.history.map(h => ({ reviewId: h.reviewId, generatedAt: h.generatedAt, unresolvedCount: h.unresolvedCount, recorded: h.recorded })) };
    const recordBytes = jsonBytes(record);
    check(recordBytes.length <= MAX_REVIEW, 'record_limit', 'This review exceeds its retained record limit. The previous state remains readable; start a new job for further work.');
    const hash = sha(recordBytes);
    const evidence = await Promise.all(state.evidence.map(async e => ({ ...e, dataUrl: `data:${e.mimeType};base64,${(await checkedFile(dir, e.relativePath, e.sha256, IMAGE_PATH, MAX_IMAGE)).toString('base64')}` })));
    const renderer = options.renderReport ?? (await import('./renderer.mjs')).renderReport;
    const report = await renderer({ ...record, reviewHash: hash, evidence });
    check(typeof report === 'string' && Buffer.byteLength(report) <= 100 * 1024 * 1024, 'render_error', 'Renderer must return HTML no larger than 100 MiB.');
    const reportBytes = Buffer.from(report);
    return lock(dir, async () => {
      const current = await load(dir); stale(current.state, input.expectedVersion);
      const transactionId = `v${String(nextVersion).padStart(6, '0')}-${randomUUID()}`;
      const ref = { reviewId, hash, version: nextVersion, jsonPath: `versions/${transactionId}/review.json`, reportPath: `versions/${transactionId}/report.html`, reportHash: sha(reportBytes), generatedAt, unresolvedCount: unresolved.length, recorded: false };
      const next = { ...current.state, version: nextVersion, updatedAt: generatedAt, latestReview: ref, history: [...current.state.history, ref], recorded: null };
      await publish(dir, next, { 'review.json': recordBytes, 'report.html': reportBytes }, transactionId);
      return { ok: true, jobId: job.jobId, version: nextVersion, reviewId, reviewHash: hash, status: record.status, unresolvedCount: unresolved.length, requirements, followUpDraft, reportPath: path.join(dir, ref.reportPath), reviewPath: path.join(dir, ref.jsonPath), confirmation: unresolved.length ? null : `Record review ${reviewId}` };
    });
  }
  async function accept(input) {
    fields(input, ['jobId', 'expectedVersion', 'reviewId', 'reviewHash', 'confirmation'], 'accept'); version(input.expectedVersion);
    check(typeof input.reviewId === 'string' && /^review-[a-f0-9-]{36}$/.test(input.reviewId), 'invalid_input', 'Invalid review ID.');
    check(typeof input.reviewHash === 'string' && HASH.test(input.reviewHash), 'invalid_input', 'Invalid review hash.');
    check(input.confirmation === `Record review ${input.reviewId}`, 'confirmation_required', `Explicit confirmation must say: Record review ${input.reviewId}`);
    const dir = await jobDir(input.jobId);
    return lock(dir, async () => {
      const { state } = await load(dir); stale(state, input.expectedVersion);
      check(state.latestReview?.reviewId === input.reviewId && state.latestReview.hash === input.reviewHash, 'stale_review', 'Only the latest unchanged review can be recorded.');
      check(!state.recorded, 'already_recorded', 'This review is already recorded.');
      check(state.latestReview.version === state.version, 'stale_review', 'New evidence has been added since this review. Review the full current evidence set first.');
      const record = await readReview(dir, state.latestReview);
      check(record.unresolvedCount === 0 && record.requirements.every(r => r.status === 'supported'), 'unresolved_evidence', 'Resolve all missing, unreadable, uncertain or mismatched observations before recording.');
      const nextVersion = state.version + 1; const transactionId = `v${String(nextVersion).padStart(6, '0')}-${randomUUID()}`; const recordedAt = clock();
      const acknowledgement = { schemaVersion: 1, jobId: input.jobId, reviewId: input.reviewId, reviewHash: input.reviewHash, confirmation: input.confirmation, recordedAt, version: nextVersion, meaning: 'Documentary evidence review recorded by the owner; this does not accept physical work or close a ticket.' };
      const bytes = jsonBytes(acknowledgement);
      const recorded = { reviewId: input.reviewId, recordedAt, path: `versions/${transactionId}/recorded.json`, hash: sha(bytes) };
      const next = { ...state, version: nextVersion, updatedAt: recordedAt, recorded, history: state.history.map(h => h.reviewId === input.reviewId ? { ...h, recorded: true } : h) };
      await publish(dir, next, { 'recorded.json': bytes }, transactionId);
      return { ok: true, jobId: input.jobId, version: nextVersion, reviewId: input.reviewId, status: 'review_recorded', recordedAt, meaning: acknowledgement.meaning };
    });
  }
  async function status(input) {
    fields(input, ['jobId'], 'status');
    if (input.jobId === undefined) {
      const entries = (await fs.readdir(path.join(await root(), 'jobs'), { withFileTypes: true })).filter(e => e.isDirectory() && ID.test(e.name)).sort((a, b) => a.name.localeCompare(b.name));
      const jobs = [];
      for (const entry of entries.slice(0, 50)) {
        try {
          const s = await status({ jobId: entry.name });
          jobs.push({ jobId: s.jobId, title: s.title, version: s.version, status: s.status, evidenceCount: s.evidence.length, unresolvedCount: s.latestReview?.unresolvedCount ?? null, latestReviewId: s.latestReview?.reviewId ?? null, latestReviewApplicable: s.latestReviewApplicable, recordedAt: s.recorded?.recordedAt ?? null });
        } catch (error) {
          jobs.push({ jobId: entry.name, error: { code: error instanceof DomainError ? error.code : 'operation_failed', message: error instanceof DomainError ? error.message : 'This job could not be read.' } });
        }
      }
      return { ok: true, jobs, totalJobs: entries.length, listedCount: jobs.length, truncated: entries.length > jobs.length };
    }
    const dir = await jobDir(input.jobId); const { state, job } = await load(dir);
    const latestReviewApplicable = !!state.latestReview && (state.latestReview.version === state.version || state.recorded?.reviewId === state.latestReview.reviewId);
    return { ok: true, jobId: job.jobId, title: job.title, version: state.version, requirements: job.requirements, evidence: state.evidence.map(e => ({ ...e, path: path.join(dir, e.relativePath) })), latestReview: state.latestReview ? { ...state.latestReview, reportPath: path.join(dir, state.latestReview.reportPath), reviewPath: path.join(dir, state.latestReview.jsonPath) } : null, latestReviewApplicable, recorded: state.recorded, history: state.history, status: state.recorded ? 'review_recorded' : !state.latestReview || !latestReviewApplicable ? 'awaiting_review' : state.latestReview.unresolvedCount ? 'needs_review' : 'ready_to_record' };
  }
  return { init, ingest, review, accept, status };
}
