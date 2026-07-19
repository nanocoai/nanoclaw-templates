# Competitor Analysis Agent Template

A NanoClaw agent template for competitive research: crawl a competitor's site
and socials, produce an "About" Google Doc with a "Recent News" tab, and
append a row to a tracking spreadsheet.

## Layout

NanoClaw stamps an agent from the parts of this folder its template parser
reads (`.mcp.json`, `context/`, `skills/`, and `tasks/`); README.md is not one
of them.

```
competitor-analysis/
├── .mcp.json                       # MCP servers: Exa (pinned); the rest are REST APIs via OneCLI
├── context/
│   └── instructions.md             # REQUIRED: the agent's standing brief + config placeholders
├── tasks/
│   └── weekly-competitor-review.md # weekly review task (created PAUSED)
├── skills/
│   └── competitor-analysis/        # one skill: the research workflow (auto-triggers by task)
│       ├── SKILL.md                #   entry: operating logic + routing to the references below
│       ├── references/             #   detailed procedures, one file per phase
│       │   ├── research.md
│       │   ├── connecting-google.md
│       │   ├── doc-structure.md
│       │   ├── doc-writing.md
│       │   ├── recent-news.md
│       │   └── spreadsheet.md
│       └── scripts/                #   deterministic Google API formatting helpers
│           ├── render-section.js
│           └── style-tracker.js
├── README.md                       # this file
└── TROUBLESHOOTING.md              # runbook for install/runtime issues (not parser-read)
```

The two `scripts/` helpers run with `bun` inside the agent container and call
the Google APIs through the OneCLI proxy. Hand-crafting Google Docs/Sheets
formatting from an LLM is unreliable: the agent writes plain Markdown or plain
rows, and the scripts apply the formatting deterministically.

The agent defaults to Claude. To override the provider/model, add an optional
`agent.json` (e.g. `{"provider": "..."}`).

## Configure before first use

Fill in the placeholders in `context/instructions.md` (or let the agent ask on
first run):

- **Tracker spreadsheet**: the Google Sheet ID competitor rows are appended to
- **Docs folder**: the Drive folder new competitor docs should live in
- **Doc format reference** (optional): a canonical example doc to match

## Stamp an agent from this template

```bash
ncl groups create --template product/competitor-analysis --name "Competitor Analysis"
```

Then wire it to a channel as usual (`/manage-channels`). The skill
auto-triggers by task; it is not pre-loaded.

## Credentials: via OneCLI, not env vars

The agent uses five connectable services: **Exa** (MCP), **SerpAPI**, **X**,
and **Google Docs + Sheets**, plus NanoClaw's built-in **`agent-browser`**
(reads full / JS-rendered pages; no credential, no setup). What each tool is
*for* is documented in the skill.

**No API keys live in this template.** NanoClaw never passes secrets into
agent containers as env vars. The OneCLI gateway holds your keys in its vault
and injects them into outbound HTTPS calls at the proxy boundary (including
the Exa MCP server's calls to `api.exa.ai`). A token never sits in the
container env, `.mcp.json`, or chat context. Same rule for any MCP server you
add later.

### 1. Register each credential in the OneCLI vault

Use the OneCLI web UI at **http://127.0.0.1:10254** (or `onecli secrets
--help`). Create one secret per service, matched to that service's API host:

| Service | API host to match | Auth style* | Where to get the key |
|---------|------------------|--------------|----------------------|
| Exa | `api.exa.ai` | `x-api-key` header | dashboard.exa.ai → API Keys |
| SerpAPI | `serpapi.com` | `api_key` **query param** | serpapi.com |
| X (Twitter) | `api.x.com` | `Authorization: Bearer` | developer.x.com, needs a **paid** tier (see below) |
| Google Docs | `docs.googleapis.com` | OAuth (BYOC) | your own Google OAuth app, see below |
| Google Sheets | `sheets.googleapis.com` | OAuth (BYOC) | reuses the **same** Google OAuth app as Docs |

\* Confirm the exact header/param and OAuth scopes against each provider's current API docs.

**X (Twitter) needs a paid tier.** This template *reads* a competitor's recent
posts, which on X's API generally requires a paid plan (the free tier is
mostly post-only). Until X is connected, the agent skips it rather than
failing.

**Google (Docs + Sheets) is the fiddly one (BYOC OAuth).** Two separate
connectors (`google-docs`, `google-sheets`); OneCLI ships no Google OAuth
client, so it's a one-time setup: create your own Google OAuth app, paste its
Client ID/Secret into OneCLI, and authorize. Step-by-step and common errors:
`skills/competitor-analysis/references/connecting-google.md`.

### 2. Let the agent see the secrets

Auto-created agents default to `all` secret mode, so every vault secret whose
host pattern matches is injected automatically; usually nothing more to do.
If the agent is in `selective` mode (the tell: a `401` from an API whose key
*is* in the vault), assign them:

```bash
onecli agents list                                       # check secretMode
onecli agents set-secret-mode --id <agent-id> --mode all # inject all matching secrets
```

No container restart needed; the gateway looks up secrets per request.

### Require human approval before sensitive actions

NanoClaw can gate risky actions in two layers:

- **Soft (behavioral).** The skill's Approvals section makes the agent ask
  before risky writes (shared/foreign docs, bulk ops, overwrites). Guidance
  it follows, not enforcement.
- **Hard (OneCLI gateway).** OneCLI can hold an outbound credentialed request
  until a human approves it: enforcement the agent can't talk its way around.
  Rules match the outbound HTTP request (host + method + path) and are
  configured in the OneCLI web UI at **http://127.0.0.1:10254**. The NanoClaw
  host answers pending approvals by DMing an approver; already wired, nothing
  to configure in this template.

### MCP servers that need their key at startup

Some MCP servers read their API key from the environment at startup, separate
from the vault injection that covers the outbound API call. The Exa server
(`exa-mcp-server`) is one: it won't boot without `EXA_API_KEY`. So this
template ships it with a non-secret placeholder:

```json
"exa": {
  "command": "npx",
  "args": ["-y", "exa-mcp-server@3.2.1"],
  "env": { "EXA_API_KEY": "onecli-managed" }
}
```

That satisfies startup; the real credential is still injected by the proxy on
the outbound call to `api.exa.ai`. `onecli-managed` is a placeholder, not a
secret, so this stays CONTRIBUTING-compliant. If you add another startup-key
MCP server, give it the same placeholder, never a real key.

## Hit a snag?

Install and runtime gotchas (agent never spawns after a manual create; Google
links 404ing on Telegram) are collected in **`TROUBLESHOOTING.md`**.
