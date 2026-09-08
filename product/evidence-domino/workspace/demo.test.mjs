import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { prepareDemo } from './demo.mjs';
import { createWorkspace } from './service.mjs';

test('demo creates an isolated labelled starting estimate, no capture or approval of a later price', async t => {
  const parentDir = await mkdtemp(path.join(os.tmpdir(), 'domino-demo-test-'));
  t.after(() => rm(parentDir, { recursive: true, force: true }));
  const root = await prepareDemo({ parentDir });
  const workspace = await createWorkspace({ dataDir: root });
  const state = await workspace.state();
  assert.equal(state.project.mode, 'controlled_replay');
  assert.equal(state.project.baseline.unitPriceCents, 4000);
  assert.equal(state.pending, null);
  assert.equal(state.project.latestCaptureSequence, 0);
  assert.equal(state.messages.length, 0);
  assert.deepEqual(state.project.replayVersions, [{ name: 'v1' }, { name: 'v2' }]);
  assert.equal(state.documents[0].name, 'delivery-notes.txt');
  assert.match(await readFile(path.join(root, 'DEMO.txt'), 'utf8'), /not a live retrieval/);
  const second = await prepareDemo({ parentDir });
  assert.notEqual(root, second);
});

test('demo refuses existing directories and preserves their contents', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'domino-demo-preserve-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'keep.txt'), 'Preserve this project.');
  await assert.rejects(prepareDemo({ dataDir: root }), { code: 'EEXIST' });
  assert.equal(await readFile(path.join(root, 'keep.txt'), 'utf8'), 'Preserve this project.');
});
