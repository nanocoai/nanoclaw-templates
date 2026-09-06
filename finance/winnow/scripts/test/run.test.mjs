// Tests for the run lifecycle in ../lib/run.mjs, and its exit codes through
// the winnow.mjs CLI. Covers what a run refuses: a thesis that does not
// validate, a run screened before every candidate is judged, an empty run,
// and a thesis edited after the run opened (with --force downgrading that to
// a warning). Also covers what it merely warns about (stale evidence, a
// shipped thesis shadowed by a plugin-data copy) and what `status` reports.
// Each case runs against a throwaway run directory under os.tmpdir().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, appendFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { initRun, setUniverse, applyUniverse, runStatus, checkRun, slug, RunError } from '../lib/run.mjs';
import { loadThesis, filterList, settings } from '../lib/thesis.mjs';

const CLI = path.join(process.cwd(), 'winnow.mjs');
const THESIS = [
  'acquisition_thesis:', '  name: T',
  '  hard_filters:', '    geography: { include: [S1] }',
  '  scored_preferences:', '    criteria:', '      - name: A', '        weight: 100',
  '        scoring_guidance: { 100: a, 50: b, 0: c }',
  'research_settings:', '  coverage: { report_by: [geography] }', ''].join('\n');

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'wnrun-'));
  const tf = path.join(root, 't.yaml');
  writeFileSync(tf, THESIS);
  const { dir, candidates } = initRun(tf, root);
  return { root, tf, dir, candidates };
}
const candidate = (dir, name) => writeFileSync(path.join(dir, `${name}.json`), JSON.stringify({
  name, segments: { geography: 'S1' }, sources: ['r'],
  filters: { geography: { outcome: 'pass' } }, scores: { A: { score: 70, confidence: 'high' } } }));

test('init-run issues the path; the agent never invents one', () => {
  const { candidates, tf } = fixture();
  const meta = JSON.parse(readFileSync(path.join(candidates, '_run.json'), 'utf8'));
  assert.equal(meta.thesis, path.resolve(tf));
  assert.match(meta.thesis_sha, /^[0-9a-f]{16}$/);
  assert.ok(Date.parse(meta.started_at) > 0);
  assert.equal(meta.universe, null);
});

test('init-run refuses a thesis that does not validate', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'wnbad-'));
  const tf = path.join(root, 'bad.yaml');
  writeFileSync(tf, 'acquisition_thesis:\n  name: T\n');
  assert.throws(() => execFileSync('node', [CLI, 'init-run', tf, '--data', root], { stdio: 'pipe' }));
});

test('an incomplete run cannot be screened', () => {
  const { tf, candidates } = fixture();
  setUniverse(candidates, { found: 30, carried: 3 });
  candidate(candidates, 'a');
  assert.throws(() => checkRun(candidates, tf), (e) => e instanceof RunError && /incomplete run/.test(e.message));
  candidate(candidates, 'b'); candidate(candidates, 'c');
  assert.deepEqual(checkRun(candidates, tf), [], 'complete run passes clean');
});

test('a thesis edited mid-run is refused, and --force downgrades it to a warning', () => {
  const { tf, candidates } = fixture();
  setUniverse(candidates, { found: 5, carried: 1 });
  candidate(candidates, 'a');
  assert.deepEqual(checkRun(candidates, tf), []);
  appendFileSync(tf, '\n# an edit that changes the screen\n');
  assert.throws(() => checkRun(candidates, tf), (e) => e instanceof RunError && /thesis changed/.test(e.message));
  const w = checkRun(candidates, tf, { force: true });
  assert.ok(w.some((x) => /thesis changed/.test(x)), 'forced, but still reported');
});

test('stale evidence warns rather than blocking', () => {
  const { tf, candidates } = fixture();
  const f = path.join(candidates, '_run.json');
  const meta = JSON.parse(readFileSync(f, 'utf8'));
  meta.started_at = new Date(Date.now() - 40 * 3.6e6).toISOString();
  writeFileSync(f, JSON.stringify(meta));
  candidate(candidates, 'a');
  const w = checkRun(candidates, tf);
  assert.ok(w.some((x) => /40h old/.test(x)), `expected staleness warning, got ${JSON.stringify(w)}`);
});

