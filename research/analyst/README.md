# Research Analyst Template

A NanoClaw agent template for professional research: it runs a three-system
stack — **find** (Exa semantic search), **extract** (Firecrawl: JS-rendered
scraping, bounded crawls, structured extraction, PDFs, academic papers, GitHub
recon, page-change monitors), and **deliver** (a Notion research hub holding
the watchlist, briefs, digests, and source library). Ask it a question and you
get a sourced brief filed in your hub; put it on a schedule and you get
delta-only digests of what changed across your watchlist.

## Layout

NanoClaw stamps an agent from the few things its template parser reads. Nothing
else in this folder is loaded by the parser.

```
analyst/
├── .mcp.json                       # MCP servers (Exa, Firecrawl, Notion): no secrets
├── context/
│   └── instructions.md             # REQUIRED: standing brief (fill in focus + hub)
├── skills/
│   └── research-analyst/           # one skill: the analyst operating system
│       ├── SKILL.md                #   entry: operating logic + routing to the plays
│       └── references/             #   the mechanics, read on demand
│           ├── scoping.md
│           ├── search-strategy.md
│           ├── extraction.md
│           ├── source-vetting.md
│           ├── research-hub.md
│           ├── deliverables.md
│           └── credentials.md
└── README.md                       # this file
```

## Stamp an agent from this template

```bash
ncl groups create --template research/analyst --name "Research Analyst"
```

Then wire it to a channel as usual (`/manage-channels`). The skill auto-triggers
by task; it is not pre-loaded. Fill in the **Research focus** and **Research
hub** blocks in `context/instructions.md`.

The stack degrades gracefully: with only an Exa key connected the agent
answers research questions; add Firecrawl for deep extraction and monitors;
add Notion for the hub. Connect what you need, when you need it.

## Credentials: via OneCLI, not env vars

**No API keys live in this template.** NanoClaw never passes secrets into agent
containers as env vars. The OneCLI gateway holds your credentials in its vault
and injects them into outbound HTTPS calls at the proxy boundary, so the MCP
servers reach their APIs authenticated without any token sitting in
`.mcp.json`, the container env, or chat context.

| Service   | API host to match   | Auth style*             | Where to get the key                              |
|-----------|---------------------|-------------------------|---------------------------------------------------|
| Exa       | `api.exa.ai`        | `x-api-key` header      | dashboard.exa.ai → API Keys                       |
| Firecrawl | `api.firecrawl.dev` | `Authorization: Bearer` | firecrawl.dev → API Keys (key starts `fc-`)       |
| Notion    | `api.notion.com`    | `Authorization: Bearer` | Internal integration token (`ntn_…`), see below   |

\* Confirm the exact header against each provider's current API docs when you
configure the vault entry.

Register each secret in the OneCLI web UI at **http://127.0.0.1:10254** (or
`onecli secrets --help`), matched to that service's host — or skip setup
entirely: the first time the agent calls an unconnected service, it replies
with a prefilled OneCLI connect link; open it, paste the key, ask the agent to
retry.

**Placeholder envs (leave them as-is).** All three servers carry a dummy env
value that OneCLI replaces with the real credential at request time:

- `firecrawl` → `FIRECRAWL_API_KEY: "placeholder"`. Without any value the
  server boots in keyless mode and registers only a free rate-limited subset
  (scrape + search) — no crawls, extraction, papers, or monitors.
- `notion` → `NOTION_TOKEN: "placeholder"`.
- `exa` → `EXA_API_KEY: "placeholder"`. Exa would boot without one, but then
  it sends no credential header at all, and a key added to the vault
  mid-session isn't picked up until the container restarts (observed live).
  The placeholder keeps the header present so the proxy can swap it on every
  request.

They are not credentials: **never** replace them with real tokens.

### Notion: create an internal integration (two steps)

1. **Token** — notion.so/profile/integrations (Settings → Connections →
   Develop or manage integrations) → **New integration**, type *Internal* →
   copy the secret (`ntn_…`) and give it to OneCLI for host `api.notion.com`.
2. **Grant page access** — open (or create) the research hub parent page in
   Notion → **•••** → **Connections** → add your integration and confirm the
   "allow access" dialog. The token only sees pages explicitly shared with
   it; skipping this step makes every page read as "not found". Share one
   dedicated parent page (e.g. "Research Hub"), not your whole workspace.

   To verify the share took: notion.so/profile/integrations → your
   integration → **Access** tab — the page must be listed there. If the
   integration doesn't appear in the page's Connections list at all, it was
   created in a different workspace than the page.

## What needs approval

The template's standing brief gates side effects behaviorally: creating or
deleting Firecrawl **monitors** (standing watches that consume your quota),
editing or deleting **human-authored Notion pages**, writing **outside the
hub**, and **crawls beyond ~50 pages** all require an explicit "yes" first.
Reads, searches, scrapes, drafts, and hub filing are free.

For hard enforcement, OneCLI can hold an outbound request until a human
approves it (configured in the web UI at http://127.0.0.1:10254; NanoClaw DMs
the approver). Gating matches the outbound HTTP request (host + method +
path). Note that Notion writes span several endpoint families — pages
(`/v1/pages*`), block appends (`/v1/blocks/*`), and data-source rows — so the
robust rule is to hold **all `POST`/`PATCH`/`DELETE` to `api.notion.com`**;
for Firecrawl, hold `POST api.firecrawl.dev/*/monitors*` to approve monitor
creation. Confirm exact paths against each provider's API docs.

## Tip: recurring digests

Pair the watchlist with a NanoClaw scheduled task (e.g. weekly "digest run").
The agent reads its Digest log and watchlist from the hub, checks its
Firecrawl monitors, searches for movement, and appends a delta-only entry —
"quiet" counts as a finding.

## Tool notes (pinned versions)

- `exa-mcp-server@3.2.1` exposes `web_search_exa` (inline `category:` hints:
  news / company / research paper / people / personal site) and
  `web_fetch_exa` by default.
- `firecrawl-mcp@3.22.2` exposes scrape/map/crawl/extract/parse, a research
  suite (paper search/read, GitHub search), and `firecrawl_monitor_*` for
  standing page watches.
- `@notionhq/notion-mcp-server@2.4.1` exposes Notion's API as `API-*` tools;
  the plays lean on `API-post-search`, `API-query-data-source`,
  `API-post-page`, `API-retrieve-page-markdown`, `API-update-page-markdown`,
  and `API-patch-block-children`.

**Context cost.** The three servers register ~52 tools total (2 Exa + 26
Firecrawl + ~24 Notion), and every tool schema rides in the agent's context
each spawn. Neither Firecrawl's nor Notion's server offers a tool-filter flag
today, and NanoClaw's server config has no allowlist, so the template can't
trim this. If you don't need a system, delete its block from `.mcp.json`
before stamping (e.g. drop `notion` for a files-only analyst) — the skill
degrades gracefully.

**Keyless 402s.** Unauthenticated Exa calls return HTTP 402 with an `x402`
crypto-payment demand rather than a plain 401. The agent is instructed to
treat these as "not connected" and never to satisfy a payment demand; the fix
is always a normal API key in the OneCLI vault.
