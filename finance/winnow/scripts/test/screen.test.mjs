// Unit tests for the screening engine in ../lib/screen.mjs — the decisions
// that turn per-candidate judgments into a ranked list. Covers band
// assignment (the PASS / NEAR MISS / FAIL truth table, and how unresolved
// filters are treated in each missing-data mode), weighted scoring and its
// normalisation, ranking tie-breaks, coverage warnings, confidence
// weighting, thesis validation, and one end-to-end pass through screen().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignBand, scoreCompany, rank, coverage, screen, checkShape, CAPS, JudgmentsError } from '../lib/screen.mjs';
import { validate, filterList, criteriaList } from '../lib/thesis.mjs';

const filters = [
  { name: 'geography', revisitable: false },
  { name: 'Business-customer orientation', revisitable: true },
];
const P = { outcome: 'pass' }, F = { outcome: 'fail' }, U = { outcome: 'unresolved' };
const band = (geo, soft, mode = 'neutral') => assignBand({ geography: geo, 'Business-customer orientation': soft }, filters, mode).band;

test('band truth table', () => {
  assert.equal(band(P, P), 'PASS');
  assert.equal(band(P, F), 'NEAR MISS', 'failing only a revisitable filter quarantines');
  assert.equal(band(F, P), 'FAIL', 'a firm failure drops');
  assert.equal(band(F, F), 'FAIL', 'firm beats revisitable');
  assert.equal(band(P, U), 'NEAR MISS', 'unresolved joins near miss');
  assert.equal(band(U, P), 'NEAR MISS', 'unresolved on a firm filter is still near miss');
  assert.equal(band(U, P, 'exclude'), 'FAIL', 'exclude mode sends unresolved to FAIL');
  assert.equal(band(P, F, 'exclude'), 'NEAR MISS', 'exclude mode does not touch revisitable failures');
});

test('band records why, and refuses a missing or malformed outcome', () => {
  const r = assignBand({ geography: P, 'Business-customer orientation': { outcome: 'fail', what_would_settle_it: 'a real B2B division' } }, filters, 'neutral');
  assert.deepEqual(r.reasons.map((x) => [x.filter, x.outcome, x.revisitable, x.settle]), [['Business-customer orientation', 'fail', true, 'a real B2B division']]);
  assert.throws(() => assignBand({ geography: P }, filters, 'neutral'), JudgmentsError);
  assert.throws(() => assignBand({ geography: { outcome: 'maybe' }, 'Business-customer orientation': P }, filters, 'neutral'), JudgmentsError);
});

const criteria = [
  { name: 'A', weight: 60, normalised: 60 },
  { name: 'B', weight: 20, normalised: 20 },
  { name: 'Scale', weight: 20, normalised: 20 },
];

test('weighted scoring arithmetic, and both confidences reported', () => {
  const r = scoreCompany({ A: { score: 100, confidence: 'high' }, B: { score: 50, confidence: 'medium' }, Scale: { score: 0, confidence: 'high' } }, criteria, 'neutral');
  assert.equal(r.total, 70); // 60 + 10 + 0
  // weighted: (3*60 + 2*20 + 3*20)/100 = 2.8 -> high
  assert.equal(r.confidence, 'high');
  assert.equal(r.lowestConfidence, 'medium', 'weakest input is carried, not discarded');
  assert.equal(r.excluded, false);
});

test('weights are normalised, not trusted', () => {
  const raw = [{ name: 'A', weight: 3 }, { name: 'B', weight: 1 }];
  const sum = raw.reduce((a, c) => a + c.weight, 0);
  const norm = raw.map((c) => ({ ...c, normalised: (c.weight / sum) * 100 }));
  const r = scoreCompany({ A: { score: 100, confidence: 'high' }, B: { score: 0, confidence: 'high' } }, norm, 'neutral');
  assert.equal(r.total, 75);
});

