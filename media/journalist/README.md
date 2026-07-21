# Journalist Agent Template

A NanoClaw agent template for working journalists: monitor a beat, deliver a
morning digest, triage story pitches, find expert sources, and prep
interviews. It does the research, with strict sourcing rules and no
fabrication; the journalist writes, verifies, and publishes.

## Layout

```
journalist/
├── .mcp.json                       # MCP servers (Apify X scraper; optional Exa search): no secrets
├── context/
│   └── instructions.md             # REQUIRED: the agent's standing brief
├── skills/
│   └── journalist-agent/           # one skill: the reporting workflow (auto-triggers on newsroom tasks)
│       ├── SKILL.md                #   entry: operating logic + routing to the plays below
│       └── references/
│           ├── onboard-journalist.md   #   learn the beat + preferences
│           ├── monitor-beat.md         #   beat monitoring + morning digest
│           ├── evaluate-pitches.md     #   score inbound pitches (with tracking ledger)
│           ├── find-sources.md         #   find + vet experts (grows a source book)
│           ├── prepare-interview.md    #   one-page prep docs
│           ├── draft-story.md          #   drafts + editor pitches, on explicit request only
│           └── credentials.md          #   connecting the Apify/Exa keys via OneCLI (read on auth errors)
├── tasks/
│   └── morning-digest.md           # daily 9 AM digest (created PAUSED; see below)
└── README.md                       # this file
```

## Stamp an agent from this template

```bash
ncl groups create --template media/journalist --name "Journalist Agent"
```

Then wire it to a channel as usual (`/manage-channels`). On first use the
agent gets to know you in a short chat: your beat (topics, angles,
watchlist, outlet) and any working preferences. It stores the profile in
its workspace; every digest and pitch verdict keys off it. Over time it
also builds a pitch ledger (so the same inbound pitches are never re-read)
and a source book of the experts you approve.

## The morning digest (scheduled task)

`tasks/morning-digest.md` defines a daily 9 AM digest of what's moving on
your beat. Per NanoClaw's template-task rules it is created **paused**:
stamping never starts background work without consent. Activate it with:

```bash
ncl tasks list --group <agent-group-id> --status paused
ncl tasks resume <task-id>
```

Or just ask the agent to activate it.

Requires a NanoClaw build with template scheduled tasks; on older builds the
`tasks/` folder is ignored and you can ask for a digest on demand ("what's
new on my beat?").

## Credentials: via OneCLI, not env vars

**No API keys live in this template.** The OneCLI gateway holds credentials
in its vault and injects them into outbound HTTPS calls at the proxy
boundary. `.mcp.json` carries `command` + `args` and never a real key.

**Exception: Apify's placeholder env (leave it as-is).**
`@apify/actors-mcp-server` needs `APIFY_TOKEN` to be *present* to boot, so
`.mcp.json` sets it to the dummy value `"placeholder"`. It is not the
credential: once you connect Apify, the real token is injected automatically
for `api.apify.com` at request time. Never replace it with a real token. Exa
(optional) needs no placeholder and gets none.

Register one secret per service in the OneCLI web UI at
**http://127.0.0.1:10254** (or let the agent hand you a prefilled connect
link the first time a call fails). Both are optional; the agent works on
built-in web search alone. Apify is the recommended add-on (it powers
social-signal monitoring of X, the core of beat tracking); Exa is a lighter
search enhancement:

| Service        | API host to match | Auth style*             | Where to get the key                              |
|----------------|-------------------|-------------------------|---------------------------------------------------|
| Apify (recommended) | `api.apify.com` | `Authorization: Bearer` | console.apify.com → Settings → API & Integrations |
| Exa (optional)      | `api.exa.ai`    | `x-api-key` header      | dashboard.exa.ai → API Keys                       |

\* Confirm the exact header against each provider's current API docs when you
configure the vault entry.

### Apify cost note

The X scraper (`apidojo/tweet-scraper`) is **pay-per-result** and requires
a **paid Apify plan**; it does not run on Apify's free tier. Without one,
the digest runs on web search alone (plus Exa, if you connected it). The
skill caps sweeps by default (≤5 queries × ≤100 posts per digest run) and
prefers plain web search for anything the open web can answer. Run one
digest, check the run cost in the Apify console, then decide your schedule.

### Exa is optional

Exa adds deeper, semantic web and news search. It's a pure enhancement;
skip it and built-in web search covers research. New accounts get a free
trial; after that it's pay-as-you-go. Connect it via OneCLI (table above)
or let the agent offer a connect link during onboarding.

## Email is optional (and not part of this template)

Inbox pitch triage and past-contact search need your mailbox, which a
template cannot ship: connect Gmail (or another provider) yourself through OneCLI.
Without it, pitch triage still works on anything you paste or forward into
the chat; the scoring rubric is the same.

## Upgrade path for social coverage

X + open web covers the v1 sourcing loop. If you need more networks or hit
reliability limits, the managed upgrade path is Bright Data's social MCP:
swap or add it in `.mcp.json` and register its host in OneCLI the same way.
Avoid cookie/session-based LinkedIn scraping in any setup; it violates
LinkedIn's terms.
