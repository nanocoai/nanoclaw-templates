// Render a screen result as Markdown (the brief), CSV, and JSON.
// Pure formatting -- every number here was computed in screen.mjs.

const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);

export function markdown(result) {
  const { counts, bands, coverage, settings: cfg } = result;
  const L = [];
  L.push(`**${counts.PASS} pass · ${counts['NEAR MISS']} near miss · ${counts.FAIL} fail**  —  ${result.thesis}`);
  L.push('');

  if (result.universe?.truncated > 0) {
    const u = result.universe;
    L.push(`> ⚠ **Universe truncated.** ${u.found} candidates were found; ${u.carried_forward} were carried forward` +
      (u.cap != null ? ` at the \`initial_universe\` cap of ${u.cap}` : '') +
      `. The ${u.truncated} dropped are whatever the search ordered last, not a random sample — raise the cap to screen them.` +
      (u.note ? ` ${u.note}` : ''));
    L.push('');
  }

  if (cfg.output.coverage && Object.keys(coverage).length) {
    for (const [dim, cov] of Object.entries(coverage)) {
      L.push(`## Coverage · ${cov.table.length} declared ${dim} segments`);
      L.push('');
      L.push('| Segment | Candidates | Sources | Top contributor | Flag |');
      L.push('|---|---|---|---|---|');
      for (const r of cov.table) {
        const top = r.top ? `${r.top.source} (${r.top.count})` : r.candidates === 0 ? 'no source answered' : '';
        L.push(`| ${r.segment} | ${r.candidates} | ${r.sources} | ${top} | ${r.flags.map((f) => `⚠ ${f}`).join(', ')} |`);
      }
      const flagged = cov.table.filter((r) => r.flags.length);
      if (flagged.length) {
        L.push('');
        L.push(`> ${flagged.length} of ${cov.table.length} segments flagged. A single-source segment maps that source's reach, not the market; an empty declared segment is a gap in the search, not evidence of an empty market. Treat the ${dim} spread of this funnel as unproven.`);
      }
      if (cov.undeclared.length) L.push(`> Candidates found outside declared segments: ${cov.undeclared.join(', ')}.`);
      L.push('');
    }
  }

  L.push(`## PASS · ${counts.PASS} ranked`);
  L.push('');
  if (bands.PASS.length) {
    L.push('| # | Company | Score | Conf | Location | Why |');
    L.push('|---|---|---|---|---|---|');
    bands.PASS.forEach((c, i) => {
      const why = topWhy(c);
      L.push(`| ${i + 1} | ${c.priority ? '★ ' : ''}${link(c)} | ${c.scoring.total}${c.scoring.excluded ? ' ✗' : ''} | ${conf(c.scoring)} | ${c.location} | ${why} |`);
    });
    const legend = [];
    if (cfg.priorityMin !== null) legend.push(`★ priority: score ≥ ${cfg.priorityMin}.`);
    if (bands.PASS.some((c) => c.scoring.lowestConfidence !== c.scoring.confidence)) {
      legend.push('▾ confidence is weighted by criterion weight; at least one criterion is weaker than the headline — see that company\'s breakdown.');
    }
    if (bands.PASS.some((c) => c.scoring.excluded)) legend.push('✗ excluded under missing-data policy.');
    if (legend.length) L.push('\n' + legend.join(' '));
  } else L.push('_None._');
  L.push('');

  if (cfg.output.nearMiss) {
    L.push(`## NEAR MISS · ${counts['NEAR MISS']}`);
    L.push('');
    if (bands['NEAR MISS'].length) {
      L.push('| Company | Score | Filter | Status | What would settle it |');
      L.push('|---|---|---|---|---|');
      for (const c of bands['NEAR MISS']) for (const r of c.reasons) {
        L.push(`| ${link(c)} | ${c.scoring.total} | ${r.filter} | ${r.outcome}${r.revisitable ? ' (revisitable)' : ''} | ${r.settle || r.evidence} |`);
      }
    } else L.push('_None._');
    L.push('');
  }

  if (cfg.output.failures) {
    L.push(`## FAIL · ${counts.FAIL}`);
    L.push('');
    if (bands.FAIL.length) {
      L.push('| Company | Filter | Evidence |');
      L.push('|---|---|---|');
      for (const c of bands.FAIL) {
        const firm = c.reasons.filter((r) => r.outcome === 'fail' && !r.revisitable);
        const shown = firm.length ? firm : c.reasons;
        L.push(`| ${link(c)} | ${shown.map((r) => r.filter).join('; ')} | ${shown.map((r) => r.evidence).filter(Boolean).join('; ')} |`);
      }
    } else L.push('_None._');
    L.push('');
  }

  if (cfg.output.briefs) {
    L.push('---');
    for (const c of [...bands.PASS, ...bands['NEAR MISS']]) L.push(...brief(c, cfg));
  }
  return L.join('\n');
}