test('missing data: neutral=50 flagged low, penalize=0, exclude marks the company', () => {
  const s = { A: { score: 100, confidence: 'high' }, B: { score: 100, confidence: 'high' } }; // Scale missing
  const n = scoreCompany(s, criteria, 'neutral');
  assert.equal(n.total, 90); assert.equal(n.rows[2].policy, 'neutral'); assert.equal(n.rows[2].confidence, 'low');
  // weighted: (3*60 + 3*20 + 1*20)/100 = 2.6 -> high, but the low input stays visible
  assert.equal(n.confidence, 'high');
  assert.equal(n.lowestConfidence, 'low');
  const p = scoreCompany(s, criteria, 'penalize');
  assert.equal(p.total, 80); assert.equal(p.rows[2].score, 0);
  const x = scoreCompany(s, criteria, 'exclude');
  assert.equal(x.excluded, true);
});

test('score bounds and confidence enum are enforced', () => {
  assert.throws(() => scoreCompany({ A: { score: 101, confidence: 'high' } }, criteria.slice(0, 1), 'neutral'), JudgmentsError);
  assert.throws(() => scoreCompany({ A: { score: 50, confidence: 'certain' } }, criteria.slice(0, 1), 'neutral'), JudgmentsError);
});

test('ranking: score, then confidence, then scale, then name', () => {
  const mk = (name, total, confidence, scale) => ({ name, scoring: { total, confidence, rows: [{ criterion: 'Scale', score: scale }] } });
  const r = rank([mk('d', 70, 'low', 0), mk('c', 80, 'low', 0), mk('b', 80, 'high', 10), mk('a', 80, 'high', 90)]);
  assert.deepEqual(r.map((x) => x.name), ['a', 'b', 'c', 'd']);
});

test('coverage flags single-source dominance and empty declared segments', () => {
  const cands = [
    ...Array.from({ length: 9 }, (_, i) => ({ name: `x${i}`, segments: { geography: 'Seg A' }, sources: ['roster'] })),
    { name: 'y', segments: { geography: 'Seg A' }, sources: ['press'] },
    { name: 'z1', segments: { geography: 'Seg B' }, sources: ['press'] },
    { name: 'z2', segments: { geography: 'Seg B' }, sources: ['registry'] },
    { name: 'w', segments: { geography: 'Seg D' }, sources: ['press'] }, // undeclared
  ];
  const c = coverage(cands, { geography: ['Seg A', 'Seg B', 'Seg C'] }, 0.5, true).geography;
  const a = c.table.find((t) => t.segment === 'Seg A');
  assert.equal(a.candidates, 10); assert.deepEqual(a.top, { source: 'roster', count: 9 }); assert.deepEqual(a.flags, ['single source 90%']);
  const b = c.table.find((t) => t.segment === 'Seg B');
  assert.deepEqual(b.flags, [], 'an even split is not flagged');
  const d = c.table.find((t) => t.segment === 'Seg C');
  assert.equal(d.candidates, 0); assert.deepEqual(d.flags, ['no coverage']);
  assert.deepEqual(c.undeclared, ['Seg D']);
});

test('coverage: flag_empty_segments=false suppresses the empty flag; threshold is exclusive', () => {
  const c = coverage([{ name: 'a', segments: { geography: 'S' }, sources: ['r'] }, { name: 'b', segments: { geography: 'S' }, sources: ['p'] }],
    { geography: ['S', 'T'] }, 0.5, false).geography;
  assert.deepEqual(c.table[0].flags, [], '50% is not > 50%');
  assert.deepEqual(c.table[1].flags, []);
});

const thesis = {
  acquisition_thesis: {
    name: 'T',
    hard_filters: { geography: { include: ['S1', 'S2'] }, other: [{ name: 'Soft', condition: 'c', revisitable: true }] },
    scored_preferences: { criteria: [
      { name: 'A', weight: 50, scoring_guidance: { 100: 'a', 50: 'b', 0: 'c' } },
      { name: 'B', weight: 50, scoring_guidance: { 100: 'a', 50: 'b', 0: 'c' } } ] },
  },
  research_settings: { coverage: { report_by: ['geography'], single_source_threshold: 0.5, flag_empty_segments: true } },
  scoring_settings: { missing_data_policy: { mode: 'neutral' }, minimum_score_for_priority: 65 },
};

