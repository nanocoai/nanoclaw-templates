# Lit Gate

A NanoClaw template that **guards a researcher's reading time**. Each
morning it pulls new papers from the official arXiv API, diffs them
against a seen-ledger, and wakes the model only when there is something
new. The default verdict is **SKIP**. **READ is rare** and capped.

Hackathon track: **Overall**. No credentials. No `mcp.json`.

## Who it is for

ML / AI / DL / math researchers (and anyone else who lives on arXiv)
who are drowning in daily submissions and cannot afford another
summarizer. Someone who is not the author can stamp this, answer four
onboarding questions, and get value the same day.

## What it does

| Play | What you get |
|------|----------------|
| Onboard | Field, arXiv categories, 3–8 seed papers, daily READ cap |
| Morning harvest | Script-gated arXiv pull → SKIP / SKIM / READ / BLOCKED cards |
| Paste an id | One-paper triage |
| `+` / `-` | Like/dislike stored as extra seeds / hard negatives |
| "Can I cite this?" | Live Crossref / OpenAlex / Semantic Scholar; unresolved → `DO NOT CITE` |

## What it deliberately does not do

- Summarize every new paper in your categories
- Run experiments, paper-to-code, or training loops
- Need Tavily, AlphaXiv, Exa, Notion, or a vector database
- Spawn extra agents
- Auto-enable the morning task (it stamps **paused**)

A generic "research assistant" that fetches more papers is the opposite
of this template (see also the open `research/analyst` PR). Lit Gate
refuses most of them.

## Credentials

**None required.** Harvest talks to `export.arxiv.org` (public, no key).
Cite-check uses Crossref, OpenAlex, and Semantic Scholar anonymous HTTP
APIs.

| Service | Host | Auth | Required? |
|---------|------|------|-----------|
| arXiv API | `export.arxiv.org` | none | yes (built in) |
| Crossref | `api.crossref.org` | none | only for cite-check |
| OpenAlex | `api.openalex.org` | none | only for cite-check |
| Semantic Scholar | `api.semanticscholar.org` | none (shared anonymous quota) | only for cite-check |
| Tavily / AlphaXiv | — | operator-owned MCP, if they add one later | **no** |

Do not paste API keys into chat. This template never asks for one.

## Stamp

Copy this folder into your NanoClaw install, then:

```bash
mkdir -p <nanoclaw>/templates/research
cp -R research/lit-gate <nanoclaw>/templates/research/
ncl groups create --template research/lit-gate --name "Lit Gate"
```

Wire a channel (`/add-telegram` is the intended demo path, or CLI):

```bash
ncl wirings create --channel-type cli --platform-id local --agent-group-id <group-id>
```

On first contact the agent onboards. Then:

```bash
ncl tasks list --group <group-id> --status paused
ncl tasks run <series-id> --group <group-id>    # force one harvest
# later, if you want the 08:00 schedule:
ncl tasks resume <series-id> --group <group-id>
```

`--template` resolves against the **install's** `templates/` directory,
not this clone. Re-copy after edits. `NANOCLAW_TEMPLATES_DIR` on the
`ncl` command line does not work; the host process reads it at startup.

## How the cheap gate works

`tasks/morning-harvest.md` is a script-gated cron (`0 8 * * *`, install
timezone). The script curls arXiv, diffs `plugin-data/lit-gate/seen.txt`,
and prints one JSON line:

- `wakeAgent: false` — empty day, **zero model tokens**
- `wakeAgent: true` + compact id list — agent judges only those ids
- no `cats.txt` yet — wakes for onboard instead of guessing categories

Ungated tasks are capped at four fires/day; this script gate is allowed
to no-op cheaply. The task is created **paused**.

## Layout

```
lit-gate/
├── plugin.json
├── README.md
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   ├── instructions.md
│   │   └── additional_context/
│   │       ├── profile-template.md
│   │       ├── ledger-format.md
│   │       └── failure-playbook.md
│   └── tasks/
│       └── morning-harvest.md          # paused; script-gated
└── skills/
    ├── welcome/SKILL.md
    └── lit-gate/
        ├── SKILL.md
        └── references/
            ├── onboard.md
            ├── harvest.md
            ├── cite-check.md
            ├── feedback.md
            └── card-format.md
```

## Demo script (Telegram or CLI)

1. Stamp and wire. Send any hello — welcome + first onboard question.
2. Answer field, cats (`cs.LG`, `cs.AI`), three seed ids, cap `2`.
3. `ncl tasks run` the paused harvest (or paste one arXiv id).
4. Show READ/SKIM cards, skip count, then `+` on one id.
5. "Can I cite 2609.01234?" — live resolve or `DO NOT CITE`.

Voice-over screen recording is enough. Keep it under three minutes.

## Credit

Senthil Kumar N ([@Senthi1Kumar](https://github.com/Senthi1Kumar)).