function link(c) { return c.url ? `[${c.name}](${c.url})` : c.name; }
/**
 * Weighted confidence, with a compact marker when some single criterion is
 * materially weaker than the headline. The marker is explained under the
 * table; the exact weak criterion is named in that company's breakdown.
 */
function conf(s) {
  return s.lowestConfidence && s.lowestConfidence !== s.confidence ? `${s.confidence} ▾` : s.confidence;
}
function topWhy(c) {
  const best = [...c.scoring.rows].filter((r) => !r.policy).sort((a, b) => b.contribution - a.contribution)[0];
  return best?.why || (best ? `${best.criterion} ${best.score}` : '');
}

function brief(c, cfg) {
  const L = [];
  L.push('', `## ${c.name}  ·  ${c.scoring.total}/100  ·  ${c.band}${c.priority ? '  ·  ★ priority' : ''}`);
  if (cfg.output.confidence) {
    L.push(`Confidence: **${c.scoring.confidence}** (weighted)` +
      (c.scoring.lowestConfidence !== c.scoring.confidence ? ` · weakest input: ${c.scoring.lowestConfidence}` : ''));
  }
  L.push([c.url, c.location].filter(Boolean).join(' · '));
  if (c.reasons.length) {
    L.push('', '**Band reasons**');
    for (const r of c.reasons) L.push(`- ${r.filter}: ${r.outcome}${r.revisitable ? ' (revisitable)' : ''}${r.settle ? ` — would settle it: ${r.settle}` : ''}${r.url ? ` — ${r.url}` : ''}`);
  }
  if (cfg.output.breakdown) {
    L.push('', '**Score breakdown**');
    for (const r of c.scoring.rows) {
      const pol = r.policy ? ` _(no evidence; ${r.policy} policy)_` : '';
      L.push(`- ${r.criterion}: **${r.score}** (weight ${r.weight})${cfg.output.confidence ? ` [${r.confidence}]` : ''}${r.why ? ` — ${r.why}` : ''}${pol}${cfg.output.citations && r.url ? ` — ${r.url}` : ''}`);
    }
  }
  if (c.findings.length) {
    L.push('', '**Findings**');
    for (const f of c.findings) {
      L.push(`- ${f.question}: ${f.answer ?? '_unanswered_'}${cfg.output.confidence && f.confidence ? ` [${f.confidence}]` : ''}`);
      for (const x of f.facts ?? []) L.push(`    - fact: ${x.claim}${cfg.output.citations && x.url ? ` — ${x.url}` : ''}`);
      for (const x of f.inferences ?? []) L.push(`    - inference: ${x.claim}${x.basis ? ` — from ${x.basis}` : ''}`);
    }
  }
  L.push('', '**Open questions**');
  if (c.open_questions.length) for (const q of c.open_questions) L.push(`- ${q.question}${q.what_would_settle_it ? ` — ${q.what_would_settle_it}` : ''}`);
  else L.push('- _none recorded_');
  return L;
}

const csvCell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function csv(result) {
  const crit = result.criteria.map((c) => c.name);
  const header = ['rank', 'band', 'priority', 'company', 'url', 'location', 'score', 'confidence', ...crit, 'band_reasons', 'thesis', 'run_at'];
  const rows = [header];
  for (const band of ['PASS', 'NEAR MISS', 'FAIL']) result.bands[band].forEach((c, i) => {
    rows.push([
      i + 1, band, c.priority ? 'yes' : '', c.name, c.url, c.location,
      c.scoring ? c.scoring.total : '', c.scoring ? c.scoring.confidence : '',
      ...crit.map((n) => c.scoring ? c.scoring.rows.find((r) => r.criterion === n)?.score ?? '' : ''),
      c.reasons.map((r) => `${r.filter}=${r.outcome}`).join('; '), result.thesis, result.run_at,
    ]);
  });
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

export function json(result) {
  const { filters, criteria, settings, ...rest } = result;
  return JSON.stringify({ ...rest, criteria: criteria.map(({ name, weight }) => ({ name, weight })) }, null, 2) + '\n';
}