test('an empty run is refused outright', () => {
  const { tf, candidates } = fixture();
  assert.throws(() => checkRun(candidates, tf), (e) => e instanceof RunError && /no candidate files/.test(e.message));
});

test('status reports written vs expected', () => {
  const { candidates } = fixture();
  setUniverse(candidates, { found: 9, carried: 2 });
  candidate(candidates, 'a');
  const st = runStatus(candidates);
  assert.equal(st.written, 1); assert.equal(st.expected, 2);
  const out = execFileSync('node', [CLI, 'status', candidates], { encoding: 'utf8' });
  assert.match(out, /written:\s+1 of 2/);
  assert.match(out, /incomplete: 1 candidate/);
});

test('screen refuses an incomplete run end to end, exit code 5', () => {
  const { tf, candidates } = fixture();
  setUniverse(candidates, { found: 30, carried: 4 });
  candidate(candidates, 'a');
  try {
    execFileSync('node', [CLI, 'screen', tf, candidates], { stdio: 'pipe' });
    assert.fail('should have refused');
  } catch (e) {
    assert.equal(e.status, 5);
    assert.match(String(e.stderr), /incomplete run/);
  }
});

test("a plugin-data thesis shadowing a differing shipped one is reported", async () => {
  const { shadowWarning } = await import('../lib/run.mjs');
  const root = mkdtempSync(path.join(os.tmpdir(), 'wnshadow-'));
  const pluginRoot = path.join(root, 'plugin'); const data = path.join(root, 'data');
  execFileSync('mkdir', ['-p', path.join(pluginRoot, 'theses'), path.join(data, 'theses')]);
  const shipped = path.join(pluginRoot, 'theses', 'q.yaml');
  const copy = path.join(data, 'theses', 'q.yaml');
  writeFileSync(shipped, THESIS);
  writeFileSync(copy, THESIS);
  assert.equal(shadowWarning(copy, pluginRoot), null, 'identical copy is not a shadow');
  writeFileSync(copy, THESIS + '\n# edited\n');
  assert.match(shadowWarning(copy, pluginRoot), /shadows a shipped one that differs/);
  assert.equal(shadowWarning(shipped, pluginRoot), null, 'the shipped thesis never shadows itself');
});

const THESIS2 = [
  'acquisition_thesis:', '  name: T2',
  '  hard_filters:', '    geography: { include: [S1, S2] }',
  '    other:', '      - name: Soft', '        condition: c', '        revisitable: true',
  '  scored_preferences:', '    criteria:', '      - name: A', '        weight: 100',
  '        scoring_guidance: { 100: a, 50: b, 0: c }',
  'research_settings:', '  coverage: { report_by: [geography] }',
  '  target_limits: { initial_universe: 3, deep_research_limit: 2 }', ''].join('\n');

function universeFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'wnuni-'));
  const tf = path.join(root, 't.yaml');
  writeFileSync(tf, THESIS2);
  const { candidates } = initRun(tf, root);
  const uf = path.join(root, 'universe.json');
  writeFileSync(uf, JSON.stringify({ tier: 'keyless', queries: ['q1', 'q2'], candidates: [
    { name: 'S1 Alpha', url: 'https://alpha.example', location: 'A', segment: 'S1', source: 'web search' },
    { name: 'S2 Beta', url: 'https://beta.example', location: 'B', segment: 'S2', source: 'web search' },
    { name: 'Beta duplicate', url: 'http://www.beta.example/about', location: 'B', segment: 'S2', source: 'directory' },
    { name: 'S1 Gamma', url: 'https://gamma.example', location: 'G', segment: 'S1', source: 'web search' },
    { name: 'S2 Delta', url: 'https://delta.example', location: 'D', segment: 'S2', source: 'web search' },
    { name: 'S2 Epsilon', url: 'https://eps.example', location: 'E', segment: 'S2', source: 'web search' },
    { name: 'Texan', url: 'https://texan.example', location: 'TX', segment: 'S1', source: 'web search', fail: { filter: 'geography', evidence: 'HQ in Texas' } },
  ] }));
  const { thesis } = loadThesis(tf);
  const cfg = settings(thesis);
  const opts = { filters: filterList(thesis), declaredSegments: cfg.declaredSegments, limits: cfg.limits };
  return { root, tf, candidates, uf, thesis, opts };
}

