// Unit tests for the output renderers in ../lib/render.mjs. One screened
// result is built once from a small thesis, then rendered three ways: CSV
// (quoting of commas, quotes and embedded newlines, header/row agreement),
// Markdown (counts first, coverage before the ranked table) and JSON (round
// trips, and internal settings stay out of the payload).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csv, markdown, json } from '../lib/render.mjs';
import { screen } from '../lib/screen.mjs';

const thesis = {
  acquisition_thesis: {
    name: 'T, "quoted"',
    hard_filters: { geography: { include: ['S1'] }, other: [{ name: 'Soft', condition: 'c', revisitable: true }] },
    scored_preferences: { criteria: [{ name: 'A', weight: 100, scoring_guidance: { 100: 'a', 50: 'b', 0: 'c' } }] },
  },
  research_settings: { coverage: { report_by: ['geography'] } },
  scoring_settings: { minimum_score_for_priority: 65 },
};
const result = screen(thesis, { run_at: '2026-01-01T00:00:00Z', candidates: [
  { name: 'Acme, Inc.', url: 'https://a.example', location: 'X', segments: { geography: 'S1' }, sources: ['r'],
    filters: { geography: { outcome: 'pass' }, Soft: { outcome: 'pass' } },
    scores: { A: { score: 90, confidence: 'high', why: 'line one\nline two' } } },
  { name: 'Near Co', segments: { geography: 'S1' }, sources: ['r'],
    filters: { geography: { outcome: 'pass' }, Soft: { outcome: 'fail', what_would_settle_it: 'a B2B division' } },
    scores: { A: { score: 95, confidence: 'high' } } },
  { name: 'Gone', segments: { geography: 'S1' }, sources: ['r'], filters: { geography: { outcome: 'fail', evidence: 'HQ elsewhere' }, Soft: { outcome: 'pass' } } },
] });

test('csv quotes commas, quotes and newlines; header matches rows', () => {
  const lines = csv(result).trimEnd().split('\n');
  assert.equal(lines.length, 4);
  const cols = lines[0].split(',').length;
  assert.ok(lines[1].includes('"Acme, Inc."'));
  assert.ok(lines[1].includes('"T, ""quoted"""'));
  // FAIL row has empty score cells but the same column count
  const parse = (l) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).filter((x) => x !== '').length;
  for (const l of lines) assert.equal(parse(l), cols, l);
});

test('markdown leads with counts and puts coverage before the ranked table', () => {
  const md = markdown(result);
  assert.match(md.split('\n')[0], /^\*\*1 pass · 1 near miss · 1 fail\*\*/);
  assert.ok(md.indexOf('## Coverage') < md.indexOf('## PASS'));
  assert.ok(md.includes('★ [Acme, Inc.]'), 'priority star on a qualifying PASS');
  assert.ok(md.includes('| [Near Co]') === false && md.includes('| Near Co |'), 'no link when no url');
  assert.ok(md.includes('a B2B division'), 'near-miss row says what would settle it');
  assert.ok(md.includes('HQ elsewhere'), 'fail row carries evidence');
  assert.ok(md.includes('_none recorded_'), 'open questions section never omitted');
});

test('json omits internal settings and round-trips', () => {
  const j = JSON.parse(json(result));
  assert.equal(j.settings, undefined);
  assert.deepEqual(j.counts, { PASS: 1, 'NEAR MISS': 1, FAIL: 1 });
  assert.deepEqual(j.criteria, [{ name: 'A', weight: 100 }]);
});
