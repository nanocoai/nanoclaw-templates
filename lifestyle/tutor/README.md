# Tutor Agent Template

A NanoClaw agent template for one adult who wants to learn something. Any subject. It teaches
from current sources via Tavily, keeps a linked map of what you know and where the gaps are in
its memory, checks understanding by probing the foundations rather than the surface, and picks
every session up where the last one ended.

Not a school tutor. No quizzes for grades, no gold stars, no "does that make sense?". You say
where you stand and it believes you. It exists to help you learn what you chose to learn.

## What it does

| | |
|---|---|
| **Five modes** | Explain, Socratic, Build, Explore, Revisit. Pick one per session or set a default per subject. |
| **A living map** | One Markdown file per concept, with a status (untouched / forming / shaky / solid), prerequisites, related concepts across subjects, saved sources, and the open threads it noticed. Ask "show me my map" or "what am I weak on". |
| **Resume** | Every session opens from "Where we are" in memory. "Let's continue" is a complete instruction. |
| **Current sources** | Version-dependent, recent, or documentation-shaped topics are searched before they're taught, and cited. Good sources are saved on the concept. |
| **Real probes** | Explain it to a newcomer, predict, break it, connect it. Never "do you follow?". |
| **Weekly digest** | Sunday evening, three to five genuinely good follow-ups on what you actually touched that week. Quiet week, no message. Ships paused. |

## Layout

NanoClaw stamps an agent from the parts of this folder its plugin reader loads (`mcp.json`,
`skills/`, and the `ai.nanoco.nanoclaw/` extension dir); README.md is not one of them.

```
tutor/
├── plugin.json                       # Agent Plugins manifest
├── mcp.json                          # Tavily (streamable-http, keyless)
├── ai.nanoco.nanoclaw/
│   ├── context/instructions.md       # persona + ground rules
│   └── tasks/weekly-digest.md        # created PAUSED
├── skills/
│   ├── welcome/SKILL.md              # first meeting + onboarding
│   └── tutor/
│       ├── SKILL.md                  # session flow, mode routing, map queries
│       └── references/
│           ├── learner-model.md      # memory layout, frontmatter, status rules
│           ├── modes.md
│           ├── understanding.md
│           ├── sources.md
│           └── digest.md
├── tools/map-viewer/                 # optional local viewer for the map (host-side, read-only)
│   ├── map_viewer.py
│   └── index.html
└── README.md
```

## Stamp an agent from this template

```bash
mkdir -p <nanoclaw>/templates/lifestyle
cp -R lifestyle/tutor <nanoclaw>/templates/lifestyle/
ncl groups create --template lifestyle/tutor --name "Tutor"
```

Then wire it to a chat (`/manage-channels`). It's built for one learner in a direct chat; in a
group it can't tell who is learning what.

## Configure before first use

Nothing. On first contact the agent asks four things, one at a time: your name and first subject,
why, how you like to learn, and where you're starting from. Everything else it learns from
teaching you.

## Where the map lives

In the agent's memory, `groups/<folder>/memory/` on the host:

```
memory/
├── index.md                  # Core Memory + "Where we are"
├── learner.md                # preferences, default modes, self-reports
└── subjects/<subject>/
    ├── index.md              # concept table with statuses
    └── <concept>.md          # one concept per file, linked
```

It's plain Markdown in the Open Knowledge Format, so you can read it, edit it, or point another
tool at it. `skills/tutor/references/learner-model.md` has the exact shape.

### See the map

`tools/map-viewer/` is a small local viewer (Python 3 standard library, one HTML page) that
renders the memory folder as a live graph: concepts coloured by status, prerequisite and
related links, open threads and saved sources in a side panel, refreshed every few seconds as
the agent writes. Run it on the host:

```bash
python3 lifestyle/tutor/tools/map-viewer/map_viewer.py <nanoclaw>/groups/<folder>/memory 8787
open http://127.0.0.1:8787/
```

It reads files only; it never writes to memory and the agent doesn't know it exists.

## Services and credentials

### Tavily (web search)

The only external service. **Free to start, no key needed.** The template registers Tavily's
hosted MCP server in keyless mode, which draws on a shared, IP-based allowance. Two tools are
used: `tavily_search` and `tavily_extract`.

| | |
|---|---|
| API host | `mcp.tavily.com` |
| Auth | none in keyless mode; a Bearer key injected by OneCLI if you add your own |
| Scopes | n/a |
| Paid tier | not required. The template works on Tavily's free tier; [Tavily's pricing page](https://www.tavily.com/#pricing) lists plans with larger allowances. You bring your own key if you want one. |

#### Adding your own Tavily key

If the shared allowance runs out, the agent tells you. To use your own key, create one at
[app.tavily.com](https://app.tavily.com) and store it in OneCLI so it's injected at the proxy
boundary. Never put it in `mcp.json` or an env var.

In the OneCLI dashboard: Connections → Custom, host `mcp.tavily.com`, header `Authorization`,
value format `Bearer {value}`. Or on the host:

```bash
onecli secrets create --name tavily --type generic \
  --host-pattern mcp.tavily.com \
  --header-name Authorization --value-format 'Bearer {value}' \
  --file <path-to-key-file>
```

## Recurring tasks

One task ships in `ai.nanoco.nanoclaw/tasks/`, **created paused**:

| Task | Default schedule | What it does |
|------|------------------|--------------|
| `weekly-digest` | Sunday 18:00 | Finds concepts touched in the last 7 days; if none, does nothing. Otherwise searches for three to five genuinely good follow-ups (articles, talks, books) and sends them with one line on the map. |

The agent offers it during onboarding and resumes it on a yes. Manually:

```bash
ncl tasks list --group <agent-group-id> --status paused
ncl tasks resume <task-id> --group <agent-group-id>
ncl tasks run <task-id> --group <agent-group-id>     # fire it now to see what it sends
```

## Credits

Built for the NanoClaw September 2026 hackathon (Tavily track) by
[@luzybry94](https://github.com/luzybry94).
