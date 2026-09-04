# Trust Check Agent Template

A NanoClaw agent template that checks something you're about to commit
to — a marketplace listing, a seller or business, a rental, or a job offer —
against the live web, and hands back a scored verdict (**Looks fine** /
**Proceed with caution** / **Red flag**) with sources, in under two minutes.

Who it's for: anyone who buys or sells online, rents, or job-hunts and wants
a second pair of eyes before sending money or personal information — not a
business tool, a personal-safety one.

## What it does

- Classifies what you're checking into one of four categories, each with its
  own checklist of what actually catches scams there (a generic name search
  misses most of it — see `skills/trust-check/references/`).
- Runs that checklist plus a shared cross-category red-flag library
  (off-platform payment pressure, reused photos, lookalike domains, urgency,
  price-too-good, and more) via live Tavily search/extract.
- Reports a verdict with every finding sourced by a linked URL, and says
  plainly what it could **not** verify — "no results found" is reported as
  exactly that, never rounded up to "looks clean."
- Optionally saves checked items to a watchlist and re-checks them weekly
  (`ai.nanoco.nanoclaw/tasks/weekly-watchlist-recheck.md`, ships **paused**)
  so a slow-developing scam pattern (new reports, a vanished listing) still
  reaches you after the fact.

## What it deliberately doesn't do

- **Doesn't decide for you.** It presents evidence and a score; it never
  tells you to walk away or proceed.
- **Doesn't contact anyone.** It never messages a seller, landlord, or
  employer on your behalf — research and reporting only.
- **Doesn't guarantee safety.** A "Looks fine" verdict means the checklist
  found nothing on the live web today — it is not a certification, and new
  or well-hidden scams can still pass it.
- **Doesn't store or check payment details, IDs, or other sensitive data** —
  it only ever needs whatever the user chooses to paste into chat (a listing
  link, a name, a description).

## Layout

NanoClaw stamps an agent from the parts of this folder its plugin reader
loads (`skills/`, `mcp.json`, and the `ai.nanoco.nanoclaw/` extension dir);
`README.md` is not one of them.

```
trust-check/
├── plugin.json                            # Agent Plugins manifest
├── mcp.json                               # Tavily MCP server (placeholder credential)
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   └── instructions.md                # persona + operating principles
│   └── tasks/
│       └── weekly-watchlist-recheck.md    # ships PAUSED
├── skills/
│   └── trust-check/
│       ├── SKILL.md                       # entry: routing + report flow
│       └── references/
│           ├── intake.md                  # classify the request
│           ├── listing-check.md           # marketplace-listing checklist
│           ├── seller-check.md            # seller/business checklist
│           ├── rental-check.md            # rental checklist
│           ├── job-offer-check.md         # job-offer checklist
│           ├── scam-signals.md            # shared red-flag library
│           ├── report-format.md           # verdict + report structure
│           └── troubleshooting.md         # connector + sparse-result handling
└── README.md                              # this file
```

## Credentials

| Service | Host | Auth style | Scope | Where to get it |
|---------|------|-----------|-------|------------------|
| Tavily  | `api.tavily.com` (via the `tavily-mcp` stdio server) | API key, passed as `TAVILY_API_KEY` | Search/extract/map/crawl — no account-linking or write scopes | [app.tavily.com](https://app.tavily.com/home) — free "Researcher" tier available, no card required |

Credentials are injected at request time by the OneCLI gateway — the
`"placeholder"` value in `mcp.json` is never replaced with a real key in the
template itself. Tavily's free tier is enough for personal use; heavier use
may need a paid tier — see Tavily's own pricing page for current plan names
and limits (not quoted here since they change).

## Testing locally

```bash
mkdir -p <nanoclaw>/templates/lifestyle
cp -R lifestyle/trust-check <nanoclaw>/templates/lifestyle/
ncl groups create --template lifestyle/trust-check --name "Trust Check Test"
```

Re-copy after every edit — the stamp reads the copy, not this clone. Confirm
the weekly recheck task shows up paused: `ncl tasks list --status paused`.
