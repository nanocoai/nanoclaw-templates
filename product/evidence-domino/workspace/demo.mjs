import { mkdir, readFile, writeFile, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { runCommand, BASELINE_CONFIRMATION } from '../skills/evidence-domino/scripts/evidence-domino.mjs';
import { startServer } from './server.mjs';
import { createWorkspace } from './service.mjs';
import { createLocalModel } from './model.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// An explicit demo command seeds only the bundled fictional starting estimate.
// It never retrieves, interprets or approves a later observation on the user's behalf.
export async function prepareDemo({ dataDir, parentDir = path.join(os.homedir(), '.local/share/evidence-domino-demos') } = {}) {
  let root;
  if (dataDir) {
    root = path.resolve(dataDir);
    await mkdir(root, { mode: 0o700 }); // EEXIST deliberately refuses to overwrite even an empty directory.
  } else {
    await mkdir(parentDir, { recursive: true, mode: 0o700 });
    root = await mkdtemp(path.join(parentDir, 'demo-'));
  }
  const document = await readFile(path.join(HERE, '../fixtures/demo-proposal.md'), 'utf8');
  const manifest = JSON.parse(await readFile(path.join(HERE, '../fixtures/replay-manifest.json'), 'utf8'));
  const sourceUrl = manifest.versions.find(version => version.name === 'v1').url;
  await runCommand('init', {
    projectId: 'northstar-live-demo', mode: 'controlled_replay', sourceUrl,
    controlledReplay: { logicalSourceId: manifest.logicalSourceId, versions: manifest.versions },
    item: 'standard display plinth rental', unitBasis: 'plinths', quantity: 100, currency: 'USD',
    customerQuoteCents: 600000, minimumRemainingCents: 150000, baselineUnitPriceCents: 4000,
    pricingAssumption: 'public_list_price_estimate', remainingMeaning: 'before_other_costs',
    baselineEvidence: { sourceUrl, priceLiteral: '$40.00', supportingPassage: 'Standard display plinth rental: **$40.00 USD per plinth**.' },
    document, anchors: {
      cost: 'We need 100 plinths at $40.00 each, costing $4,000.00.',
      remaining: 'Our fixed $6,000.00 customer quote leaves $2,000.00 after the tracked supplier cost, before other costs.',
      minimum: 'This meets our minimum remaining amount of $1,500.',
    },
    documentValues: { quantity: 100, unitPriceCents: 4000, trackedCostCents: 400000, customerQuoteCents: 600000, remainingCents: 200000, minimumRemainingCents: 150000, meetsTarget: true },
    confirmation: BASELINE_CONFIRMATION,
  }, { dataDir: root });
  const workspace = await createWorkspace({ dataDir: root });
  await workspace.addDocument({ name: 'delivery-notes.txt', content: 'Fictional Northstar event delivery brief.\n\nDeliver all 100 plinths through the north loading door before 09:15 on October 18, 2026. The event starts at 10:00. No lift is available; delivery stays on the ground floor.' });
  await writeFile(path.join(root, 'DEMO.txt'), 'Controlled source replay. Fictional starting estimate prepared from bundled files, not a live retrieval. Use Check price with v1 and v2 for actual Tavily retrieval and local-model interpretation. Approve changes explicitly.\n', { mode: 0o600, flag: 'wx' });
  return root;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    let dataDir; let port = 4319; const modelOptions = { model: 'qwen3:4b' };
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
      const key = args[i]; const value = args[++i];
      if (!value) throw new Error(`Missing value for ${key}.`);
      if (key === '--data-dir') dataDir = value;
      else if (key === '--port') port = Number(value);
      else if (key === '--model') modelOptions.model = value;
      else if (key === '--ollama') modelOptions.endpoint = value;
      else if (key === '--gpu-layers') modelOptions.gpuLayers = Number(value);
      else if (key === '--context-size') modelOptions.contextSize = Number(value);
      else throw new Error(`Unknown option ${key}.`);
    }
    const model = createLocalModel(modelOptions);
    const health = await model.ready();
    if (!health.available) throw new Error('Start the local model before launching the demo.');
    const root = await prepareDemo({ dataDir });
    const instance = await startServer({ dataDir: root, port, model, allowPublicRetrieval: true });
    console.log(`Controlled source replay — fictional data\nOpen: ${instance.url}/#token=${instance.token}\nData: ${root}\nStarting estimate prepared from bundled files. Select v1, then v2 for real source checks. Each request needs your consent; revisions need your approval.\nKeep the launch link private. Ctrl+C stops this demo.`);
    let closing = false;
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { if (closing) return; closing = true; await instance.close(); process.exit(0); });
  } catch (error) { console.error(`${error.code ?? 'ERROR'}: ${error.message}`); process.exitCode = 1; }
}
