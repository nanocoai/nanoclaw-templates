#!/usr/bin/env node
import * as fs from 'node:fs/promises';
import { createEngine, DomainError } from './engine.mjs';

try {
  const args = process.argv.slice(2);
  const command = args.shift();
  if (!['init', 'ingest', 'review', 'accept', 'status'].includes(command)) throw new DomainError('usage', 'Usage: node cli.mjs init|ingest|review|accept|status --input FILE [--data-dir DIRECTORY]');
  const flags = {};
  while (args.length) {
    const key = args.shift(); const value = args.shift();
    if (!['--input', '--data-dir'].includes(key) || !value || value.startsWith('--') || flags[key]) throw new DomainError('usage', 'Expected unique --input FILE and optional --data-dir DIRECTORY.');
    flags[key] = value;
  }
  if (!flags['--input']) throw new DomainError('usage', '--input FILE is required.');
  const stat = await fs.stat(flags['--input']);
  if (!stat.isFile() || stat.size > 1024 * 1024) throw new DomainError('invalid_input', 'Input must be a JSON file no larger than 1 MiB.');
  let input;
  try { input = JSON.parse(await fs.readFile(flags['--input'], 'utf8')); } catch { throw new DomainError('invalid_input', 'Input is not valid JSON.'); }
  const engine = createEngine({ dataDir: flags['--data-dir'] });
  process.stdout.write(`${JSON.stringify(await engine[command](input))}\n`);
} catch (error) {
  const known = error instanceof DomainError;
  process.stdout.write(`${JSON.stringify({ ok: false, error: { code: known ? error.code : 'operation_failed', message: known ? error.message : 'The file operation or rendering failed. The previous complete state remains available; inspect local logs and retry from status.', ...(known && error.details ? { details: error.details } : {}) } })}\n`);
  if (!known) process.stderr.write(`${error.name}: ${error.message}\n`);
  process.exitCode = 1;
}
