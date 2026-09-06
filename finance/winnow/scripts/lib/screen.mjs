// The deterministic core: bands, scoring, ranking, coverage.
// Input is a judgments document produced by the model (see
// skills/screen-target/references/judgments-format.md). Nothing here
// exercises judgment; it only combines judgments the model already made.
import { filterList, criteriaList, settings } from './thesis.mjs';

export const BANDS = ['PASS', 'NEAR MISS', 'FAIL'];
const CONF_RANK = { high: 3, medium: 2, low: 1 };
const OUTCOMES = new Set(['pass', 'fail', 'unresolved']);

export class JudgmentsError extends Error {}

/**
 * Length caps on the prose fields, in characters. These bound the model's
 * output: a `why` is one clause and an `evidence` is one line, and measured
 * model output that ran past these was restating the same sentence in three
 * places. A file over a cap is refused, never trimmed -- the model shortens
 * the field and re-runs, so nothing is ever cut mid-sentence by the script.
 */
export const CAPS = {
  'filters.*.evidence': 240,
  'filters.*.what_would_settle_it': 240,
  'scores.*.why': 160,
  'findings[].answer': 300,
  'findings[].facts[].claim': 240,
  'findings[].inferences[].claim': 240,
  'findings[].inferences[].basis': 240,
  'open_questions[].question': 240,
  'open_questions[].what_would_settle_it': 240,
};

/**
 * Every cap or profile violation in one candidate, as strings. All of them
 * are reported together so one edit round fixes the file.
 *
 * Profile: at research depth `fast`, findings are written only for the
 * thesis's custom questions. The standard questions are still researched --
 * they inform the filter and score judgments -- but are not written up
 * individually, which is most of a candidate file's bulk.
 */
export function checkShape(c, { depth = 'standard', standardQuestions = [] } = {}) {
  const out = [];
  const cap = (key, value, where) => {
    if (typeof value === 'string' && value.length > CAPS[key]) out.push(`${where}: ${value.length} chars, cap ${CAPS[key]}`);
  };
  for (const [name, f] of Object.entries(c.filters ?? {})) {
    cap('filters.*.evidence', f?.evidence, `filters."${name}".evidence`);
    cap('filters.*.what_would_settle_it', f?.what_would_settle_it, `filters."${name}".what_would_settle_it`);
  }
  for (const [name, s] of Object.entries(c.scores ?? {})) cap('scores.*.why', s?.why, `scores."${name}".why`);
  const std = new Set(standardQuestions);
  const stdWritten = (c.findings ?? []).map((f) => f?.question).filter((q) => std.has(q));
  if (depth === 'fast' && stdWritten.length) out.push(`findings: ${stdWritten.length} standard-question write-up(s) (${stdWritten.join(', ')}) — at research depth fast, write findings only for custom questions`);
  (c.findings ?? []).forEach((f, i) => {
    cap('findings[].answer', f?.answer, `findings[${i}].answer`);
    (f?.facts ?? []).forEach((x, j) => cap('findings[].facts[].claim', x?.claim, `findings[${i}].facts[${j}].claim`));
    (f?.inferences ?? []).forEach((x, j) => {
      cap('findings[].inferences[].claim', x?.claim, `findings[${i}].inferences[${j}].claim`);
      cap('findings[].inferences[].basis', x?.basis, `findings[${i}].inferences[${j}].basis`);
    });
  });
  (c.open_questions ?? []).forEach((q, i) => {
    cap('open_questions[].question', q?.question, `open_questions[${i}].question`);
    cap('open_questions[].what_would_settle_it', q?.what_would_settle_it, `open_questions[${i}].what_would_settle_it`);
  });
  return out;
}

/**
 * Band from per-filter outcomes.
 *   any firm fail                      -> FAIL
 *   any revisitable fail or unresolved -> NEAR MISS  (unresolved -> FAIL when missingMode === 'exclude')
 *   otherwise                          -> PASS
 * Returns { band, reasons: [{filter, outcome, revisitable}] }.
 */
