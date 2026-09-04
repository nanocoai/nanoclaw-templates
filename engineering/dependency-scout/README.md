# Dependency Scout Agent Template

A NanoClaw agent template that runs due diligence on an OSS package or
GitHub dependency before you adopt it: maintenance health, known
vulnerabilities, community sentiment, and comparable alternatives — scored,
sourced, and back in under a minute.

Who it's for: any developer or team about to add a new dependency, or doing
a periodic audit of what's already in a project.

## What it does

- Detects the package's ecosystem (npm, PyPI, crates.io, or a best-effort
  guess from a GitHub repo's language) and pulls structured data: latest
  version and publish recency, maintainer count, deprecation flags, GitHub
  commit/release/archive status.
- Queries [OSV.dev](https://osv.dev) — the cross-ecosystem vulnerability
  database — for known advisories, and checks whether they affect the
  version actually being considered.
- Searches the live web for how people really talk about using it: adoption
  stories, recurring complaints, "is this still maintained" discussions.
- When the package shows any caution- or risk-level signal, finds and
  lightly compares the most commonly recommended alternatives.
- Reports a scored verdict (**Healthy** / **Caution** / **Risky**) with every
  claim sourced, and says plainly what couldn't be verified.
- Optionally saves scouted packages to a watchlist and re-checks OSV.dev for
  new advisories weekly
  (`ai.nanoco.nanoclaw/tasks/weekly-watchlist-recheck.md`, ships **paused**).

## What it deliberately doesn't do

- **Doesn't decide for you.** It reports evidence and a score; adoption is
  your call.
- **Doesn't touch your project.** It never installs, removes, or modifies a
  dependency, opens an issue/PR, or contacts a maintainer.
- **Doesn't rely on stale training-data knowledge.** Every factual claim
  comes from a live fetch made during the session — ecosystems move fast
  enough that a model's built-in knowledge of a package's current state
  can't be trusted.
- **Doesn't require any account or API key** — see Credentials below.

## Layout

NanoClaw stamps an agent from the parts of this folder its plugin reader
loads (`skills/` and the `ai.nanoco.nanoclaw/` extension dir); `README.md` is
not one of them. This template ships no `mcp.json` — it needs none.

```
dependency-scout/
├── plugin.json                            # Agent Plugins manifest
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   └── instructions.md                # persona + operating principles
│   └── tasks/
│       └── weekly-watchlist-recheck.md    # ships PAUSED
├── skills/
│   └── dependency-scout/
│       ├── SKILL.md                       # entry: routing + report flow
│       └── references/
│           ├── ecosystem-detection.md     # classify the package's registry
│           ├── registry-lookup.md         # npm / PyPI / crates.io calls
│           ├── github-health.md           # GitHub REST API calls
│           ├── security-advisories.md     # OSV.dev query + interpretation
│           ├── community-sentiment.md     # web-search sentiment checks
│           ├── alternatives.md            # comparable-package research
│           └── report-format.md           # verdict + report structure
└── README.md                              # this file
```

## Credentials

**None required.** Every source this template uses is a public,
unauthenticated endpoint:

| Source | Host | Auth | Notes |
|--------|------|------|-------|
| npm registry / downloads API | `registry.npmjs.org`, `api.npmjs.org` | none | — |
| PyPI JSON API | `pypi.org` | none | — |
| crates.io API | `crates.io` | none | requires a descriptive `User-Agent` header, no key |
| GitHub REST API | `api.github.com` | none (unauthenticated) | rate-limited to 60 requests/hour per IP |
| OSV.dev | `api.osv.dev` | none | — |
| Web search | — | none | uses the agent's built-in search tool |

Because nothing here needs OneCLI-managed credentials, this template works
immediately on stamp with zero setup.

## Testing locally

```bash
mkdir -p <nanoclaw>/templates/engineering
cp -R engineering/dependency-scout <nanoclaw>/templates/engineering/
ncl groups create --template engineering/dependency-scout --name "Dependency Scout Test"
```

Re-copy after every edit — the stamp reads the copy, not this clone. Confirm
the weekly recheck task shows up paused: `ncl tasks list --status paused`.
