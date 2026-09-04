# Home Assistant Agent Template

A NanoClaw agent template for a house running [Home Assistant](https://www.home-assistant.io/).
It talks to your own HA instance through Home Assistant's built-in
[**Model Context Protocol Server**](https://www.home-assistant.io/integrations/mcp_server/)
integration, and reads and controls **what you have exposed to Assist** — that
expose list, kept in Home Assistant, is the whole permission model. Connect a new
device, expose it, tell the agent, and it is there.

Anything it can do can also be put on a schedule — "boil the kettle every
Friday morning" — which anyone in the chat can ask for, set up once with a
confirmation, and pause or cancel later.

## Layout

NanoClaw stamps an agent from the parts of this folder its plugin reader loads
(`skills/` and the `ai.nanoco.nanoclaw/` extension dir); README.md is not one of
them.

```
home-assistant/
├── plugin.json                       # Agent Plugins manifest (marks the folder as a plugin)
├── ai.nanoco.nanoclaw/
│   └── context/
│       ├── instructions.md           # the agent's standing brief
│       └── additional_context/
│           ├── tasks.md              #   one yes at creation, `ncl tasks`, a self-contained prompt
│           └── memory.md             #   which files live in `memory/`, flat beside index.md
├── skills/
│   ├── welcome/                      # first contact: intro, then run the onboarding
│   │   └── SKILL.md
│   └── homeassistant/                # the router + all mechanics
│       ├── SKILL.md                  #   entry: capabilities → references, the tools, day-to-day control
│       └── references/
│           ├── connecting.md         #   the integration, the HTTPS URL, the token, every 401
│           └── onboarding.md         #   probe first, then infer the house from the snapshot
└── README.md                         # this file
```

No `mcp.json` (see below) and no predefined tasks — home control is
request-driven. Schedules are created on request instead, against whatever that
house actually has: the agent sets them up itself with `ncl tasks`, no admin
approval involved.

## Before you stamp

Five prerequisites, all on your side. The agent walks you through them in chat,
but nothing works until they are true.

| # | Prerequisite | Where |
|---|---|---|
| 1 | Home Assistant **2025.2 or newer** | your instance |
| 2 | The **Model Context Protocol Server** integration added, with the **Assist** API selected | Settings → Devices & services → Add integration → "Model Context Protocol Server" |
| 3 | The entities you want it to see **exposed to Assist** | Settings → Voice assistants → Expose |
| 4 | A **long-lived access token**, created by an **administrator** user | your HA profile → Security → Long-Lived Access Tokens → Create Token |
| 5 | An **HTTPS** endpoint for HA, reachable from the container | see below |

Nothing to install: the integration ships with Home Assistant core. Step 3 is
where the agent's reach is actually decided — it can only read and control what
is exposed, and nothing in the chat can widen that. Home Assistant exposes new
lights, switches, covers, climate, fans, media players, scenes, scripts, vacuums
and the common sensors by itself (the "Expose new entities" default), so a
typical house is mostly visible on day one. **Locks are not auto-exposed** and
stay invisible until you expose them on purpose. Multi-select on the Expose tab
does the rest in one pass.

### The URL has to be HTTPS

NanoClaw only accepts plain `http://` for `localhost`, so
`http://192.168.1.x:8123` will not stamp — a LAN address is neither localhost
nor HTTPS, and it is rejected before the agent ever calls it. You need one of:

- **Your own reverse proxy** — Caddy, nginx, or a Cloudflare Tunnel in front of
  HA. Free, some setup.
- **Home Assistant Cloud (Nabu Casa)** — the no-effort route. It is a **paid
  subscription that you buy and hold yourself**; this template ships no account
  and no key. Current plans and pricing:
  <https://www.nabucasa.com/pricing/>. The plan is **Home Assistant Cloud**; it
  gives you an `https://<id>.ui.nabu.casa` hostname, which is all the agent
  needs.

**HA on the same host is not a shortcut.** The URL check exempts `localhost`,
`127.0.0.1` and `host.docker.internal` from the HTTPS rule, so
`http://host.docker.internal:8123` stamps. It does not connect: the agent
container's only route out is the OneCLI gateway, which sits on the agent's
internal Docker network under the name `host.docker.internal` itself, so that
address reaches the gateway, not your machine, and the dial fails before any
header matters. A local HA needs an HTTPS hostname the gateway can resolve,
same as a remote one.

The endpoint the agent connects to is `https://<your-host>/api/mcp/assist` —
the Assist API's own path, which Home Assistant serves whatever else the
integration is configured with.

## Stamp an agent from this template

```bash
ncl groups create --template lifestyle/home-assistant --name "Home"
```

Wire this group to its own messaging bot, separate from any other NanoClaw
agent you run — a shared bot mixes this agent's house-control context and
memory into another agent's chat history, and there is no way to unmix them
afterwards.

Then wire it to a chat as usual (`/manage-channels`) and say hi. The agent
introduces itself, asks for the HTTPS URL, walks you through putting the token in
the OneCLI vault, and only then calls `add_mcp_server` (which raises an **admin
approval card** — approve it). **Then restart the group.** MCP servers only load
at container start, so nothing connects until you do:

```bash
ncl groups restart --id <group-id> --message "connect home assistant"
```

New or newly exposed entities need no restart — the agent picks them up on its
next read.

**The vault entry has to exist before the server is wired**, and the agent is
instructed to keep that order. Home Assistant's MCP server advertises OAuth
metadata, so a first connect without the header does not just fail and retry: the
client runs OAuth discovery, registers itself with an empty token, and
permanently stops sending requests the gateway can inject into. Adding the secret
afterwards does not fix it — recovery is an operator deleting the stale
`mcpOAuth` entry from the group's `.claude-shared/.credentials.json` and
restarting (see the connecting reference, section 6).

## Why there is no `mcp.json`

This is the non-obvious part, and the one a future maintainer will "fix" by
copying the journalist template. Don't.

The journalist can ship `{"APIFY_TOKEN": "placeholder"}` because `api.apify.com`
is the same host for every user: the only per-user value is a **credential**, and
the placeholder convention covers it. Home Assistant's per-user value is the
**address**. A placeholder URL would stamp cleanly and fail at runtime — and once
stamped it is unfixable from the agent side: `ncl groups config add-mcp-server`
and `remove-mcp-server` both refuse a server name owned by a plugin and tell you
to restamp the plugin instead. Fixing a wrong URL would then mean hand-editing
`templates/lifestyle/home-assistant/mcp.json` on the host and restamping, and it
would also close the `--headers` fallback below, which is blocked by the same
guard.

Wiring the server at onboarding keeps it **user-owned**: the URL is asked in
chat, and both credential routes stay open.

## Credentials: via OneCLI, not env vars

**No token lives in this template.** NanoClaw never passes secrets into agent
containers as env vars, and `add_mcp_server` has no way to set a header anyway.
The token goes into the OneCLI vault, matched on your HA hostname, and the
gateway injects it into outbound calls at the proxy boundary:

| Field | Value |
|---|---|
| API host | your HA hostname (the `<host>` in `https://<host>/api/mcp/assist`) |
| Auth style | `Authorization: Bearer <token>` |
| Scopes | none to pick — a long-lived access token carries the full permissions of the HA user it was created under |
| Header | `Authorization` |
| Value format | `Bearer {value}` |
| Where to get it | Home Assistant profile (bottom-left avatar) → Security → Long-Lived Access Tokens → Create Token |

The agent hands you a prefilled OneCLI link during onboarding. The host-side
equivalent:

```bash
onecli secrets create --name "Home Assistant" --type generic \
  --host-pattern <host> --header-name Authorization \
  --value-format "Bearer {value}"
```

**Fallback, if the gateway does not inject.** Injection on HTTP-transport MCP
calls is verified: the gateway MITMs both `http://` and `https://` and applies a
matching vault entry to either. If calls still `401` with a correct vault entry,
an operator can put the header on the server directly — this works precisely
because the server is not plugin-owned:

```bash
ncl groups config add-mcp-server --id <group-id> --name homeassistant \
  --url https://<host>/api/mcp/assist \
  --headers '{"Authorization":"Bearer <long-lived-token>"}'
ncl groups restart --id <group-id> --message "reconnect Home Assistant"
```

## Where the connection lives

- **The URL** is an identifier, so it goes on disk: the approved `add_mcp_server`
  writes it to the central DB, which is materialized into the group's
  `container.json` and mounted read-only in the container.
- **The token** sits in the OneCLI vault on the host. It never reaches
  `container.json`, the container env, or the chat.

Neither is a file the agent maintains — which is why the restart after approval
is needed before the server shows up.

## What the agent writes

Only notes in `memory/`, as flat files beside `index.md` and linked from its
Map: `schedules.md` for standing tasks, `preferences.md` and `quirks.md` for
what it picks up along the way — a usual temperature, a favourite scene, a
sensor that lags. No subfolders, so the layout stays whatever NanoClaw's own
memory system expects as it upgrades. It writes no skills and nothing into Home
Assistant.

## Security, honestly

The agent sees a chat display name and nothing more — it cannot see roles or
users — so **anyone who can message the chat can drive whatever is exposed**.
Treat the chat's membership as the real access list, and the expose list as the
ceiling on what that access reaches.

The gates that are actually enforced sit outside the agent:

- **The Assist expose list in Home Assistant.** The MCP server only serves
  entities exposed to Assist, so an unexposed lock cannot be touched however the
  chat argues. This is the permission model, it lives in HA, and the agent
  cannot change it.
- **Admin approval** on wiring changes: `add_mcp_server` cannot connect anything
  without a human approving the card.
- **OneCLI approval policies**, which can hold an outbound request by host and
  path before it leaves the proxy.

Inside the chat, the standing brief makes the agent read state before it acts and
confirm anything physical and hard to undo — unlocking, opening, heating, running
a motor. That is a good default, not a lock.

---

Template by [Amit Yanay](https://github.com/CrAzyScreamx).