test('set-universe --from: dedup, firm-filter drops, round-robin cap, research limit, stubs, printed rows', () => {
  const { tf, candidates, uf, thesis, opts } = universeFixture();
  const r = applyUniverse(candidates, uf, thesis, opts);
  assert.equal(r.found, 6, 'the duplicate domain collapsed');
  assert.deepEqual(r.fails.map((x) => x.name), ['Texan']);
  assert.deepEqual(r.carried.map((x) => x.name), ['S1 Alpha', 'S2 Beta', 'S1 Gamma'], 'round-robin across segments, cap 3');
  assert.deepEqual(r.research.map((x) => x.name), ['S1 Alpha', 'S2 Beta'], 'deep_research_limit 2');
  assert.deepEqual(r.shallow.map((x) => x.name), ['S1 Gamma']);
  assert.deepEqual(r.uncarried.map((x) => x.name), ['S2 Delta', 'S2 Epsilon']);
  assert.equal(r.research[0].file, path.join(candidates, 's1-alpha.json'));
  const files = readdirSync(candidates).sort();
  assert.deepEqual(files, ['_run.json', 's1-gamma.json', 'texan.json'], 'stubs for the fail and the unresearched; nothing for the researched');
  const texan = JSON.parse(readFileSync(path.join(candidates, 'texan.json'), 'utf8'));
  assert.equal(texan.filters.geography.outcome, 'fail');
  assert.equal(texan.filters.Soft.outcome, 'unresolved');
  const meta = JSON.parse(readFileSync(path.join(candidates, '_run.json'), 'utf8'));
  assert.deepEqual([meta.universe.found, meta.universe.carried_forward, meta.universe.files_expected, meta.universe.cap], [6, 3, 4, 3], 'carried is the cap count; the drop is a file but not carried');
  assert.match(meta.universe.note, /2 researched, 1 carried without research/);
  assert.match(meta.universe.note, /S2 Delta, S2 Epsilon/);
  assert.match(meta.universe.note, /keyless/);
  // The run is incomplete until the researched files exist; then it screens.
  assert.throws(() => checkRun(candidates, tf), /incomplete run: universe carried 4/);
  for (const c of r.research) writeFileSync(c.file, JSON.stringify({ name: c.name, url: c.url, segments: { geography: c.segment }, sources: [c.source],
    filters: { geography: { outcome: 'pass' }, Soft: { outcome: 'pass' } }, scores: { A: { score: 70, confidence: 'high', why: 'w' } } }));
  assert.deepEqual(checkRun(candidates, tf), []);
});

test('set-universe --from refuses bad segments and revisitable "fails", naming every problem', () => {
  const { candidates, uf, thesis, opts } = universeFixture();
  writeFileSync(uf, JSON.stringify({ candidates: [
    { name: 'Lost', url: 'https://l.example', segment: 'S9', source: 's' },
    { name: 'Softie', url: 'https://s.example', segment: 'S1', source: 's', fail: { filter: 'Soft', evidence: 'e' } },
  ] }));
  assert.throws(() => applyUniverse(candidates, uf, thesis, opts), (e) => e instanceof RunError && /2 problem/.test(e.message) && /"S9"/.test(e.message) && /revisitable/.test(e.message));
});

test('slug is stable and filesystem-safe', () => {
  assert.equal(slug('APL Access & Security, Inc.'), 'apl-access-security-inc');
  assert.equal(slug('  Ünicode  '), 'nicode');
});

test('set-universe --from via the CLI prints the research rows and their files', () => {
  const { candidates, uf } = universeFixture();
  const out = execFileSync('node', [CLI, 'set-universe', candidates, '--from', uf], { encoding: 'utf8' });
  assert.match(out, /6 found · 1 dropped by firm filters · 3 carried · 2 to research · 2 past the cap/);
  assert.match(out, /- S1 Alpha \| https:\/\/alpha.example/);
  assert.match(out, /→ .*s1-alpha.json/);
  assert.match(out, /Then: winnow screen/);
});