test('validate accepts a good thesis and reports specific errors on a bad one', () => {
  assert.deepEqual(validate(thesis).errors, []);
  const bad = structuredClone(thesis);
  bad.acquisition_thesis.scored_preferences.criteria[0].weight = -1;
  delete bad.acquisition_thesis.scored_preferences.criteria[1].scoring_guidance['0'];
  bad.acquisition_thesis.hard_filters.other[0].revisitable = 'yes';
  bad.research_settings.coverage.report_by = ['industry'];
  const { errors } = validate(bad);
  assert.equal(errors.length, 4, errors.join('\n'));
  assert.ok(errors.some((e) => /weight must be a positive/.test(e)));
  assert.ok(errors.some((e) => /anchors 100, 50 and 0/.test(e)));
  assert.ok(errors.some((e) => /revisitable must be true or false/.test(e)));
  assert.ok(errors.some((e) => /report_by "industry"/.test(e)));
});

test('validate warns, not errors, when weights do not sum to 100', () => {
  const t = structuredClone(thesis); t.acquisition_thesis.scored_preferences.criteria[0].weight = 30;
  const v = validate(t); assert.deepEqual(v.errors, []); assert.equal(v.warnings.length, 1);
});

test('execution mode validates, and defaults to standard', async () => {
  const { settings } = await import('../lib/thesis.mjs');
  const doc = (execution) => ({
    acquisition_thesis: { name: 'T', hard_filters: { geography: { include: ['S1'] } },
      scored_preferences: { criteria: [{ name: 'A', weight: 100, scoring_guidance: { 100: 'a', 50: 'b', 0: 'c' } }] } },
    research_settings: execution ? { execution } : {},
  });
  assert.deepEqual(validate(doc({ mode: 'fast' })).errors, []);
  assert.deepEqual(validate(doc({ mode: 'standard' })).errors, []);
  assert.match(validate(doc({ mode: 'parallel' })).errors[0], /execution.mode must be fast or standard/);
  assert.equal(settings(doc(null)).execution, 'standard');
  assert.equal(settings(doc({ mode: 'fast' })).execution, 'fast');
});

test('filterList and criteriaList derive from the thesis', () => {
  assert.deepEqual(filterList(thesis).map((f) => [f.name, f.revisitable]), [['geography', false], ['Soft', true]]);
  assert.deepEqual(criteriaList(thesis).map((c) => c.normalised), [50, 50]);
});

test('screen: end to end, counts, priority, ranking within bands only', () => {
  const j = { candidates: [
    { name: 'Top', segments: { geography: 'S1' }, sources: ['r'], filters: { geography: P, Soft: P }, scores: { A: { score: 90, confidence: 'high' }, B: { score: 80, confidence: 'high' } } },
    { name: 'Near', segments: { geography: 'S1' }, sources: ['r'], filters: { geography: P, Soft: F }, scores: { A: { score: 100, confidence: 'high' }, B: { score: 100, confidence: 'high' } } },
    { name: 'Low', segments: { geography: 'S2' }, sources: ['p'], filters: { geography: P, Soft: P }, scores: { A: { score: 40, confidence: 'low' }, B: { score: 40, confidence: 'low' } } },
    { name: 'Out', segments: { geography: 'S2' }, sources: ['p'], filters: { geography: F, Soft: P } },
  ] };
  const r = screen(thesis, j);
  assert.deepEqual(r.counts, { PASS: 2, 'NEAR MISS': 1, FAIL: 1 });
  assert.deepEqual(r.bands.PASS.map((c) => [c.name, c.scoring.total, c.priority]), [['Top', 85, true], ['Low', 40, false]]);
  assert.equal(r.bands['NEAR MISS'][0].name, 'Near');
  assert.equal(r.bands['NEAR MISS'][0].scoring.total, 100, 'near miss is scored');
  assert.equal(r.bands['NEAR MISS'][0].priority, false, 'but never priority');
  assert.equal(r.bands.FAIL[0].scoring, null, 'FAIL is not scored');
  assert.equal(r.coverage.geography.table[0].candidates, 2, 'FAIL candidates still count toward coverage');
  assert.throws(() => screen(thesis, { candidates: [j.candidates[0], j.candidates[0]] }), /duplicate candidate/);
});

