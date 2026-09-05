#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_DIR = '/workspace/agent/memory/youth-group-safety/review-notes';

function frontmatterValue(markdown, key) {
  const lines = markdown.split(/\r?\n/);
  if (lines[0] !== '---') return undefined;
  const closing = lines.indexOf('---', 1);
  if (closing === -1) return undefined;
  const prefix = `${key}:`;
  const line = lines.slice(1, closing).find((candidate) => candidate.startsWith(prefix));
  return line?.slice(prefix.length).trim();
}

export function cleanupReviewNotes({ root = DEFAULT_DIR, now = new Date() } = {}) {
  const result = { deleted: [], invalid: [] };
  if (!fs.existsSync(root)) return result;

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const file = path.join(root, entry.name);
    let markdown;
    try {
      markdown = fs.readFileSync(file, 'utf8');
    } catch {
      result.invalid.push(entry.name);
      continue;
    }
    const expiresAt = frontmatterValue(markdown, 'expires_at');
    const expiresMs = expiresAt && expiresAt.endsWith('Z') ? Date.parse(expiresAt) : Number.NaN;
    if (!Number.isFinite(expiresMs)) {
      result.invalid.push(entry.name);
      continue;
    }
    if (expiresMs <= now.getTime()) {
      fs.unlinkSync(file);
      result.deleted.push(entry.name);
    }
  }
  return result;
}

export function taskResult(result) {
  if (result.invalid.length === 0) return { wakeAgent: false };
  return {
    wakeAgent: true,
    data: {
      kind: 'review-note-cleanup-needs-attention',
      invalidRecordCount: result.invalid.length,
      deletedRecordCount: result.deleted.length,
    },
  };
}

function main() {
  const root = process.argv[2] || DEFAULT_DIR;
  const result = cleanupReviewNotes({ root });
  process.stdout.write(`${JSON.stringify(taskResult(result))}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
