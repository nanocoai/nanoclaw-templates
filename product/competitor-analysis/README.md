# Competitor Analysis Agent Template

A NanoClaw agent template for competitive research: crawl a competitor's site and
socials, produce a consistently formatted "About" Google Doc + "Recent News" tab,
and append a row to a tracking spreadsheet.

## Layout

NanoClaw stamps an agent from the four things its template parser reads — nothing
else in this folder is loaded by the parser.

```
competitor-analysis/
├── .mcp.json                       # MCP servers — none (all tools are REST APIs via OneCLI)
├── context/
│   └── instructions.md             # REQUIRED — the agent's standing brief + config placeholders
├── skills/                         # each subfolder is one skill (loaded on demand)
│   └── competitor-analysis/
│       ├── SKILL.md                #   the entry point + operating logic
│       ├── references/             #   the detailed procedures per phase
│       │   ├── research.md         #     find + read pages (Exa, SerpAPI, browser, X)
│       │   ├── doc-structure.md    #     the 14 sections + formatting + hyperlink rules
│       │   ├── doc-writing.md      #     how to render sections with the formatter
│       │   ├── recent-news.md      #     the news tab (third-party press)
│       │   └── spreadsheet.md      #     the tracker sheet
│       └── scripts/                #   helpers that do the fiddly Google API formatting
│           ├── render-section.js   #     Markdown → formatted Google Doc (bullets, links, bold titles)
│           └── style-tracker.js    #     one-time polished styling for the tracker sheet
└── README.md                       # this file
```

The two `scripts/` helpers run with **`bun`** inside the agent container and call
the Google APIs through the OneCLI proxy. They exist because hand-crafting Google
Docs/Sheets formatting from an LLM is unreliable — the agent writes plain Markdown /
plain rows, and the scripts apply the formatting deterministically.

The agent defaults to Claude. To override the provider/model, add an optional
`agent.json` (e.g. `{"provider": "..."}`) — not included here since the default is
what we want.

## Configure before first use

This is a clean template — a few things are placeholders in
`context/instructions.md`. Fill them in (or let the agent ask on first run):

- **Tracker spreadsheet** — the Google Sheet ID your competitor rows are appended to
- **Docs folder** — the Drive folder new competitor docs should live in
- **Doc format reference** (optional) — a canonical example doc to match

## Stamp an agent from this template

```bash
ncl groups create --template product/competitor-analysis --name "Competitor Analysis"
```

Then wire it to a channel as usual (`/manage-channels`). The skill auto-triggers
by task — it is not pre-loaded.

## Tools & APIs

Everything the agent uses is a **REST API called through the OneCLI proxy** (no MCP
servers), plus one built-in browser skill:

| Tool | What it's for |
|------|---------------|
| **Exa** | Semantic web/news search — discovery, funding, founders, signals |
| **SerpAPI** | Real Google results — known-item lookups Exa misses, exhaustive Google News, and `site:{domain}` page discovery |
| **X (Twitter) API** | A competitor's recent posts (Exa can't read x.com) |
| **Google Docs API** | Creates the research doc (formatted by `scripts/render-section.js`) |
| **Google Sheets API** | The tracker sheet (styled by `scripts/style-tracker.js`) |
| **agent-browser** | Built into NanoClaw — opens and reads full / JS-rendered pages (a `/security` page, pricing toggles). Not a credential; always available. |

Connect the first five in the OneCLI vault (next). `agent-browser` needs no setup.

## Credentials — via OneCLI, not env vars

**No API keys live in this template.** All tools (Exa, SerpAPI, X, Google Docs/Sheets)
are plain **REST APIs** the agent calls directly — there are **no MCP servers**
(`.mcp.json` is empty). NanoClaw never passes secrets into agent containers as env
vars: the OneCLI gateway holds your credentials in its vault and injects them into
outbound HTTPS calls at the proxy boundary, so a token never sits in the container
env, `.mcp.json`, or chat context.

(If you ever *do* add an MCP server, list only `command` + `args` — never an `env`
block with real keys.)

### 1. Register each credential in the OneCLI vault

Use the OneCLI web UI at **http://127.0.0.1:10254** (or `onecli secrets --help`
/ `onecli apps --help`).

| Service | API host to match      | Auth style*             | How to connect                                  |
|---------|------------------------|-------------------------|-------------------------------------------------|
| Exa     | `api.exa.ai`           | `x-api-key` header      | `onecli secrets create` — key from dashboard.exa.ai → API Keys |
| SerpAPI | `serpapi.com`          | `api_key` **query param** | `onecli secrets create … --param-name api_key` — key from serpapi.com. Real Google results for known-item lookups + exhaustive news + `site:` page discovery. |
| X (Twitter) | `api.x.com`        | `Authorization: Bearer` | `onecli secrets create` — Bearer token from developer.x.com. See note below. |
| Google Docs  | `docs.googleapis.com`  | OAuth (`Bearer`)   | Connect Google as an OAuth **app** (`onecli apps` / web UI)    |
| Google Sheets | `sheets.googleapis.com` | OAuth (`Bearer`) | Same Google OAuth connection covers Docs + Sheets             |

