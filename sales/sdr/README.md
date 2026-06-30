# SDR Agent Template

A NanoClaw agent template for sales development: research prospects, enrich
contacts, draft outbound sequences, and hand qualified prospects to an AE.

## Layout

NanoClaw stamps an agent from the few things its template parser reads. Nothing
else in this folder is loaded by the parser.

```
sdr/
├── .mcp.json                       # MCP servers (HubSpot, Apollo, Exa): command + args only, no secrets
├── agent.json                      # OPTIONAL: provider override, e.g. {"provider": "..."}
├── context/
│   └── instructions.md             # REQUIRED: the agent's standing brief
├── skills/
│   └── sdr-agent/                  # one skill: the SDR operating system (auto-triggers on SDR tasks)
│       ├── SKILL.md                #   entry: operating logic + routing to the plays below
│       └── references/             #   the mechanics, read on demand
│           ├── prospect-research.md
│           ├── contact-enrichment.md
│           ├── outbound-sequencing.md
│           └── crm-hygiene.md
└── README.md                       # this file
```

Optional, if you need them: `agent.json` (`{"provider": "..."}`) and extra
`context/*.md` files (auto-referenced from `instructions.md`). If `agent.json`
is absent or omits `provider`, the agent defaults to Claude.

## Stamp an agent from this template

```bash
ncl groups create --template sales/sdr --name "SDR Agent"
```

Then wire it to a channel as usual (`/manage-channels`). The skill auto-triggers
by task; it is not pre-loaded.

## Credentials: via OneCLI, not env vars

**No API keys live in this template.** NanoClaw never passes secrets into agent
containers as env vars. The OneCLI gateway holds your credentials in its vault
and injects them into outbound HTTPS calls at the proxy boundary, so the
HubSpot/Apollo/Exa MCP servers reach their APIs authenticated without the token
ever sitting in `.mcp.json`, the container env, or chat context.

That is why `.mcp.json` here carries only `command` + `args`. Do not add an `env`
block with real keys.


### 1. Register each credential in the OneCLI vault (manual route)

Use the OneCLI web UI at **http://127.0.0.1:10254** (or `onecli secrets --help`).
Create one secret per service, matched to that service's API host:

| Service | API host to match  | Auth style*           | Where to get the key                          |
|---------|--------------------|-----------------------|-----------------------------------------------|
| HubSpot | `api.hubapi.com`   | `Authorization: Bearer` | **Service Key** (Beta), see below             |
| Apollo  | `api.apollo.io`    | `X-Api-Key` header    | Admin Settings → Integrations → API keys      |
| Exa     | `api.exa.ai`       | `x-api-key` header    | dashboard.exa.ai → API Keys                   |

\* Confirm the exact header/param against each provider's current API docs when
you configure the vault entry.

#### HubSpot: create a Service Key (Beta)

The local HubSpot MCP server authenticates with a **Service Key**, HubSpot's
account-level credential for system-to-system integrations (public beta). It is
not a Personal Access Key, not a Developer API Key, and not the OAuth flow the
hosted `mcp.hubspot.com` server uses.

1. In HubSpot, go to **Development > Keys > Service keys** (you need Super Admin
   or "Developer tools access").
2. Create a key and grant exactly these scopes:

   ```
   crm.objects.contacts.read
   crm.objects.contacts.write
   crm.objects.companies.read
   crm.objects.deals.read
   crm.objects.deals.write
   crm.objects.owners.read
   crm.objects.notes.read
   crm.objects.notes.write
   crm.lists.read
   crm.lists.write
   ```

3. Copy the key (a `pat-...` Bearer token) and give it to OneCLI for host
   `api.hubapi.com`, via either the connect link below or the manual route above.

A Service Key only carries scopes the creating user already has, so use an
account with full CRM access. HubSpot suggests rotating the key about every six
months.

#### Apollo and Exa keys

**Apollo** keys are scoped per endpoint. Under **Admin Settings > Integrations >
API keys**, create a key and grant it the endpoints the agent uses (prospect
search, contact match/enrichment, sequences), for example:

```
POST https://api.apollo.io/api/v1/people/match
POST https://api.apollo.io/api/v1/people/bulk_match
```

**Exa**: open your dashboard > API key, then copy an existing key or create a
new one.

Give each key to OneCLI for its host (`api.apollo.io`, `api.exa.ai`), via the
connect link below or the manual route above.

### Easiest path: let the agent hand you a connect link

You don't have to set anything up before the agent runs. The first time it calls
a service that isn't connected, it replies with a ready-to-open OneCLI link,
prefilled with that service's host and path, for example:

```
http://127.0.0.1:10254/p/<project-id>/connections/custom?create=generic&host=api.hubapi.com&path=/*&name=HubSpot%20API%20Key
```

Open it, paste that service's API key, and ask the agent to retry. The key lands
in the OneCLI vault the same way as the manual route below, so the proxy injects
it on every later call. Use this when you'd rather connect on demand than set all
three services up front.

### 2. Let the agent see the secrets

Auto-created agents default to `all` secret mode, so every vault secret whose
host pattern matches is injected automatically; usually nothing more to do.
If the agent is in `selective` mode (a `401` from an API whose key *is* in the
vault is the tell), assign them:

```bash
onecli agents list                                       # check secretMode
onecli agents set-secret-mode --id <agent-id> --mode all # inject all matching secrets
```

No container restart needed; the gateway looks up secrets per request.

### Require human approval before sensitive actions

The original template gated tools like *send email*, *enrol in a sequence*, and
*create/update a deal* behind a per-tool `requireApproval` list. NanoClaw enforces
this in two layers:

**Soft (behavioral).** `context/instructions.md` tells the agent to present
drafts and wait for an explicit "yes" before any send, enrolment, deal write, or
bulk op. This is guidance the agent follows, not enforcement.

**Hard (OneCLI gateway).** OneCLI can *hold* an outbound credentialed request and
require a human to approve it before it leaves the proxy: enforcement the agent
can't talk its way around. It's a two-sided flow:

- **Server-side (OneCLI):** decide *which* requests to hold. Approval policies are
  configured in the OneCLI web UI at **http://127.0.0.1:10254**. As of
  `onecli@1.3.0` the CLI's `rules create --action` only supports `block` and
  `rate_limit`, not `approve`, so use the web UI for approval rules.
- **Host-side (NanoClaw):** already wired. When the gateway emits a pending
  approval, NanoClaw DMs an approver (scoped admin → global admin → owner) for a
  yes/no. Nothing to configure in this template.

Gating is matched on the **outbound HTTP request** (host + method + path), not on
the MCP tool name. So to require approval before, e.g., sending a HubSpot email or
enrolling a sequence, target the corresponding `api.hubapi.com` endpoint in the
rule (confirm the exact path against HubSpot's API docs). Caveat: if a server-side
rule exists but the NanoClaw host isn't running to answer it, the gated call hangs
until the gateway times out.
