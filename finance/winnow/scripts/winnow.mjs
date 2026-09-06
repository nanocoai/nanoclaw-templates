#!/usr/bin/env node
// winnow -- the deterministic half of the screening pipeline.
//
//   node winnow.mjs init-run     <thesis.yaml> --data <PLUGIN_DATA>
//   node winnow.mjs set-universe <run-dir> --from universe.json       (the script applies caps and writes stubs)
//   node winnow.mjs set-universe <run-dir> --found N --carried M [--cap C]
//   node winnow.mjs status       <run-dir>
//   node winnow.mjs validate     <thesis.yaml>
//   node winnow.mjs screen   <thesis.yaml> <judgments.json|dir/> [--out <dir>] [--format md|csv|json]
//
// The judgments argument may be a single file, or a DIRECTORY of per-candidate
// files written as research completes (plus an optional _run.json for
// top-level fields). The directory form keeps evidence out of the agent's
// context, so a long run survives compaction.
//
// The model produces judgments (filter outcomes, criterion scores, evidence).
// This script does everything that follows: bands, weighted scores, ranking,
// coverage, priority flags, and rendering. It never exercises judgment.
import { readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { loadThesis, filterList, settings, ThesisError } from './lib/thesis.mjs';
import { initRun, setUniverse, applyUniverse, runStatus, checkRun, shadowWarning, RunError } from './lib/run.mjs';
import { screen, JudgmentsError } from './lib/screen.mjs';
import { markdown, csv, json } from './lib/render.mjs';

const argv = process.argv.slice(2);
const cmd = argv[0];
const opt = (name) => { const i = argv.indexOf(name); return i === -1 ? null : argv[i + 1]; };
const positional = argv.slice(1).filter((a, i, arr) => !a.startsWith('--') && !(i > 0 && arr[i - 1].startsWith('--')));

/**
 * Judgments come from either one file, or a directory of per-candidate files
 * written incrementally during research. The directory form keeps evidence on
 * disk instead of in the agent's context, which is what makes a long run
 * survivable: nothing is lost to a context compaction, and a crashed run
 * resumes from what is already written.
 *
 * In a directory, `_run.json` (optional) supplies top-level fields such as
 * `run_at` and `universe`; every other *.json is one candidate.
 */
function loadJudgments(target) {
  if (!statSync(target).isDirectory()) return JSON.parse(readFileSync(target, 'utf8'));
  const files = readdirSync(target).filter((f) => f.endsWith('.json')).sort();
  let head = {};
  const candidates = [];
  for (const f of files) {
    const doc = JSON.parse(readFileSync(path.join(target, f), 'utf8'));
    if (f === '_run.json') { head = doc; continue; }
    // A per-candidate file is one candidate; a bundle is {candidates:[...]}.
    if (Array.isArray(doc.candidates)) candidates.push(...doc.candidates);
    else candidates.push(doc);
  }
  if (candidates.length === 0) throw new Error(`no candidate files in ${target}`);
  return { ...head, candidates };
}

function die(msg, code = 2) { process.stderr.write(msg.endsWith('\n') ? msg : msg + '\n'); process.exit(code); }

try {
  if (cmd === 'validate') {
    const file = positional[0] ?? die('usage: winnow validate <thesis.yaml>');
    const { thesis, warnings } = loadThesis(file);
    for (const w of warnings) process.stderr.write(`warning: ${w}\n`);
    const at = thesis.acquisition_thesis;
    process.stdout.write(`OK: "${at.name}" — ${at.scored_preferences.criteria.length} criteria, ${(at.hard_filters?.other ?? []).filter((o) => o.revisitable).length} revisitable filter(s)\n`);
  } else if (cmd === 'screen') {
    const [tf, jf] = positional;
    if (!tf || !jf) die('usage: winnow screen <thesis.yaml> <judgments.json|dir/> [--out <dir>] [--format md|csv|json]');
    const { thesis, warnings } = loadThesis(tf);
    for (const w of warnings) process.stderr.write(`warning: ${w}\n`);
    // Deterministic gate: the thesis must not have changed under the evidence,
    // and the evidence must be as complete as the universe stage said it was.
    let runWarnings = [];
    try {
      if (statSync(jf).isDirectory()) runWarnings = checkRun(jf, tf, { force: argv.includes('--force') });
    } catch (e) {
      if (e instanceof RunError) die(`run not screenable — ${e.message}`, 5);
      throw e;
    }
    for (const w of runWarnings) process.stderr.write(`warning: ${w}\n`);
    let judgments;
    try { judgments = loadJudgments(jf); } catch (e) { die(`${jf}: ${e.message}`); }
    const result = screen(thesis, judgments);
    const out = opt('--out');
    if (out) {
      mkdirSync(out, { recursive: true });
      const fmts = result.settings.output.formats;
      writeFileSync(path.join(out, 'brief.md'), markdown(result));
      if (fmts.includes('csv')) writeFileSync(path.join(out, 'screen.csv'), csv(result));
      if (fmts.includes('json')) writeFileSync(path.join(out, 'screen.json'), json(result));
      process.stdout.write(`${result.counts.PASS} pass · ${result.counts['NEAR MISS']} near miss · ${result.counts.FAIL} fail  →  ${out}/\n`);
    } else {
      const f = opt('--format') ?? 'md';
      process.stdout.write(f === 'csv' ? csv(result) : f === 'json' ? json(result) : markdown(result));
    }
  } else if (cmd === 'init-run') {
    const tf = positional[0] ?? die('usage: winnow init-run <thesis.yaml> --data <PLUGIN_DATA>');
    const data = opt('--data') ?? die('init-run needs --data <PLUGIN_DATA>');
    loadThesis(tf); // refuse to open a run against a thesis that does not validate
    const shadow = shadowWarning(tf, opt('--plugin-root') ?? process.env.PLUGIN_ROOT);
    if (shadow) process.stderr.write(`warning: ${shadow}\n`);
    const { dir, candidates } = initRun(tf, data);
    process.stdout.write(
      `run: ${dir}\ncandidates: ${candidates}\n\n` +
      `Write one JSON file per candidate into the candidates directory as you finish it.\n` +
      `Then: winnow set-universe ${candidates} --found <n> --carried <n>\n` +
      `Then: winnow screen ${tf} ${candidates} --out ${dir}\n`);
  } else if (cmd === 'set-universe' && opt('--from')) {
    const dir = positional[0] ?? die('usage: winnow set-universe <candidates-dir> --from <universe.json>');
    const meta = JSON.parse(readFileSync(path.join(dir, '_run.json'), 'utf8'));
    const { thesis } = loadThesis(meta.thesis);
    const cfg = settings(thesis);
    const r = applyUniverse(dir, opt('--from'), thesis, { filters: filterList(thesis), declaredSegments: cfg.declaredSegments, limits: cfg.limits });
    process.stdout.write(`universe: ${r.found} found · ${r.fails.length} dropped by firm filters · ${r.carried.length} carried · ${r.research.length} to research · ${r.uncarried.length} past the cap\n`);
    if (r.fails.length) process.stdout.write(`dropped: ${r.fails.map((x) => `${x.name} (${x.fail.filter})`).join('; ')}\n`);
    process.stdout.write(`\nResearch these ${r.research.length}, one subagent each, at most four at a time. Each writes exactly the file named:\n`);
    for (const c of r.research) process.stdout.write(`- ${c.name} | ${c.url} | ${c.location} | ${c.segment} | ${c.source} | ${c.note}\n  → ${c.file}\n`);
    process.stdout.write(`\nThen: winnow screen ${meta.thesis} ${dir} --out ${path.dirname(dir)}\n`);
  } else if (cmd === 'set-universe') {
    const dir = positional[0] ?? die('usage: winnow set-universe <candidates-dir> --found N --carried M');
    const int = (v) => (v === null || v === undefined ? undefined : Number.parseInt(v, 10));
    const u = setUniverse(dir, { found: int(opt('--found')), carried: int(opt('--carried')), cap: int(opt('--cap')), note: opt('--note') });
    process.stdout.write(`universe recorded: ${u.carried_forward} carried forward` +
      (u.found != null ? ` of ${u.found} found` : '') + '\n');
  } else if (cmd === 'status') {
    const dir = positional[0] ?? die('usage: winnow status <candidates-dir>');
    const st = runStatus(dir);
    process.stdout.write(
      `thesis:     ${st.meta.thesis ?? '(unknown)'}\n` +
      `started:    ${st.meta.started_at ?? '(unknown)'}` + (st.ageHours != null ? `  (${Math.round(st.ageHours)}h ago)` : '') + '\n' +
      `written:    ${st.written}${st.expected !== null ? ` of ${st.expected} carried forward` : ' (universe not recorded yet)'}\n` +
      (st.files.length ? `files:      ${st.files.join(', ')}\n` : ''));
    if (st.expected !== null && st.written < st.expected) {
      process.stdout.write(`\nincomplete: ${st.expected - st.written} candidate(s) still to research.\n`);
    }
  } else {
    die('usage:\n' +
        '  winnow init-run     <thesis.yaml> --data <PLUGIN_DATA>\n' +
        '  winnow set-universe <candidates-dir> --found N --carried M [--cap C] [--note ...]\n' +
        '  winnow status       <candidates-dir>\n' +
        '  winnow validate     <thesis.yaml>\n' +
        '  winnow screen       <thesis.yaml> <judgments.json|dir/> [--out <dir>] [--format md|csv|json] [--force]');
  }
} catch (e) {
  if (e instanceof ThesisError) die(`thesis invalid — ${e.message}`, 3);
  if (e instanceof JudgmentsError) die(`judgments invalid — ${e.message}`, 4);
  if (e instanceof RunError) die(`run error — ${e.message}`, 5);
  throw e;
}