SerpAPI uses a **query-param** key (not a header), so its command differs:

```bash
onecli secrets create --name "SerpAPI" --type generic \
  --value "<your-serpapi-key>" --host-pattern "serpapi.com" --param-name "api_key"
```

**X (Twitter) — read access requires a paid tier.** The competitor-analysis
routine *reads* a competitor's recent posts, which on X's API generally needs a
paid plan (the free tier is mostly post-only). Confirm your X developer account
has read access before wiring it in. When ready:

```bash
onecli secrets create --name "X" --type generic \
  --value "<your-x-bearer-token>" --host-pattern "api.x.com" \
  --header-name "Authorization" --value-format "Bearer {value}"
```

Until that's done, the agent skips the X step and notes "X coverage pending" — it
does not fail.

\* Confirm the exact header/param and OAuth scopes against each provider's current
API docs when you configure the vault entry.

Exa (static key) example:

```bash
onecli secrets create --name "Exa" --type generic \
  --value "<your-exa-key>" --host-pattern "api.exa.ai" --header-name "x-api-key"
```

Google (Docs + Sheets) is an **OAuth** connection, not a static key — connect it
as an app in the OneCLI web UI so the agent gets a `Bearer` token injected. Make
sure the Docs and Sheets scopes are granted. (Google Drive is a separate scope; if
you want the agent to place docs in a specific Drive folder automatically, grant
Drive too — otherwise create the doc shells yourself and point the agent at them.)

### 2. Let the agent see the secrets

Auto-created agents default to `all` secret mode, so every vault secret whose host
pattern matches is injected automatically — usually nothing more to do. If the
agent is in `selective` mode (a `401` from an API whose key *is* in the vault is
the tell), assign them:

```bash
onecli agents list                                       # check secretMode
onecli agents set-secret-mode --id <agent-id> --mode all # inject all matching secrets
```

No container restart needed — the gateway looks up secrets per request.

### Require human approval before sensitive actions

NanoClaw can gate risky actions in two layers:

- **Soft (behavioral).** `context/instructions.md` tells the agent to get explicit
  approval before writing to a shared sheet/doc it didn't create, bulk updates, or
  overwrites. This is guidance the agent follows, not enforcement.
- **Hard (OneCLI gateway).** OneCLI can *hold* an outbound credentialed request and
  require a human to approve it before it leaves the proxy — enforcement the agent
  can't talk its way around. Approval rules are matched on the **outbound HTTP
  request** (host + method + path) and configured in the OneCLI web UI at
  **http://127.0.0.1:10254**. The NanoClaw host answers pending approvals by DMing
  an approver — already wired, nothing to configure in this template.

### If an MCP server won't start without its env var

Some MCP servers read their API key from the environment *at startup*. The vault
injection covers the outbound API call, not process startup. If a server fails to
boot, give it a **non-secret placeholder** so it starts — the real credential is
still injected by the proxy on the outbound call:

```json
"exa": {
  "command": "npx",
  "args": ["-y", "exa-mcp-server"],
  "env": { "EXA_API_KEY": "onecli-managed" }
}
```

Most servers don't need this — try without an `env` block first.

## Troubleshooting: the agent never replies after you create it

If you created the agent **by hand** — `ncl groups create` on a NanoClaw version
that doesn't support `--template` stamping — the first message may route but the
agent never spawns. The usual cause is a **missing container-config row**: the
agent has no container to run in, so the host silently fails to start it. Tell-tale
sign in `logs/nanoclaw.error.log`:

```
wakeContainer failed … "Container config not found for agent group: <id>"
```

Fix (both steps):

1. **Create the config row** (idempotent — safe to re-run):
   ```bash
   pnpm exec tsx scripts/q.ts data/v2.db \
     "INSERT OR IGNORE INTO container_configs (agent_group_id, updated_at) \
      VALUES ('<agent-group-id>', '2020-01-01T00:00:00Z')"
   ```
2. **Restart the host** so it re-reads the DB — a running host can hold a stale
   SQLite (WAL) view and not see the new row:
   ```bash
   # macOS
   launchctl kickstart -k gui/$(id -u)/<launchd-label>
   # Linux
   systemctl --user restart <unit>
   ```

The next message then spawns the agent normally.

**You should NOT hit this** if you stamp with `ncl groups create --template …` (the
stamp creates the config row for you) or if you complete the Discord "which agent?"
approval card (that path initialises the agent properly too). It's specific to the
manual create-then-wire path.
