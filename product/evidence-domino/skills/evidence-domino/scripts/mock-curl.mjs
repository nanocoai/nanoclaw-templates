#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';

const scenarioPath = process.env.EVIDENCE_DOMINO_TEST_SCENARIO;
if (!scenarioPath) {
  process.stderr.write('EVIDENCE_DOMINO_TEST_SCENARIO is required.\n');
  process.exit(2);
}

const scenario = JSON.parse(await readFile(scenarioPath, 'utf8'));
if (scenario.argsPath) {
  await writeFile(scenario.argsPath, JSON.stringify({
    args: process.argv.slice(2),
    tavilyApiKey: process.env.TAVILY_API_KEY ?? null,
  }));
}
let response = scenario.default;

if (Array.isArray(scenario.responses)) {
  const counterPath = `${scenarioPath}.counter`;
  let index = 0;
  try {
    index = Number(await readFile(counterPath, 'utf8')) || 0;
  } catch {
    // First invocation.
  }
  response = scenario.responses[Math.min(index, scenario.responses.length - 1)];
  await writeFile(counterPath, String(index + 1));
}

if (!response) {
  process.stderr.write('Scenario has no response.\n');
  process.exit(2);
}

if (response.stderr) process.stderr.write(response.stderr);
const raw = typeof response.rawBase64 === 'string' ? Buffer.from(response.rawBase64, 'base64')
  : Buffer.from(typeof response.raw === 'string' ? response.raw : JSON.stringify(response.body ?? {}), 'utf8');
process.stdout.write(Buffer.concat([raw, Buffer.from(`\n__ED_HTTP_STATUS__:${response.httpStatus ?? 200}`)]));
process.exit(response.exitCode ?? 0);
