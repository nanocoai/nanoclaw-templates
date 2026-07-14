# Reference: Weekly Competitor Review

This is the procedure the scheduled **weekly review** task runs (see
`tasks/weekly-competitor-review.md`). It re-checks every tracked competitor and proposes
sourced updates for approval. It runs **unattended, with no chat attached**, so deliver
the proposal to the user's channel and wait for their reply before writing anything.

## Activating it

The task ships **paused** — stamping the template never starts background work on its own.
When the user wants the weekly review turned on (offer it once the first doc is built, or
whenever they ask), find the paused `weekly-competitor-review` task and resume it with your
task tools, then confirm it's on and when it runs. Never claim it's running
before it's actually resumed. Manage it later the same way (pause / update / cancel).

## Each run

Read the tracker for the competitor list and their doc links
(`references/spreadsheet.md`). For **each competitor**:

1. **Re-research every section** with all tools (Exa, SerpAPI incl. `site:{domain}`, X,
   `agent-browser`) per `references/research.md`, across the sections in
   `references/doc-structure.md`; refresh Recent News (`references/recent-news.md`).
2. **Compare section by section** to the current doc. An "update" = any real, sourced
   change (funding, pricing, product, integration, leadership, customers, press…).
3. **Collect changes — don't edit yet.** The unattended run **proposes first** and only
   writes after approval. Never fabricate; skip unchanged sections; note any missing
   connector rather than failing.

## Propose, then wait

Send the user **one** message summarizing the run: a short header, then a line per
competitor — the specific changes found (grouped by section, each with a source link), or
that there were none. Include the unchanged competitors too, so it's clear the whole
tracker was reviewed. Keep links as bare URLs (SKILL.md output style). Then ask them to
approve — all of it, or to pick which competitors/sections to apply — and wait.

## On approval

Amend **only** the approved competitors/sections: re-render each changed section with
`scripts/render-section.js` (never hand-edit formatting), refresh Recent News, update
the tracker row (`references/spreadsheet.md`). Confirm with doc links. No-change weeks
need no approval — the summary message is the whole run.
