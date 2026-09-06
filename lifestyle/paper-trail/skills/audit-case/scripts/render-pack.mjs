#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCase } from './validate-case.mjs';

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function readJsonLines(file) {
  return (await readFile(file, 'utf8'))
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function md(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function csv(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function html(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function citationText(citations = []) {
  return citations.map((item) => `${item.exhibitId} — ${item.pinpoint}`).join('; ');
}

function writeLines(lines) {
  return `${lines.join('\n').trim()}\n`;
}

export async function renderPack(caseDirectory) {
  const caseDir = path.resolve(caseDirectory);
  const validation = await validateCase(caseDir);
  if (!validation.ok) {
    const error = new Error(`case validation failed:\n- ${validation.errors.join('\n- ')}`);
    error.validation = validation;
    throw error;
  }

  const caseRecord = await readJson(path.join(caseDir, 'case.json'));
  const manifest = await readJson(path.join(caseDir, 'manifest.json'));
  const facts = await readJsonLines(path.join(caseDir, 'facts.jsonl'));
  const timeline = await readJson(path.join(caseDir, 'timeline.json'));
  const conflicts = await readJson(path.join(caseDir, 'conflicts.json'));
  const missing = await readJson(path.join(caseDir, 'missing.json'));
  let draft;
  try {
    draft = await readJson(path.join(caseDir, 'draft.json'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const dated = timeline.filter((event) => event.date).sort((a, b) => a.date.localeCompare(b.date));
  const undated = timeline.filter((event) => !event.date);

  const caseMd = writeLines([
    `# ${md(caseRecord.title)}`,
    '',
    `**Case ID:** ${md(caseRecord.caseId)}`,
    `**State:** ${md(caseRecord.state)}`,
    `**Requested outcome:** ${md(caseRecord.requestedOutcome)}`,
    '',
    '## Counts',
    '',
    `- Unique exhibits: ${manifest.exhibits.length}`,
    `- Duplicate submissions: ${manifest.duplicates.length}`,
    `- Extracted facts: ${facts.length}`,
    `- Timeline events: ${timeline.length}`,
    `- Conflicts: ${conflicts.length}`,
    `- Missing items: ${missing.length}`,
    '',
    '> This packet organizes user-supplied evidence. It does not authenticate documents, establish legal chain of custody, provide legal advice, or guarantee an outcome.',
  ]);

  const timelineLines = ['# Timeline', ''];
  for (const event of dated) {
    timelineLines.push(
      `## ${md(event.date)} — ${md(event.description)}`,
      '',
      `- Actor: ${md(event.actor)}`,
      `- Evidence state: ${md(event.state)}`,
      `- Sources: ${md(citationText(event.citations)) || 'None'}`,
      ...(event.uncertainty ? [`- Uncertainty: ${md(event.uncertainty)}`] : []),
      '',
    );
  }
  if (undated.length) {
    timelineLines.push('# Undated events', '');
    for (const event of undated) {
      timelineLines.push(
        `## ${md(event.description)}`,
        '',
        `- Actor: ${md(event.actor)}`,
        `- Evidence state: ${md(event.state)}`,
        `- Sources: ${md(citationText(event.citations)) || 'None'}`,
        '',
      );
    }
  }

  const exhibitRows = [
    ['Exhibit ID', 'Original name', 'Stored name', 'Media type', 'Bytes', 'SHA-256', 'Extraction status'],
    ...manifest.exhibits.map((item) => [
      item.exhibitId,
      item.originalName,
      item.storedName,
      item.mediaType,
      item.byteLength,
      item.sha256,
      item.extractionStatus,
    ]),
  ];
  const exhibitsCsv = `${exhibitRows.map((row) => row.map(csv).join(',')).join('\n')}\n`;

  const conflictLines = ['# Conflicts', ''];
  if (!conflicts.length) conflictLines.push('No unresolved conflicts.', '');
  for (const conflict of conflicts) {
    conflictLines.push(
      `## ${md(conflict.conflictId)} — ${md(conflict.field)}`,
      '',
      `**Why it matters:** ${md(conflict.whyItMatters)}`,
      '',
      ...conflict.alternatives.map(
        (alternative) => `- ${md(alternative.value)} (${md(citationText(alternative.citations))})`,
      ),
      '',
      `**Resolution needed:** ${md(conflict.resolutionNeeded)}`,
      '',
    );
  }

  const priorityRank = { BLOCKING: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const missingSorted = [...missing].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  const missingLines = ['# Missing evidence', ''];
  if (!missingSorted.length) missingLines.push('No missing evidence recorded.', '');
  for (const item of missingSorted) {
    missingLines.push(
      `## ${md(item.priority)} — ${md(item.item)}`,
      '',
      `- Why it matters: ${md(item.whyItMatters)}`,
      `- Where to look: ${md(item.whereToFind)}`,
      `- Packet can proceed: ${item.canProceed ? 'yes' : 'no'}`,
      '',
    );
  }

  const draftMd = draft
    ? writeLines([
        '# Draft letter — review before sharing',
        '',
        `**Subject:** ${md(draft.subject)}`,
        '',
        draft.body.trim(),
        '',
        `**Grounded fact IDs:** ${draft.factIds.map(md).join(', ') || 'None'}`,
        '',
        '> This draft has not been sent. Review every statement and attachment before using it.',
      ])
    : writeLines(['# Draft letter', '', 'No draft has been prepared.']);

  const timelineHtml = [...dated, ...undated]
    .map(
      (event) => `<li><div class="event-date">${html(event.date || 'Date unknown')}</div><strong>${html(
        event.description,
      )}</strong><div>${html(event.actor)} · <span class="badge ${html(event.state.toLowerCase())}">${html(
        event.state,
      )}</span></div><div class="sources">${html(citationText(event.citations) || 'No exhibit citation')}</div></li>`,
    )
    .join('');
  const conflictHtml = conflicts.length
    ? conflicts
        .map(
          (conflict) => `<article><h3>${html(conflict.field)}</h3><p>${html(
            conflict.whyItMatters,
          )}</p><ul>${conflict.alternatives
            .map(
              (alternative) => `<li>${html(alternative.value)} <span class="sources">${html(
                citationText(alternative.citations),
              )}</span></li>`,
            )
            .join('')}</ul><p><strong>Resolve:</strong> ${html(conflict.resolutionNeeded)}</p></article>`,
        )
        .join('')
    : '<p>No unresolved conflicts.</p>';
  const missingHtml = missingSorted.length
    ? missingSorted
        .map(
          (item) => `<article><h3><span class="priority ${html(item.priority.toLowerCase())}">${html(
            item.priority,
          )}</span> ${html(item.item)}</h3><p>${html(item.whyItMatters)}</p><p class="sources">Look here: ${html(
            item.whereToFind,
          )}</p></article>`,
        )
        .join('')
    : '<p>No missing evidence recorded.</p>';
  const exhibitHtml = manifest.exhibits
    .map(
      (item) => `<tr><td>${html(item.exhibitId)}</td><td>${html(item.originalName)}</td><td>${html(
        item.mediaType,
      )}</td><td>${html(item.byteLength)}</td><td><code>${html(item.sha256)}</code></td></tr>`,
    )
    .join('');

  const packHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${html(caseRecord.title)} — Paper Trail</title>
<style>
:root{color-scheme:light;--ink:#17212b;--muted:#5e6b76;--line:#dce2e7;--paper:#fff;--wash:#f4f7f8;--accent:#0b6b5d;--warn:#9a5b00;--danger:#a12b2b}*{box-sizing:border-box}body{margin:0;background:var(--wash);color:var(--ink);font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}.page{max-width:960px;margin:32px auto;background:var(--paper);padding:48px;box-shadow:0 8px 28px #1b2b3414}h1{font-size:34px;margin:0 0 8px}h2{margin-top:36px;border-bottom:1px solid var(--line);padding-bottom:8px}h3{margin-bottom:6px}.lede{font-size:18px;color:var(--muted)}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:24px 0}.card,article{border:1px solid var(--line);border-radius:10px;padding:14px;background:#fff}.card strong{display:block;font-size:22px}.timeline{list-style:none;padding:0}.timeline li{border-left:3px solid var(--accent);padding:0 0 22px 18px;margin-left:6px}.event-date,.sources{color:var(--muted);font-size:13px}.badge,.priority{display:inline-block;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:700;letter-spacing:.04em;background:#e9f4f1;color:var(--accent)}.priority.high,.priority.blocking{background:#fff0df;color:var(--warn)}.priority.blocking{background:#fde8e8;color:var(--danger)}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;border-bottom:1px solid var(--line);padding:8px;vertical-align:top}code{font-size:11px;overflow-wrap:anywhere}.notice{border-left:4px solid var(--warn);background:#fff8eb;padding:12px 16px}.draft{white-space:pre-wrap;border:1px solid var(--line);padding:18px;border-radius:10px}@media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none;padding:18mm}.no-print{display:none}}
</style>
</head>
<body><main class="page">
<p class="lede">Paper Trail evidence packet</p>
<h1>${html(caseRecord.title)}</h1>
<p><strong>Requested outcome:</strong> ${html(caseRecord.requestedOutcome)}</p>
<div class="meta"><div class="card"><strong>${manifest.exhibits.length}</strong>unique exhibits</div><div class="card"><strong>${timeline.length}</strong>timeline events</div><div class="card"><strong>${conflicts.length}</strong>conflicts</div></div>
<p class="notice">This packet organizes user-supplied evidence. It does not authenticate documents, establish legal chain of custody, provide legal advice, or guarantee an outcome.</p>
<h2>Timeline</h2><ol class="timeline">${timelineHtml || '<li>No timeline events.</li>'}</ol>
<h2>Conflicts</h2>${conflictHtml}
<h2>Missing evidence</h2>${missingHtml}
<h2>Exhibits</h2><table><thead><tr><th>ID</th><th>Original name</th><th>Type</th><th>Bytes</th><th>SHA-256</th></tr></thead><tbody>${exhibitHtml}</tbody></table>
<h2>Draft — review before sharing</h2><div class="draft">${html(draft?.body ?? 'No draft has been prepared.')}</div>
<p class="sources">Generated locally by Paper Trail. No packet content was uploaded by the renderer.</p>
</main></body></html>`;

  const files = {
    'CASE.md': caseMd,
    'TIMELINE.md': writeLines(timelineLines),
    'EXHIBITS.csv': exhibitsCsv,
    'CONFLICTS.md': writeLines(conflictLines),
    'MISSING.md': writeLines(missingLines),
    'DRAFT-LETTER.md': draftMd,
    'PACK.html': packHtml,
  };
  for (const [filename, content] of Object.entries(files)) {
    await writeFile(path.join(caseDir, filename), content, 'utf8');
  }
  return { ok: true, caseDir, files: Object.keys(files), counts: validation.counts };
}

async function main() {
  if (process.argv.length !== 3) throw new Error('Usage: node render-pack.mjs <case-dir>');
  const result = await renderPack(process.argv[2]);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  main().catch((error) => {
    process.stderr.write(
      `${JSON.stringify({ ok: false, error: error.message, validation: error.validation }, null, 2)}\n`,
    );
    process.exitCode = 1;
  });
}
