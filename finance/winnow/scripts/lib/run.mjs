// Run lifecycle. The script owns it, so nothing about a run is invented by
// the agent: not the directory, not the timestamp, not whether the evidence
// on disk actually matches the universe it came from.
//
// _run.json records the thesis and its fingerprint at init. If the thesis
// changes mid-run, the evidence was gathered against a different screen and
// the run is refused rather than silently mixed.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';

export class RunError extends Error {}

export const fingerprint = (file) =>
  createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16);

/**
 * A thesis under PLUGIN_DATA can shadow a shipped one of the same name. That
 * copy is not updated when the template is, so a run can silently use an old
 * screen. Detect it and report; never guess which the user meant.
 */
export function shadowWarning(thesisFile, pluginRoot) {
  if (!pluginRoot) return null;
  const shipped = path.join(pluginRoot, 'theses', path.basename(thesisFile));
  if (path.resolve(shipped) === path.resolve(thesisFile)) return null;
  if (!existsSync(shipped)) return null;
  if (fingerprint(shipped) === fingerprint(thesisFile)) return null;
  return `this thesis shadows a shipped one that differs: ${shipped}\n` +
         `  The copy under plugin-data is not updated when the template is. Re-copy it to\n` +
         `  pick up template changes, or run the shipped thesis directly if you have not edited it.`;
}

/** Create a run directory and return its absolute path. */
export function initRun(thesisFile, rootDir) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.resolve(rootDir, 'runs', stamp);
  const candidates = path.join(dir, 'candidates');
  mkdirSync(candidates, { recursive: true });
  const meta = {
    thesis: path.resolve(thesisFile),
    thesis_sha: fingerprint(thesisFile),
    started_at: new Date().toISOString(),
    universe: null,
  };
  writeFileSync(path.join(candidates, '_run.json'), JSON.stringify(meta, null, 2) + '\n');
  return { dir, candidates, meta };
}

/** Record what universe-building found, so completeness becomes checkable. */
export function setUniverse(candidatesDir, { found, carried, cap, note }) {
  const f = path.join(candidatesDir, '_run.json');
  if (!existsSync(f)) throw new RunError(`no _run.json in ${candidatesDir} — run "init-run" first`);
  const meta = JSON.parse(readFileSync(f, 'utf8'));
  if (!Number.isInteger(carried) || carried < 0) throw new RunError('--carried must be a non-negative integer');
  meta.universe = {
    found: Number.isInteger(found) ? found : null,
    carried_forward: carried,
    ...(Number.isInteger(cap) ? { cap } : {}),
    ...(note ? { note } : {}),
  };
  writeFileSync(f, JSON.stringify(meta, null, 2) + '\n');
  return meta.universe;
}

export const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'candidate';

const domainOf = (url) => {
  try { return new URL(/^https?:/.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '').toLowerCase(); }
  catch { return null; }
};

/**
 * Build the universe from a sweep file, deterministically. The sweep (a
 * subagent, or the agent itself) writes universe.json; everything that
 * follows is arithmetic and so belongs here, not in a model's context:
 * dedup, segment validation, firm-filter drops it already called, the
 * initial_universe cap taken round-robin across declared segments so every
 * segment is represented, and the deep_research_limit. Stubs are written
 * for candidates that will not be researched, so coverage counts them and
 * the brief says why they carry no evidence. Returns the rows to research.
 *
 * universe.json:
 *   { "tier": "keyless", "queries": [...],
 *     "candidates": [ { "name", "url", "location", "segment", "source",
 *                       "note", "fail": { "filter", "evidence" } } ] }
 */
