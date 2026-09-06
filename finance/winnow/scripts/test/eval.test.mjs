// Data-driven acceptance eval. Every case, name and expectation lives in a
// JSON file beside the thesis it exercises, so this runner carries no
// domain knowledge and stays valid for any thesis.
//
// Add a case: drop a `<name>.eval.json` in ../../theses/ naming its thesis
// and judgments file. It is picked up automatically.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadThesis } from '../lib/thesis.mjs';
import { screen } from '../lib/screen.mjs';

const THESES = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'theses');
const suites = existsSync(THESES)
  ? readdirSync(THESES).filter((f) => f.endsWith('.eval.json'))
  : [];

test('at least one acceptance eval is present', () => {
  assert.ok(suites.length > 0, 'no *.eval.json found — the acceptance eval would silently pass');
});

for (const file of suites) {
  const spec = JSON.parse(readFileSync(path.join(THESES, file), 'utf8'));

  test(`eval: ${file}`, async (t) => {
    const { thesis } = loadThesis(path.join(THESES, spec.thesis));
    const judgments = JSON.parse(readFileSync(path.join(THESES, spec.judgments), 'utf8'));
    const r = screen(thesis, judgments);
    const all = [...r.bands.PASS, ...r.bands['NEAR MISS'], ...r.bands.FAIL];
    const find = (n) => {
      const c = all.find((x) => x.name === n);
      assert.ok(c, `expected company "${n}" in the run`);
      return c;
    };

    await t.test('band counts', () => assert.deepEqual(r.counts, spec.expect.counts));

    for (const e of spec.expect.companies) {
      await t.test(`${e.name} — ${e.why}`, () => {
        const c = find(e.name);
        assert.equal(c.band, e.band, `band for ${e.name}`);
        if (e.priority !== undefined) assert.equal(c.priority, e.priority, `priority for ${e.name}`);
        if (e.unscored) { assert.equal(c.scoring, null, `${e.name} must not be scored`); return; }
        assert.ok(c.scoring, `${e.name} must be scored`);
        if (e.criterion !== undefined) {
          const row = c.scoring.rows.find((x) => x.criterion === e.criterion);
          assert.ok(row, `criterion "${e.criterion}" on ${e.name}`);
          if (e.score !== undefined) assert.equal(row.score, e.score, `${e.criterion} score on ${e.name}`);
          if (e.policy !== undefined) assert.equal(row.policy, e.policy, `${e.criterion} missing-data policy on ${e.name}`);
        }
        if (e.scoreNotBelow !== undefined) {
          assert.ok(c.scoring.total >= e.scoreNotBelow,
            `${e.name} scored ${c.scoring.total}, expected >= ${e.scoreNotBelow} — absent evidence must not be punished`);
        }
      });
    }

    await t.test('invariant: ranking is structural — a NEAR MISS never enters PASS on score', () => {
      const worstPass = Math.min(...r.bands.PASS.map((c) => c.scoring.total));
      const bestNear = Math.max(...r.bands['NEAR MISS'].map((c) => c.scoring.total), -1);
      // The interesting case must actually occur, or this proves nothing.
      assert.ok(bestNear > worstPass,
        `fixture must contain a NEAR MISS outscoring a PASS (best near ${bestNear}, worst pass ${worstPass}) — otherwise the invariant is untested`);
      // ...and it stays in its band regardless.
      const climber = r.bands['NEAR MISS'].find((c) => c.scoring.total === bestNear);
      assert.equal(climber.band, 'NEAR MISS',
        `${climber.name} scores ${bestNear}, above a PASS at ${worstPass}, and must still be NEAR MISS — it failed a filter the user wrote down`);
      assert.ok(r.bands.PASS.every((c) => c.band === 'PASS'));
    });

    await t.test('invariant: every FAIL is unscored', () => {
      for (const c of r.bands.FAIL) assert.equal(c.scoring, null, `${c.name} is FAIL and must be unscored`);
    });

    await t.test('invariant: a declared segment with no candidates is flagged', () => {
      for (const cov of Object.values(r.coverage)) {
        for (const row of cov.table) {
          if (row.candidates === 0) assert.ok(row.flags.includes('no coverage'), `${row.segment} empty but unflagged`);
        }
      }
    });
  });
}
