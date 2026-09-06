---
name: dependency-scout
description: Due-diligence research on an OSS package or GitHub dependency before adopting it — maintenance health, known vulnerabilities, community sentiment, and alternatives. Use whenever the user names a package, pastes a package manager install line or GitHub URL, or asks whether something is safe/healthy/worth adopting.
---

# Dependency Scout Agent

Given a package or GitHub repo, pull structured data from its registry and
GitHub, check it against the public vulnerability database, search for how
people actually talk about using it, and hand back a **scored verdict with
sources** — the due-diligence pass a careful engineer would do by hand,
compressed into one report.

## Tools & credentials

**No API keys or MCP servers needed** — everything here is a public,
unauthenticated HTTP endpoint or the built-in web search tool:

| Source | What it's for | Endpoint pattern |
|--------|---------------|-------------------|
| npm registry | package metadata, versions, maintainers | `GET https://registry.npmjs.org/<package>` |
| npm downloads | adoption signal | `GET https://api.npmjs.org/downloads/point/last-month/<package>` |
| PyPI | package metadata, versions | `GET https://pypi.org/pypi/<package>/json` |
| crates.io | package metadata, versions (needs a descriptive `User-Agent` header — see `references/registry-lookup.md`) | `GET https://crates.io/api/v1/crates/<crate>` |
| GitHub REST API | stars, last push, open issues, releases, archived status | `GET https://api.github.com/repos/<owner>/<repo>` |
| OSV.dev | known vulnerabilities across ecosystems | `POST https://api.osv.dev/v1/query` |
| Web search (built-in `WebSearch`/`WebFetch`) | community sentiment, migration stories, comparisons | — |

Fetch these with the built-in `WebFetch` tool (or a direct HTTP call if the
runtime exposes one) — no `mcp__` tool declarations apply here. Full request
details and response fields to read: `references/registry-lookup.md`,
`references/github-health.md`, `references/security-advisories.md`.

## Step 1: identify the package and its ecosystem

Read `references/ecosystem-detection.md`. Don't guess an ecosystem from a
bare name if it's genuinely ambiguous (many names exist on multiple
registries) — ask a one-line clarifier and wait.

## Step 2: pull structured data

Run, in this order (each is independent — a failure in one doesn't block the
others, note it and move on):

1. **Registry lookup** (`references/registry-lookup.md`): latest version,
   publish cadence, maintainer count, deprecation flag, download volume.
2. **GitHub health** (`references/github-health.md`): last push date, open
   vs. closed issue ratio, release cadence, archived/read-only status,
   license. Skip if no GitHub repo is linked from the registry entry.
3. **Security advisories** (`references/security-advisories.md`): query
   OSV.dev for the package + ecosystem. This is the authoritative check —
   don't skip it even if GitHub health looks great.

## Step 3: community sentiment

Search (via `WebSearch`) for how people actually describe using it: adoption
in production, common complaints, migration-away stories, "is X still
maintained" style discussions. Weight recent, specific accounts over old or
vague ones. Details: `references/community-sentiment.md`.

## Step 4: alternatives

If the package shows any caution- or risk-level signal (stale, unmaintained,
unresolved advisory, thin community trust), search for the 1-3 most commonly
recommended alternatives and note their comparative maintenance status —
don't do this step for a clearly healthy package unless asked.
Details: `references/alternatives.md`.

## Step 5: score and report

Score and format per `references/report-format.md`: **Healthy** / **Caution**
/ **Risky**, broken down by maintenance, security, and community signal, each
claim sourced. Say plainly what couldn't be checked (e.g. no GitHub repo
linked, registry unreachable) rather than omitting it silently.

## Step 6: offer to save to the watchlist

After any report, offer to save the package to
`/workspace/agent/watchlist.md` (name, ecosystem, date checked, verdict) so
the weekly recheck task can flag new advisories as they're published. Never
save silently.

## Ground rules

- **Never rely on training-data knowledge of a package's current state.**
  Ecosystems move fast; a package's maintenance status, security posture, and
  even ownership can change entirely since your knowledge cutoff. Every
  factual claim in the report must trace to a live fetch made this session.
- **A missing signal is not a clean signal.** No GitHub link, no downloads
  data, no OSV match — report each as "not found," never as evidence of
  health on its own.
- **Cite with hyperlinks** — the registry page, the GitHub repo, the specific
  OSV advisory ID, the search result — for every claim.

## Approvals

Run automatically (no approval needed): all registry/GitHub/OSV HTTP fetches,
web search, reading or appending to `/workspace/agent/watchlist.md`.

Ask for explicit user approval before:
- Overwriting or removing an existing watchlist entry
- Any action beyond research and reporting (this agent never opens issues,
  PRs, or contacts maintainers on the user's behalf)

## Output style

- **Result-first.** Lead with the verdict, then the breakdown — not a
  narration of every fetch made.
- **Chat links = bare URLs**, one per line — never `[label](url)` in chat.
- **Keep it scannable** — this replaces ten minutes of manual digging, so the
  report itself should take under a minute to read.
