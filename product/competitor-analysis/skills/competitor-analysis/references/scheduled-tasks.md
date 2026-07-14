# Reference: Scheduled Tasks (weekly competitor review)

The agent advertises a **weekly Thursday 9 AM** competitor review, but it only *runs*
once a recurring task is registered — this file covers setting it up and what it does.

## Set up the recurring task

Call **`schedule_task`** with:

- **`recurrence`: `0 9 * * 4`** — Thursdays at 09:00 (cron is evaluated in the user's
  timezone, from the `<context timezone="..."/>` header).
- **`processAfter`** — the next Thursday 09:00 (the first run).
- **`prompt`** — *"Run the weekly competitor review per `references/scheduled-tasks.md`:
  re-check every tracked competitor, then message me the proposed updates (or that there
  were none) and wait for approval before amending the doc + tracker."*

Offer this after the first doc is built (or whenever asked); confirm once it's on
("Weekly review is on — Thursdays 9 AM"). Manage later with `list_tasks` / `pause_task`
/ `resume_task` / `update_task` / `cancel_task`. Never claim it's running before a task
exists.

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

Send **one** message: a header, then a line per competitor — either the specific changes
(grouped by section, each with a source link) or "no changes." List the clean ones too;
keep links as bare URLs (SKILL.md output style).

> **Weekly competitor review — 4 checked, 2 with proposed updates.**
> **Acme** — Funding: $40M Series B (https://…); Pricing: new Enterprise tier (https://…)
> **Beta Inc** — checked, no changes this week.
> Reply **"apply"** to update everything, or name which to apply/skip.

## On approval

Amend **only** the approved competitors/sections: re-render each changed section with
`scripts/render-section.js` (never hand-edit formatting), refresh Recent News, update
the tracker row (`references/spreadsheet.md`). Confirm with doc links. No-change weeks
need no approval — the summary message is the whole run.
