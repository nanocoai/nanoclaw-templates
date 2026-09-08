#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function parseDataDir(argv) {
  const index = argv.indexOf('--data-dir');
  return index >= 0 && argv[index + 1]
    ? path.resolve(argv[index + 1])
    : path.resolve(process.env.PLUGIN_DATA || '/workspace/agent/plugin-data/forkcheck');
}

try {
  const file = path.join(parseDataDir(process.argv.slice(2)), 'ledger.json');
  if (!fs.existsSync(file)) {
    process.stdout.write('{"wakeAgent":false}\n');
  } else {
    const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
    const now = Date.now();
    const dueIds = (ledger.records || [])
      .filter((record) => record.status !== 'INVALIDATED' && record.nextCheckAt)
      .filter((record) => new Date(record.nextCheckAt).valueOf() <= now)
      .map((record) => record.id);
    process.stdout.write(`${JSON.stringify({ wakeAgent: dueIds.length > 0, data: { dueIds } })}\n`);
  }
} catch (error) {
  process.stdout.write(`${JSON.stringify({
    wakeAgent: true,
    data: { ledgerError: error instanceof Error ? error.message : String(error) },
  })}\n`);
}

