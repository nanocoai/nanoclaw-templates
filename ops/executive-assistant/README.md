# Executive Assistant Template

A NanoClaw agent template for executive support: manage the calendar, coordinate
meetings, prep the executive, triage the inbox, arrange travel, and track
follow-ups — across Google Workspace or Microsoft 365.

## MCP packages (verified against npm registry, 2026-07)

This template's `.mcp.json` uses these real, installable npm packages:

| Server              | Package                          | Notes                                                    |
|---------------------|----------------------------------|----------------------------------------------------------|
| `google-workspace`  | `google-workspace-mcp`           | Gmail, Calendar, Drive, Docs, Sheets, Slides, Forms.     |
| `microsoft-365`     | `@softeria/ms-365-mcp-server`    | Outlook mail, Calendar, Teams, OneDrive via Graph API.   |
| `exa`               | `exa-mcp-server`                 | Web search for meeting prep / research.                  |

Both providers are shipped wired so you can choose. If the executive uses only
one, remove the other block from `.mcp.json` to keep MCP startup fast.

## Layout

NanoClaw stamps an agent from the four things its template parser reads — nothing
else in this folder is loaded by the parser.

```
executive-assistant/
├── .mcp.json                       # MCP servers (Google Workspace, Microsoft 365, Exa) — command + args only, no secrets
├── context/
│   └── instructions.md             # REQUIRED — the agent's standing brief + executive profile
├── skills/                         # each subfolder is one skill (loaded on demand)
│   └── executive-assistant/        #   SKILL.md = the entry; references/ = the full procedures
│       └── references/
│           ├── calendar-management.md
│           ├── meeting-coordination.md
│           ├── meeting-prep.md
│           ├── travel-logistics.md
│           ├── inbox-triage.md
│           └── task-followup.md
└── README.md                       # this file
```

Optional, if you need them: extra `context/*.md` files (auto-referenced from
`instructions.md`). The provider is not set in the template — it is chosen on the
agent later, and defaults to Claude.

## Before you stamp: fill in the executive profile

Open `context/instructions.md` and complete the **Executive profile** block —
name/role, provider (Google Workspace **or** Microsoft 365), working hours,
timezone, focus blocks, buffers, standing meetings, VIPs, and auto-decline rules.
The agent can't defend time it doesn't understand. Pick ONE calendar/mail
provider; the template ships both wired so you can choose.

## Stamp an agent from this template

```bash
ncl groups create --template ./executive-assistant --name "Executive Assistant"
```

Then wire it to a channel as usual (`/manage-channels`). Skills auto-trigger by
task — they are not pre-loaded.

## Credentials — via OneCLI, not env vars

**No API keys live in this template.** NanoClaw never passes secrets into agent
containers as env vars. The OneCLI gateway holds your credentials in its vault
and injects them into outbound HTTPS calls at the proxy boundary — so the
Google/Microsoft/Exa MCP servers reach their APIs authenticated without the token
ever sitting in `.mcp.json`, the container env, or chat context.

That is why `.mcp.json` here carries only `command` + `args`. Do not add an `env`
block with real keys.

### 1. Register each credential in the OneCLI vault

Use the OneCLI web UI at **http://127.0.0.1:10254** (or `onecli secrets --help`).
Create one secret per service you use, matched to that service's API host:

| Service          | API host to match         | Auth style*             | Where to get the key                              |
|------------------|---------------------------|-------------------------|---------------------------------------------------|
| Google Workspace | `www.googleapis.com`      | OAuth 2.0 `Bearer`      | Google Cloud Console → OAuth client + scopes      |
| Microsoft 365    | `graph.microsoft.com`     | OAuth 2.0 `Bearer`      | Entra ID → App registration → Graph permissions   |
| Exa              | `api.exa.ai`              | `x-api-key` header      | dashboard.exa.ai → API Keys                        |

\* Google and Microsoft use OAuth — you register the app, grant Calendar/Mail
scopes, and store the resulting token/refresh credentials in the vault. Confirm
the exact scopes and header against each provider's current API docs. You only
need to configure the provider the executive actually uses.

### 2. Let the agent see the secrets

Auto-created agents default to `all` secret mode, so every vault secret whose
host pattern matches is injected automatically — usually nothing more to do.
If the agent is in `selective` mode (a `401` from an API whose key *is* in the
vault is the tell), assign them:

```bash
onecli agents list                                       # check secretMode
onecli agents set-secret-mode --id <agent-id> --mode all # inject all matching secrets
```

No container restart needed — the gateway looks up secrets per request.

### Require human approval before sensitive actions

The template gates real-world actions — *sending an invite or email*, *accepting/
declining/canceling on the executive's behalf*, and *booking travel* — behind
approval. NanoClaw enforces this in two layers:

**Soft (behavioral).** `context/instructions.md` tells the agent to present
drafts and wait for an explicit "yes" before any send, calendar RSVP, travel
booking, or bulk op. This is guidance the agent follows, not enforcement.

**Hard (OneCLI gateway).** OneCLI can *hold* an outbound credentialed request and
require a human to approve it before it leaves the proxy — enforcement the agent
can't talk its way around. It's a two-sided flow:

- **Server-side (OneCLI):** decide *which* requests to hold. Approval policies are
  configured in the OneCLI web UI at **http://127.0.0.1:10254**. As of
  `onecli@1.3.0` the CLI's `rules create --action` only supports `block` and
  `rate_limit`, not `approve` — so use the web UI for approval rules.
- **Host-side (NanoClaw):** already wired. When the gateway emits a pending
  approval, NanoClaw DMs an approver (scoped admin → global admin → owner) for a
  yes/no. Nothing to configure in this template.

Gating is matched on the **outbound HTTP request** (host + method + path), not on
the MCP tool name. So to require approval before, e.g., sending a Gmail message or
creating a Calendar event with external guests, target the corresponding
`www.googleapis.com` / `graph.microsoft.com` endpoint in the rule (confirm the
exact path against the provider's API docs). Caveat: if a server-side rule exists
but the NanoClaw host isn't running to answer it, the gated call hangs until the
gateway times out.

### If an MCP server won't start without its env var

Some MCP servers read their API key from the environment *at startup* and refuse
to boot without it. The vault injection above covers the outbound API call, not
process startup. If a server fails to start, give it a **non-secret placeholder**
so it boots — the real credential is still injected by the proxy on the outbound
call. Add only the placeholder (never the real key) to that server in `.mcp.json`:

```json
"exa": {
  "command": "npx",
  "args": ["-y", "exa-mcp-server"],
  "env": { "EXA_API_KEY": "onecli-managed" }
}
```

Most servers don't need this — try without an `env` block first.