export function assignBand(filterOutcomes, filters, missingMode) {
  const reasons = [];
  let firmFail = false, soft = false;
  for (const f of filters) {
    const o = filterOutcomes[f.name];
    if (!o) throw new JudgmentsError(`missing outcome for filter "${f.name}"`);
    if (!OUTCOMES.has(o.outcome)) throw new JudgmentsError(`filter "${f.name}": outcome must be pass, fail or unresolved`);
    if (o.outcome === 'pass') continue;
    reasons.push({ filter: f.name, outcome: o.outcome, revisitable: f.revisitable, evidence: o.evidence ?? '', url: o.url ?? '', settle: o.what_would_settle_it ?? '' });
    if (o.outcome === 'fail' && !f.revisitable) firmFail = true;
    else if (o.outcome === 'unresolved' && missingMode === 'exclude') firmFail = true;
    else soft = true;
  }
  return { band: firmFail ? 'FAIL' : soft ? 'NEAR MISS' : 'PASS', reasons };
}

/**
 * Weighted score. Missing (null) criterion scores follow missingMode:
 *   neutral  -> 50, flagged, confidence low
 *   penalize -> 0, flagged
 *   exclude  -> company marked excluded; still scored (neutral) for display
 */
export function scoreCompany(scores, criteria, missingMode) {
  const rows = [];
  let total = 0, excluded = false, lowest = 3;
  for (const c of criteria) {
    const s = scores[c.name];
    let value, confidence, policy = null, why = s?.why ?? '', url = s?.url ?? '';
    if (!s || s.score === null || s.score === undefined) {
      policy = missingMode;
      if (missingMode === 'exclude') excluded = true;
      value = missingMode === 'penalize' ? 0 : 50;
      confidence = 'low';
    } else {
      if (typeof s.score !== 'number' || s.score < 0 || s.score > 100) throw new JudgmentsError(`criterion "${c.name}": score must be 0-100 or null`);
      value = s.score;
      confidence = s.confidence ?? 'low';
      if (!(confidence in CONF_RANK)) throw new JudgmentsError(`criterion "${c.name}": confidence must be high, medium or low`);
    }
    lowest = Math.min(lowest, CONF_RANK[confidence]);
    const contribution = (value * c.normalised) / 100;
    total += contribution;
    rows.push({ criterion: c.name, score: value, weight: c.weight, normalised: c.normalised, contribution, confidence, policy, why, url });
  }
  // Headline confidence is weighted by the same weights that produced the
  // score, so a thin minor criterion cannot mask a well-evidenced case. The
  // lowest is carried alongside it, never replaced by it -- a strong average
  // hiding one weak input is exactly what a reader needs to see.
  const weighted = rows.reduce((a, r) => a + CONF_RANK[r.confidence] * r.normalised, 0) / 100;
  const confidence = weighted >= 2.5 ? 'high' : weighted >= 1.5 ? 'medium' : 'low';
  const lowestConfidence = Object.keys(CONF_RANK).find((k) => CONF_RANK[k] === lowest) ?? 'low';
  return { total: Math.round(total), rows, confidence, lowestConfidence, excluded };
}

/** Sort within a band: score desc, confidence desc, a "scale" criterion desc, then name. */
export function rank(companies) {
  const scaleOf = (c) => c.scoring?.rows.find((r) => /scale/i.test(r.criterion))?.score ?? -1;
  return [...companies].sort((a, b) =>
    (b.scoring?.total ?? -1) - (a.scoring?.total ?? -1) ||
    (CONF_RANK[b.scoring?.confidence] ?? 0) - (CONF_RANK[a.scoring?.confidence] ?? 0) ||
    scaleOf(b) - scaleOf(a) ||
    a.name.localeCompare(b.name));
}

/**
 * Coverage per declared segment: candidate count, per-source counts, flags.
 * Every candidate counts (FAIL included) -- coverage is about what was found.
 */
