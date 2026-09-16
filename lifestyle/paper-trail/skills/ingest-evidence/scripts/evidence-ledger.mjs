#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MANIFEST_VERSION = 1;
const CASE_STATES = new Set([
  'NEW',
  'OPEN',
  'INGESTED',
  'REVIEW_NEEDED',
  'PACK_READY',
  'DRAFT_READY',
  'CLOSED',
]);

function nowIso() {
  return new Date().toISOString();
}

function cleanText(value, field, max = 500) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} must be a non-empty string`);
  }
  const cleaned = value.trim();
  if (cleaned.length > max) throw new Error(`${field} must be at most ${max} characters`);
  return cleaned;
}

function safeCaseId(caseDir) {
  const id = path.basename(path.resolve(caseDir));
  if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(id) || id.includes('--')) {
    throw new Error('case directory name must be a lowercase slug (letters, numbers, single hyphens)');
  }
  return id;
}

function safeStoredName(originalName) {
  const base = path.basename(originalName).normalize('NFKC');
  const cleaned = base
    .replace(/[\u0000-\u001f<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/[-_]{2,}/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120);
  return cleaned || 'evidence.bin';
}

function mediaTypeFor(filename) {
  const extension = path.extname(filename).toLowerCase();
  return (
    {
      '.csv': 'text/csv',
      '.gif': 'image/gif',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.txt': 'text/plain',
      '.webp': 'image/webp',
    }[extension] ?? 'application/octet-stream'
  );
}

async function sha256(file) {
  const handle = await open(file, 'r');
  const hash = createHash('sha256');
  try {
    for await (const chunk of handle.createReadStream()) hash.update(chunk);
  } finally {
    await handle.close();
  }
  return hash.digest('hex');
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeJsonAtomic(file, value) {
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  try {
    await rename(temporary, file);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

function nextExhibitId(manifest) {
  const used = new Set(manifest.exhibits.map((item) => item.exhibitId));
  let number = Number.isInteger(manifest.nextExhibitNumber) ? manifest.nextExhibitNumber : 1;
  let id;
  do {
    id = `E-${String(number).padStart(3, '0')}`;
    number += 1;
  } while (used.has(id));
  manifest.nextExhibitNumber = number;
  return id;
}

export async function initCase(caseDirectory, title, requestedOutcome) {
  const caseDir = path.resolve(caseDirectory);
  const caseId = safeCaseId(caseDir);
  const createdAt = nowIso();
  await mkdir(path.join(caseDir, 'source'), { recursive: true });

  const caseFile = path.join(caseDir, 'case.json');
  const manifestFile = path.join(caseDir, 'manifest.json');
  try {
    await stat(caseFile);
    throw new Error(`case already exists: ${caseDir}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const caseRecord = {
    schemaVersion: 1,
    caseId,
    title: cleanText(title, 'title', 160),
    requestedOutcome: cleanText(requestedOutcome, 'requested outcome', 500),
    state: 'OPEN',
    createdAt,
    updatedAt: createdAt,
  };
  const manifest = {
    schemaVersion: MANIFEST_VERSION,
    caseId,
    nextExhibitNumber: 1,
    exhibits: [],
    duplicates: [],
  };

  await writeFile(caseFile, `${JSON.stringify(caseRecord, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });
  try {
    await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
  } catch (error) {
    await unlink(caseFile).catch(() => {});
    throw error;
  }

  return { ok: true, action: 'init', caseDir, case: caseRecord, manifest };
}

async function loadCase(caseDirectory) {
  const caseDir = path.resolve(caseDirectory);
  safeCaseId(caseDir);
  const caseFile = path.join(caseDir, 'case.json');
  const manifestFile = path.join(caseDir, 'manifest.json');
  const caseRecord = await readJson(caseFile);
  const manifest = await readJson(manifestFile);
  if (caseRecord.caseId !== path.basename(caseDir) || manifest.caseId !== caseRecord.caseId) {
    throw new Error('caseId does not match the case directory and manifest');
  }
  if (!CASE_STATES.has(caseRecord.state)) throw new Error(`invalid case state: ${caseRecord.state}`);
  if (!Array.isArray(manifest.exhibits) || !Array.isArray(manifest.duplicates)) {
    throw new Error('manifest exhibits and duplicates must be arrays');
  }
  return { caseDir, caseFile, manifestFile, caseRecord, manifest };
}

export async function addEvidence(caseDirectory, sourceFiles) {
  if (!Array.isArray(sourceFiles) || sourceFiles.length === 0) {
    throw new Error('add requires at least one source file');
  }
  const loaded = await loadCase(caseDirectory);
  if (loaded.caseRecord.state === 'CLOSED') throw new Error('cannot add evidence to a closed case');
  const added = [];
  const duplicates = [];
  const failures = [];

  for (const sourceValue of sourceFiles) {
    const input = String(sourceValue);
    try {
      const source = path.resolve(input);
      const details = await stat(source);
      if (!details.isFile()) throw new Error('source is not a regular file');
      const digest = await sha256(source);
      const duplicate = loaded.manifest.exhibits.find((item) => item.sha256 === digest);
      if (duplicate) {
        const record = {
          inputName: path.basename(source),
          sha256: digest,
          existingExhibitId: duplicate.exhibitId,
          indexedAt: nowIso(),
        };
        loaded.manifest.duplicates.push(record);
        duplicates.push(record);
        continue;
      }

      const exhibitId = nextExhibitId(loaded.manifest);
      const originalName = path.basename(source);
      const storedName = `${exhibitId}__${safeStoredName(originalName)}`;
      const destination = path.join(loaded.caseDir, 'source', storedName);
      await copyFile(source, destination, 1);
      const copiedDigest = await sha256(destination);
      if (copiedDigest !== digest) {
        await unlink(destination).catch(() => {});
        throw new Error('copied evidence checksum does not match source');
      }
      const exhibit = {
        exhibitId,
        originalName,
        storedName,
        sha256: digest,
        byteLength: details.size,
        mediaType: mediaTypeFor(originalName),
        indexedAt: nowIso(),
        sourceKind: 'file',
        extractionStatus: 'pending',
        notes: [],
      };
      loaded.manifest.exhibits.push(exhibit);
      added.push(exhibit);
    } catch (error) {
      failures.push({ input, error: error.message });
    }
  }

  loaded.caseRecord.state = loaded.manifest.exhibits.length > 0 ? 'INGESTED' : loaded.caseRecord.state;
  loaded.caseRecord.updatedAt = nowIso();
  await writeJsonAtomic(loaded.manifestFile, loaded.manifest);
  await writeJsonAtomic(loaded.caseFile, loaded.caseRecord);

  return {
    ok: failures.length === 0,
    action: 'add',
    caseDir: loaded.caseDir,
    added,
    duplicates,
    failures,
    totals: {
      uniqueExhibits: loaded.manifest.exhibits.length,
      duplicateSubmissions: loaded.manifest.duplicates.length,
    },
  };
}

export async function verifyEvidence(caseDirectory) {
  const loaded = await loadCase(caseDirectory);
  const results = [];
  for (const exhibit of loaded.manifest.exhibits) {
    const source = path.resolve(loaded.caseDir, 'source', exhibit.storedName);
    const expectedRoot = `${path.resolve(loaded.caseDir, 'source')}${path.sep}`;
    if (!source.startsWith(expectedRoot)) {
      results.push({ exhibitId: exhibit.exhibitId, ok: false, error: 'stored path escapes source directory' });
      continue;
    }
    try {
      const details = await stat(source);
      const digest = await sha256(source);
      const errors = [];
      if (!details.isFile()) errors.push('not a regular file');
      if (details.size !== exhibit.byteLength) errors.push('byte length changed');
      if (digest !== exhibit.sha256) errors.push('checksum changed');
      results.push({ exhibitId: exhibit.exhibitId, ok: errors.length === 0, errors });
    } catch (error) {
      results.push({ exhibitId: exhibit.exhibitId, ok: false, error: error.message });
    }
  }
  return {
    ok: results.every((item) => item.ok),
    action: 'verify',
    caseDir: loaded.caseDir,
    results,
  };
}

function usage() {
  return [
    'Usage:',
    '  node evidence-ledger.mjs init <case-dir> <title> <requested-outcome>',
    '  node evidence-ledger.mjs add <case-dir> <file> [<file> ...]',
    '  node evidence-ledger.mjs verify <case-dir>',
  ].join('\n');
}

async function main(argv) {
  const [command, caseDir, ...rest] = argv;
  if (!command || !caseDir) throw new Error(usage());
  if (command === 'init') {
    if (rest.length !== 2) throw new Error(usage());
    return initCase(caseDir, rest[0], rest[1]);
  }
  if (command === 'add') return addEvidence(caseDir, rest);
  if (command === 'verify') {
    if (rest.length !== 0) throw new Error(usage());
    return verifyEvidence(caseDir);
  }
  throw new Error(`unknown command: ${command}\n${usage()}`);
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  main(process.argv.slice(2))
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (result.ok === false) process.exitCode = 1;
    })
    .catch((error) => {
      process.stderr.write(`${JSON.stringify({ ok: false, error: error.message }, null, 2)}\n`);
      process.exitCode = 1;
    });
}
