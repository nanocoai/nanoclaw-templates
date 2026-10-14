# Content Agent Template

A NanoClaw agent template for content creators: scan a niche for what's rising, watch
named competitors, study the hooks that land, flag verified industry news (platform and
algorithm changes), and triage the inbox. It does the
research grind (one small, ranked, sourced digest per run, with strict sourcing and no
fabrication) and hands the creative choice back. It only drafts when explicitly asked;
the creator makes the thing, decides, and publishes.

## Layout

```
content-template/
├── .mcp.json                          # MCP servers (Apify, Exa, Gmail): no secrets
├── context/
│   └── instructions.md                # REQUIRED: the agent's standing brief (persona + ground rules)
├── skills/
│   └── content-agent/                 # one skill: the research workflow (auto-triggers on content-research tasks)
│       ├── SKILL.md                   #   entry: operating logic + routing to the modes below
│       └── references/
│           ├── content-onboarding.md  #   learn the creator's profile (beat, metric, competitors)
│           ├── trend-digest.md        #   what's rising in the niche
│           ├── competitors.md         #   what's landing for named competitors + gaps to own
│           ├── hooks.md               #   a study of competitors' hook patterns
│           ├── inbox-triage.md        #   sort real opportunities vs scams (Gmail or pasted, Exa-verified)
│           ├── draft-criteria.md      #   how to draft collaboratively, on explicit request only
│           └── credentials.md         #   connecting Apify/Exa/Gmail via OneCLI (read on auth errors)
├── tasks/                             # scheduled monitors: weekly digests (Mon 9am) + daily inbox triage (M-F 9am)
└── README.md                          # this file
```

## Stamp an agent from this template

```bash
ncl groups create --template content/content-agent --name "Content Agent"
```

Then wire it to a channel as usual (`/manage-channels`). On first use the agent gets to
know the creator in a short chat: their niche, platform and format, the exact sources
and keywords to scrape, and 3-5 competitors to benchmark. It stores that profile in its workspace (alongside the
per-competitor baselines, hook records, and inbox ledger it builds up over time) and
reads them before every run, so its digests sharpen with each run instead of starting
from generic trends.

## Scheduled digests (paused by default)

The `tasks/` folder defines four scheduled runs: weekly **trend**, **competitor**, and
**hook** digests (Mondays 9am) and a weekday **inbox triage** (Mon–Fri 9am). Per
NanoClaw's template-task rules they're created **paused**: stamping never starts
background work without consent. Activate the ones you want with:

```bash
ncl tasks list --group <agent-group-id> --status paused
ncl tasks resume <task-id>
```

Or just ask the agent to activate them. Requires a NanoClaw build with template
scheduled tasks; on older builds the `tasks/` folder is ignored and you can ask for any
digest on demand ("what's trending on my beat?").

## Credentials: via OneCLI, not env vars

**No API keys live in this template.** The OneCLI gateway holds credentials in its vault
and injects them into outbound HTTPS calls at the proxy boundary. `.mcp.json` carries
`command` + `args` and never a real key.

Each server's `env` value is set to the sentinel `"onecli-managed"` only so the MCP
server can boot; it is *present*, not a credential. Once you connect the service, the
real token is injected automatically for its host at request time. Never replace the
sentinel with a real key.

Register one secret per service in the OneCLI web UI at **http://127.0.0.1:10254** (or
let the agent hand you a prefilled connect link the first time a call fails; see
`references/credentials.md`):

| Service | API host to match | Auth style*             | Where to get the credential                        |
|---------|-------------------|-------------------------|----------------------------------------------------|
| Apify   | `api.apify.com`   | `Authorization: Bearer` | console.apify.com → Settings → API & Integrations  |
| Exa     | `api.exa.ai`      | `x-api-key` header      | dashboard.exa.ai → API Keys                        |
| Gmail   | Google OAuth      | OAuth consent           | sign in to your Google account via the connect link |

\* Confirm the exact header against each provider's current API docs when you configure
the vault entry.

**Gmail note.** Gmail uses Google OAuth, not a pasted key; the connect link opens
Google's consent screen and the token lands in the vault. It powers **inbox-triage**
only; skip connecting it and the other three modes run fine. The exact OAuth scopes and
brokering are still being finalized (see the TODO in `references/credentials.md`).

## Public data, your terms

The agent works from **public data only**, gathered through your connected tools. Apify
is scraping: you use your own token, and responsibility for complying with each
platform's terms sits with you. Avoid cookie/session-based LinkedIn scraping in any
setup; it violates LinkedIn's terms.
