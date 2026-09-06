---
name: lit-gate
description: Literature attention gate for researchers. Use when the user wants a daily arXiv harvest, to triage a paper, to decide SKIP/SKIM/READ, to like or dislike a paper, to check whether they can cite something, or to onboard their field, seeds, and daily READ cap. Also use for "what's new on arXiv", "should I read this", "can I cite this", and morning literature briefs.
---

# Lit Gate

One job: spend READ slots only on papers that move this researcher's work.

## Plays

Read only the reference the current request needs.

1. **Onboard** → `references/onboard.md` — no profile yet, or user says setup / start over
2. **Harvest** → `references/harvest.md` — morning task, "what's new", "run the harvest"
3. **Triage one paper** → `references/harvest.md` (single-id path) — user pastes an arXiv id or abs URL
4. **Cite-check** → `references/cite-check.md` — "can I cite this", unresolved refs
5. **Feedback** → `references/feedback.md` — `+` / `-`, like, dislike, "more like this"
6. **Card format** → `references/card-format.md` — every user-facing verdict

If memory holds no profile (no `/workspace/agent/memory/profile.md` and no
`plugin-data/lit-gate/cats.txt`), run onboard before any other play.

## Workspace

| Path | Role |
|------|------|
| `/workspace/agent/memory/profile.md` | Human-readable profile |
| `/workspace/agent/plugin-data/lit-gate/cats.txt` | Category codes the script curls |
| `/workspace/agent/plugin-data/lit-gate/seen.txt` | Ids already judged |
| `/workspace/agent/memory/harvest/YYYY-MM-DD.md` | That day's table |
| `/workspace/agent/memory/ratings.md` | `+` / `-` log |

## Tools

This template ships **no MCP servers**. Harvest uses the official arXiv API
(`https://export.arxiv.org/api/query`, no key). Cite-check uses Crossref,
OpenAlex, and Semantic Scholar public HTTP APIs. Built-in web fetch is
enough for an abstract page.

If the operator later adds Tavily or AlphaXiv as a *user-owned* MCP server,
use them only for optional depth on a SKIM/READ card — never for the
morning firehose, and never as a reason to upgrade SKIP to READ.