export function coverage(candidates, declaredSegments, threshold, flagEmpty) {
  const out = {};
  for (const [dim, segs] of Object.entries(declaredSegments)) {
    const table = [];
    for (const seg of segs) {
      const inSeg = candidates.filter((c) => (c.segments?.[dim] ?? '') === seg);
      const bySource = {};
      for (const c of inSeg) {
        const srcs = Array.isArray(c.sources) && c.sources.length ? c.sources : ['(unattributed)'];
        for (const s of srcs) bySource[s] = (bySource[s] ?? 0) + 1;
      }
      const sorted = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
      const top = sorted[0] ?? null;
      const flags = [];
      if (inSeg.length === 0) { if (flagEmpty) flags.push('no coverage'); }
      else if (top && top[1] / inSeg.length > threshold && sorted.length >= 1) flags.push(`single source ${Math.round((top[1] / inSeg.length) * 100)}%`);
      table.push({ segment: seg, candidates: inSeg.length, sources: sorted.length, top: top ? { source: top[0], count: top[1] } : null, flags });
    }
    const undeclared = [...new Set(candidates.map((c) => c.segments?.[dim]).filter((s) => s && !segs.includes(s)))];
    out[dim] = { table, undeclared };
  }
  return out;
}

/** Run the whole engine over a judgments document. */
export function screen(thesis, judgments) {
  if (!judgments || !Array.isArray(judgments.candidates)) throw new JudgmentsError('judgments.candidates must be a list');
  const filters = filterList(thesis), criteria = criteriaList(thesis), cfg = settings(thesis);
  const seen = new Set();
  // Shape first, across every candidate, so the error names all of it at once.
  const shape = [];
  judgments.candidates.forEach((c, i) => {
    if (!c || typeof c.name !== 'string' || !c.name.trim()) throw new JudgmentsError(`candidates[${i}].name is required`);
    for (const v of checkShape(c, cfg)) shape.push(`"${c.name}": ${v}`);
  });
  if (shape.length) throw new JudgmentsError(`${shape.length} field(s) over cap or outside the profile — shorten, never trim by hand:\n  - ${shape.join('\n  - ')}`);
  const companies = judgments.candidates.map((c) => {
    if (seen.has(c.name.toLowerCase())) throw new JudgmentsError(`duplicate candidate "${c.name}"`);
    seen.add(c.name.toLowerCase());
    const { band, reasons } = assignBand(c.filters ?? {}, filters, cfg.missingMode);
    const scoring = band === 'FAIL' ? null : scoreCompany(c.scores ?? {}, criteria, cfg.missingMode);
    const priority = band === 'PASS' && scoring && !scoring.excluded && cfg.priorityMin !== null && scoring.total >= cfg.priorityMin;
    return { name: c.name, url: c.url ?? '', location: c.location ?? '', segments: c.segments ?? {}, sources: c.sources ?? [],
      band, reasons, scoring, priority, findings: c.findings ?? [], open_questions: c.open_questions ?? [] };
  });
  const bands = Object.fromEntries(BANDS.map((b) => [b, rank(companies.filter((c) => c.band === b))]));
  const counts = Object.fromEntries(BANDS.map((b) => [b, bands[b].length]));
  const u = judgments.universe ?? null;
  const universe = u ? {
    found: u.found ?? null,
    carried_forward: u.carried_forward ?? companies.length,
    truncated: u.found != null && u.carried_forward != null ? Math.max(0, u.found - u.carried_forward) : 0,
    cap: u.cap ?? null,
    note: u.note ?? '',
  } : null;
  return {
    thesis: thesis.acquisition_thesis.name,
    run_at: judgments.run_at ?? new Date().toISOString(),
    universe,
    counts, bands,
    coverage: coverage(companies, cfg.declaredSegments, cfg.coverage.threshold, cfg.coverage.flagEmpty),
    filters, criteria, settings: cfg,
  };
}
