// Load and validate a thesis, and derive the flat structures the engine needs.
import { readFileSync } from 'node:fs';
import { parse } from './yaml.mjs';

export class ThesisError extends Error {}

const IMPORTANCE = new Set(['high', 'medium', 'low']);
const MISSING_MODES = new Set(['neutral', 'penalize', 'exclude']);
const DEPTHS = new Set(['fast', 'standard', 'deep']);
const EXECUTIONS = new Set(['fast', 'standard']);
const GROUP_FILTERS = ['industry', 'geography', 'ownership', 'business_model'];
const SIZE_KEYS = ['revenue', 'ebitda', 'employees', 'locations'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStrList = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');

export function loadThesis(file) {
  let doc;
  try { doc = parse(readFileSync(file, 'utf8')); }
  catch (e) { throw new ThesisError(`${file}: ${e.message}`); }
  const { errors, warnings } = validate(doc);
  if (errors.length) throw new ThesisError(`${file}:\n  - ${errors.join('\n  - ')}`);
  return { thesis: doc, warnings };
}

/** Structural validation. Returns { errors, warnings }; errors are fatal. */
export function validate(doc) {
  const errors = [], warnings = [];
  const err = (m) => errors.push(m);
  if (!isObj(doc)) return { errors: ['thesis must be a mapping'], warnings };
  const at = doc.acquisition_thesis;
  if (!isObj(at)) { err('acquisition_thesis is required'); return { errors, warnings }; }
  if (typeof at.name !== 'string' || !at.name.trim()) err('acquisition_thesis.name is required');

  // hard filters
  const hf = at.hard_filters;
  if (!isObj(hf)) err('hard_filters is required');
  else {
    for (const g of GROUP_FILTERS) {
      const v = hf[g];
      if (v === undefined) continue;
      if (!isObj(v)) { err(`hard_filters.${g} must be a mapping`); continue; }
      const keys = g === 'business_model' ? ['required_characteristics', 'excluded_characteristics'] : ['include', 'exclude'];
      for (const k of keys) if (v[k] !== undefined && v[k] !== null && !isStrList(v[k])) err(`hard_filters.${g}.${k} must be a list of strings`);
      if (v.revisitable !== undefined && typeof v.revisitable !== 'boolean') err(`hard_filters.${g}.revisitable must be true or false`);
    }
    if (hf.size !== undefined) {
      if (!isObj(hf.size)) err('hard_filters.size must be a mapping');
      else for (const k of Object.keys(hf.size)) {
        if (!SIZE_KEYS.includes(k)) { err(`hard_filters.size.${k}: unknown size key`); continue; }
        const r = hf.size[k];
        if (!isObj(r)) { err(`hard_filters.size.${k} must be a mapping with min/max`); continue; }
        for (const b of ['min', 'max']) if (r[b] !== undefined && r[b] !== null && typeof r[b] !== 'number') err(`hard_filters.size.${k}.${b} must be a number`);
      }
    }
    if (hf.other !== undefined) {
      if (!Array.isArray(hf.other)) err('hard_filters.other must be a list');
      else hf.other.forEach((o, i) => {
        if (!isObj(o)) return err(`hard_filters.other[${i}] must be a mapping`);
        if (typeof o.name !== 'string' || !o.name.trim()) err(`hard_filters.other[${i}].name is required`);
        if (typeof o.condition !== 'string' || !o.condition.trim()) err(`hard_filters.other[${i}].condition is required`);
        if (o.revisitable !== undefined && typeof o.revisitable !== 'boolean') err(`hard_filters.other[${i}].revisitable must be true or false`);
      });
    }
  }

  // scored preferences
  const sp = at.scored_preferences;
  if (!isObj(sp) || !Array.isArray(sp.criteria) || sp.criteria.length === 0) err('scored_preferences.criteria must be a non-empty list');
  else {
    const names = new Set();
    let sum = 0;
    sp.criteria.forEach((c, i) => {
      if (!isObj(c)) return err(`scored_preferences.criteria[${i}] must be a mapping`);
      if (typeof c.name !== 'string' || !c.name.trim()) err(`criteria[${i}].name is required`);
      else if (names.has(c.name)) err(`criteria: duplicate name "${c.name}"`); else names.add(c.name);
      if (typeof c.weight !== 'number' || !(c.weight > 0)) err(`criteria[${i}] "${c.name}": weight must be a positive number`);
      else sum += c.weight;
      if (!isObj(c.scoring_guidance)) err(`criteria[${i}] "${c.name}": scoring_guidance is required`);
      else for (const a of ['100', '50', '0']) if (typeof c.scoring_guidance[a] !== 'string') err(`criteria[${i}] "${c.name}": scoring_guidance needs anchors 100, 50 and 0`);
    });
    if (sum && Math.abs(sum - 100) > 1e-9) warnings.push(`scored_preferences weights sum to ${sum}, not 100 (they are normalised, but 100 reads better)`);
  }

  // research questions
  const rq = at.research_questions;
  if (rq !== undefined) {
    if (!isObj(rq)) err('research_questions must be a mapping');
    else {
      if (rq.standard !== undefined && rq.standard !== null && !isStrList(rq.standard)) err('research_questions.standard must be a list of strings');
      if (rq.custom !== undefined && rq.custom !== null) {
        if (!Array.isArray(rq.custom)) err('research_questions.custom must be a list');
        else rq.custom.forEach((q, i) => {
          if (!isObj(q) || typeof q.question !== 'string') return err(`research_questions.custom[${i}].question is required`);
          if (q.importance !== undefined && !IMPORTANCE.has(q.importance)) err(`research_questions.custom[${i}].importance must be high, medium or low`);
        });
      }
    }
  }

  // settings
  const rs = doc.research_settings ?? {};
  if (!isObj(rs)) err('research_settings must be a mapping');
  else {
    const mode = rs.research_depth?.mode;
    if (mode !== undefined && !DEPTHS.has(mode)) err('research_settings.research_depth.mode must be fast, standard or deep');
    const ex = rs.execution?.mode;
    if (ex !== undefined && !EXECUTIONS.has(ex)) err('research_settings.execution.mode must be fast or standard');
    const cov = rs.coverage;
    if (cov !== undefined) {
      if (!isObj(cov)) err('research_settings.coverage must be a mapping');
      else {
        if (cov.report_by !== undefined && !isStrList(cov.report_by)) err('coverage.report_by must be a list of strings');
        else for (const d of cov.report_by ?? []) {
          const inc = hf?.[d]?.include;
          if (!isStrList(inc) || inc.length === 0) err(`coverage.report_by "${d}": hard_filters.${d}.include must list the segments to report on`);
        }
        const th = cov.single_source_threshold;
        if (th !== undefined && !(typeof th === 'number' && th > 0 && th <= 1)) err('coverage.single_source_threshold must be a number in (0, 1]');
        if (cov.flag_empty_segments !== undefined && typeof cov.flag_empty_segments !== 'boolean') err('coverage.flag_empty_segments must be true or false');
      }
    }
  }
  const ss = doc.scoring_settings ?? {};
  if (!isObj(ss)) err('scoring_settings must be a mapping');
  else {
    const m = ss.missing_data_policy?.mode;
    if (m !== undefined && !MISSING_MODES.has(m)) err('scoring_settings.missing_data_policy.mode must be neutral, penalize or exclude');
    const p = ss.minimum_score_for_priority;
    if (p !== undefined && p !== null && typeof p !== 'number') err('scoring_settings.minimum_score_for_priority must be a number');
  }
  return { errors, warnings };
}

/** Flatten hard filters to a named list with revisitable flags. */
export function filterList(thesis) {
  const hf = thesis.acquisition_thesis.hard_filters ?? {};
  const out = [];
  for (const g of GROUP_FILTERS) if (hf[g]) out.push({ name: g, revisitable: hf[g].revisitable === true });
  for (const k of Object.keys(hf.size ?? {})) out.push({ name: `size.${k}`, revisitable: hf.size[k].revisitable === true });
  for (const o of hf.other ?? []) out.push({ name: o.name, revisitable: o.revisitable === true, condition: o.condition });
  return out;
}

/** Criteria with weights normalised to sum to 100. */
export function criteriaList(thesis) {
  const cs = thesis.acquisition_thesis.scored_preferences.criteria;
  const sum = cs.reduce((a, c) => a + c.weight, 0);
  return cs.map((c) => ({ name: c.name, weight: c.weight, normalised: (c.weight / sum) * 100 }));
}

export function settings(thesis) {
  const rs = thesis.research_settings ?? {}, ss = thesis.scoring_settings ?? {}, out = thesis.output ?? {};
  return {
    depth: rs.research_depth?.mode ?? 'standard',
    limits: {
      initialUniverse: rs.target_limits?.initial_universe ?? null,
      deepResearchLimit: rs.target_limits?.deep_research_limit ?? null,
    },
    execution: rs.execution?.mode ?? 'standard',
    standardQuestions: thesis.acquisition_thesis.research_questions?.standard ?? [],
    missingMode: ss.missing_data_policy?.mode ?? 'neutral',
    priorityMin: ss.minimum_score_for_priority ?? null,
    coverage: {
      reportBy: rs.coverage?.report_by ?? [],
      threshold: rs.coverage?.single_source_threshold ?? 0.5,
      flagEmpty: rs.coverage?.flag_empty_segments ?? true,
    },
    declaredSegments: Object.fromEntries((rs.coverage?.report_by ?? []).map((d) => [d, thesis.acquisition_thesis.hard_filters[d].include])),
    output: {
      coverage: out.show_coverage_report ?? true,
      nearMiss: out.show_near_miss_band ?? true,
      failures: out.show_filter_failures ?? true,
      breakdown: out.show_score_breakdown ?? true,
      confidence: out.show_confidence ?? true,
      citations: out.show_citations ?? true,
      briefs: out.target_briefs ?? true,
      formats: out.export?.formats ?? ['csv', 'json'],
    },
  };
}