test('caps: every violation is listed at once, and nothing is trimmed', () => {
  const long = (n) => 'x'.repeat(n);
  const c = { name: 'Verbose', segments: { geography: 'S1' }, sources: ['r'],
    filters: { geography: { outcome: 'pass', evidence: long(CAPS['filters.*.evidence'] + 1) }, Soft: P },
    scores: { A: { score: 50, confidence: 'high', why: long(CAPS['scores.*.why'] + 1) }, B: { score: 50, confidence: 'high', why: long(CAPS['scores.*.why']) } },
    findings: [{ question: 'custom', answer: 'ok', facts: [{ claim: long(300), url: 'u' }] }] };
  const v = checkShape(c);
  assert.deepEqual(v.map((x) => x.split(':')[0]), ['filters."geography".evidence', 'scores."A".why', 'findings[0].facts[0].claim'], 'all three, and the at-cap field passes');
  assert.throws(() => screen(thesis, { candidates: [c] }), (e) => e instanceof JudgmentsError && /3 field\(s\)/.test(e.message) && /"Verbose": scores."A".why: 161 chars, cap 160/.test(e.message));
  assert.equal(c.scores.A.why.length, CAPS['scores.*.why'] + 1, 'the input is untouched');
});

test('fast profile: findings only for custom questions; standard depth accepts all', () => {
  const opts = { depth: 'fast', standardQuestions: ['company_overview', 'ownership'] };
  const findings = [{ question: 'company_overview', answer: 'a' }, { question: 'Estimate the revenue mix.', answer: 'b' }, { question: 'ownership', answer: 'c' }];
  const v = checkShape({ name: 'X', findings }, opts);
  assert.equal(v.length, 1, 'one line per candidate, not one per finding');
  assert.match(v[0], /findings: 2 standard-question write-up\(s\) \(company_overview, ownership\)/);
  assert.deepEqual(checkShape({ name: 'X', findings }, { depth: 'standard', standardQuestions: opts.standardQuestions }), []);
  assert.deepEqual(checkShape({ name: 'X', findings }), [], 'default depth is standard');
});

test('universe truncation is computed and surfaced, not silently dropped', async () => {
  const { markdown } = await import('../lib/render.mjs');
  const j = { universe: { found: 30, carried_forward: 2, cap: 12 }, candidates: [
    { name: 'A', segments: { geography: 'S1' }, sources: ['r'], filters: { geography: P, Soft: P }, scores: { A: { score: 80, confidence: 'high' }, B: { score: 80, confidence: 'high' } } },
    { name: 'B', segments: { geography: 'S1' }, sources: ['r'], filters: { geography: P, Soft: P }, scores: { A: { score: 60, confidence: 'high' }, B: { score: 60, confidence: 'high' } } },
  ] };
  const r = screen(thesis, j);
  assert.deepEqual({ found: r.universe.found, carried: r.universe.carried_forward, truncated: r.universe.truncated }, { found: 30, carried: 2, truncated: 28 });
  const md = markdown(r);
  assert.ok(md.includes('Universe truncated'), 'truncation is stated in the brief');
  assert.ok(md.includes('not a random sample'), 'and says why it matters');
  assert.ok(md.indexOf('Universe truncated') < md.indexOf('## PASS'), 'above the results it qualifies');
});