export function applyUniverse(candidatesDir, universeFile, thesis, { filters, declaredSegments, limits }) {
  const f = path.join(candidatesDir, '_run.json');
  if (!existsSync(f)) throw new RunError(`no _run.json in ${candidatesDir} — run "init-run" first`);
  let u;
  try { u = JSON.parse(readFileSync(universeFile, 'utf8')); } catch (e) { throw new RunError(`${universeFile}: ${e.message}`); }
  if (!Array.isArray(u.candidates)) throw new RunError(`${universeFile}: "candidates" must be a list`);
  const [dim, segments] = Object.entries(declaredSegments)[0] ?? [null, []];
  const firm = new Map(filters.filter((x) => !x.revisitable).map((x) => [x.name, x]));
  const problems = [];

  // Dedup on domain, then on normalised name. First occurrence wins.
  const seen = new Set(); const rows = [];
  u.candidates.forEach((c, i) => {
    if (!c || typeof c.name !== 'string' || !c.name.trim()) { problems.push(`candidates[${i}]: name is required`); return; }
    const seg = Array.isArray(c.segment) ? c.segment[0] : c.segment;
    if (dim && !segments.includes(seg)) { problems.push(`"${c.name}": segment "${seg}" is not one of ${dim}.include`); return; }
    if (c.fail && !firm.has(c.fail.filter)) { problems.push(`"${c.name}": fail.filter "${c.fail?.filter}" is not a firm filter (revisitable ones are researched, not dropped)`); return; }
    const key = domainOf(c.url ?? '') ?? `name:${slug(c.name)}`;
    const nameKey = `name:${slug(c.name)}`;
    if (seen.has(key) || seen.has(nameKey)) return;
    seen.add(key); seen.add(nameKey);
    rows.push({ name: c.name.trim(), url: c.url ?? '', location: c.location ?? '', segment: seg, source: c.source ?? 'web search', note: c.note ?? '', fail: c.fail ?? null });
  });
  if (problems.length) throw new RunError(`universe.json has ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`);

  const fails = rows.filter((r) => r.fail);
  const pool = rows.filter((r) => !r.fail);
  // Round-robin across declared segments, input order within a segment.
  const bySeg = new Map((segments.length ? segments : [undefined]).map((s) => [s, pool.filter((r) => r.segment === s)]));
  const ordered = [];
  while (ordered.length < pool.length) for (const q of bySeg.values()) { const r = q.shift(); if (r) ordered.push(r); }
  const carried = ordered.slice(0, limits.initialUniverse ?? ordered.length);
  const research = carried.slice(0, limits.deepResearchLimit ?? carried.length);
  const shallow = carried.slice(research.length);
  const uncarried = ordered.slice(carried.length);

  const base = (r) => ({ name: r.name, url: r.url, location: r.location, segments: dim ? { [dim]: r.segment } : {}, sources: [r.source] });
  const unresolved = (why) => Object.fromEntries(filters.map((x) => [x.name, { outcome: 'unresolved', what_would_settle_it: why }]));
  for (const r of fails) {
    const filtersOut = unresolved('not researched: dropped at the universe stage by a firm filter');
    filtersOut[r.fail.filter] = { outcome: 'fail', evidence: r.fail.evidence ?? '', url: r.url };
    writeFileSync(path.join(candidatesDir, `${slug(r.name)}.json`), JSON.stringify({ ...base(r), filters: filtersOut, note: 'dropped by a firm filter at the universe stage' }, null, 2) + '\n');
  }
  for (const r of shallow) {
    writeFileSync(path.join(candidatesDir, `${slug(r.name)}.json`), JSON.stringify({ ...base(r), filters: unresolved('not researched: past deep_research_limit; raise it to research this candidate'), scores: {}, note: 'carried forward but not researched (deep_research_limit)' }, null, 2) + '\n');
  }

  const meta = JSON.parse(readFileSync(f, 'utf8'));
  // carried_forward is the cap's count; files_expected adds the firm-filter
  // drops, which have files (they count toward coverage) but were not carried.
  meta.universe = {
    found: rows.length,
    carried_forward: carried.length,
    files_expected: carried.length + fails.length,
    ...(limits.initialUniverse != null ? { cap: limits.initialUniverse } : {}),
    note: `${research.length} researched, ${shallow.length} carried without research (deep_research_limit ${limits.deepResearchLimit ?? '∞'}), ${fails.length} dropped by firm filters, ${uncarried.length} past the initial_universe cap` +
      (uncarried.length ? `: ${uncarried.map((r) => r.name).join(', ')}` : '') +
      (u.tier ? `. Tavily tier: ${u.tier}` : '') + (Array.isArray(u.queries) ? `. ${u.queries.length} queries` : ''),
  };
  writeFileSync(f, JSON.stringify(meta, null, 2) + '\n');
  return { found: rows.length, fails, carried, research: research.map((r) => ({ ...r, file: path.join(candidatesDir, `${slug(r.name)}.json`) })), shallow, uncarried, universe: meta.universe };
}

const candidateFiles = (dir) =>
  readdirSync(dir).filter((f) => f.endsWith('.json') && f !== '_run.json').sort();

/** What is on disk vs what the universe stage said should be. */
export function runStatus(candidatesDir) {
  const f = path.join(candidatesDir, '_run.json');
  const meta = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
  const files = candidateFiles(candidatesDir);
  const expected = meta.universe?.files_expected ?? meta.universe?.carried_forward ?? null;
  const ageHours = meta.started_at ? (Date.now() - Date.parse(meta.started_at)) / 3.6e6 : null;
  return { meta, files, written: files.length, expected, ageHours };
}

/**
 * Gate a run before it is screened. Returns warnings; throws on anything that
 * would make the brief wrong rather than merely stale.
 */
export function checkRun(candidatesDir, thesisFile, { staleHours = 24, force = false } = {}) {
  const { meta, written, expected, ageHours } = runStatus(candidatesDir);
  const warnings = [];

  if (meta.thesis_sha) {
    const now = fingerprint(thesisFile);
    if (now !== meta.thesis_sha && !force) {
      throw new RunError(
        `the thesis changed after this run started (was ${meta.thesis_sha}, now ${now}).\n` +
        `  The evidence on disk was gathered against a different screen. Start a new run,\n` +
        `  or pass --force if you are certain the change does not affect the judgments.`);
    }
    if (now !== meta.thesis_sha) warnings.push('thesis changed after the run started; forced');
  }

  if (expected !== null && written < expected && !force) {
    throw new RunError(
      `incomplete run: universe carried ${expected} candidates forward but only ${written} ` +
      `judgment file(s) are written.\n` +
      `  Research the remaining ${expected - written}, or re-record the universe with ` +
      `"set-universe --carried ${written}" if the run was deliberately cut short.`);
  }
  if (expected !== null && written < expected) warnings.push(`incomplete: ${written}/${expected} candidates; forced`);
  if (expected !== null && written > expected) warnings.push(`${written} judgment files but universe recorded ${expected} carried forward`);

  if (ageHours !== null && ageHours > staleHours) {
    warnings.push(`evidence is ${Math.round(ageHours)}h old (gathered ${meta.started_at}) — re-run to refresh`);
  }
  if (written === 0) throw new RunError(`no candidate files in ${candidatesDir}`);
  return warnings;
}