test('no universe block, or no truncation, means no warning', async () => {
  const { markdown } = await import('../lib/render.mjs');
  const base = { candidates: [{ name: 'A', segments: { geography: 'S1' }, sources: ['r'], filters: { geography: P, Soft: P }, scores: { A: { score: 80, confidence: 'high' }, B: { score: 80, confidence: 'high' } } }] };
  assert.equal(screen(thesis, base).universe, null);
  assert.ok(!markdown(screen(thesis, base)).includes('Universe truncated'));
  const exact = screen(thesis, { ...base, universe: { found: 1, carried_forward: 1, cap: 12 } });
  assert.equal(exact.universe.truncated, 0);
  assert.ok(!markdown(exact).includes('Universe truncated'));
});

test('judgments load from a directory of per-candidate files', async () => {
  const { mkdtempSync, writeFileSync, mkdirSync } = await import('node:fs');
  const os = await import('node:os'); const path = await import('node:path');
  const { execFileSync } = await import('node:child_process');
  const dir = mkdtempSync(path.join(os.tmpdir(), 'wn-'));
  const cdir = path.join(dir, 'candidates'); mkdirSync(cdir);
  const tfile = path.join(dir, 't.yaml');
  writeFileSync(tfile, [
    'acquisition_thesis:', '  name: T',
    '  hard_filters:', '    geography: { include: [S1] }',
    '  scored_preferences:', '    criteria:', '      - name: A', '        weight: 100',
    '        scoring_guidance: { 100: a, 50: b, 0: c }',
    'research_settings:', '  coverage: { report_by: [geography] }', ''].join('\n'));
  writeFileSync(path.join(cdir, '_run.json'), JSON.stringify({ run_at: '2026-01-01T00:00:00Z', universe: { found: 9, carried_forward: 2 } }));
  for (const n of ['a', 'b']) writeFileSync(path.join(cdir, `${n}.json`), JSON.stringify({
    name: n.toUpperCase(), segments: { geography: 'S1' }, sources: ['r'],
    filters: { geography: { outcome: 'pass' } }, scores: { A: { score: 70, confidence: 'high' } } }));
  const out = execFileSync('node', [path.join(process.cwd(), 'winnow.mjs'), 'screen', tfile, cdir, '--format', 'json'], { encoding: 'utf8' });
  const r = JSON.parse(out);
  assert.deepEqual(r.counts, { PASS: 2, 'NEAR MISS': 0, FAIL: 0 }, 'both candidate files loaded');
  assert.equal(r.universe.found, 9, '_run.json supplies top-level fields');
  assert.equal(r.universe.truncated, 7);
});

test('confidence is weighted, and the weakest input is carried not hidden', () => {
  // One thin minor criterion must not drag a well-evidenced case to "low".
  const crit = [
    { name: 'Big', weight: 80, normalised: 80 },
    { name: 'Small', weight: 20, normalised: 20 },
  ];
  const r = scoreCompany({ Big: { score: 90, confidence: 'high' }, Small: { score: 50, confidence: 'low' } }, crit, 'neutral');
  assert.equal(r.confidence, 'high', 'weighted (3*80 + 1*20)/100 = 2.6, above the 2.5 threshold');
  assert.equal(r.lowestConfidence, 'low', 'and the thin criterion is still reported');
  // Under the old lowest-wins rule this company read "low" on the strength of
  // a weight-20 input, which is what this change exists to fix.
});

test('weighted confidence thresholds', () => {
  const one = (c) => scoreCompany({ A: { score: 50, confidence: c } }, [{ name: 'A', weight: 100, normalised: 100 }], 'neutral');
  assert.equal(one('high').confidence, 'high');
  assert.equal(one('medium').confidence, 'medium');
  assert.equal(one('low').confidence, 'low');
  const mixed = scoreCompany(
    { A: { score: 50, confidence: 'high' }, B: { score: 50, confidence: 'low' } },
    [{ name: 'A', weight: 50, normalised: 50 }, { name: 'B', weight: 50, normalised: 50 }], 'neutral');
  assert.equal(mixed.confidence, 'medium', '(3+1)/2 = 2.0 -> medium');
  assert.equal(mixed.lowestConfidence, 'low', 'weakest input still reported');
});
