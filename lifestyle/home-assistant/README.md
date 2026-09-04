# Home Assistant Agent Template

No custom code, no add-on, no API wrapper: this agent talks to your own
[Home Assistant](https://www.home-assistant.io/) through Home Assistant's built-in
[**Model Context Protocol Server**](https://www.home-assistant.io/integrations/mcp_server/)
integration, and the **Assist expose list** you already keep in Home Assistant is
the whole permission model. It reads and controls what is exposed, nothing else.
Connect a new device, expose it, tell the agent, and it is there.

Anything it can do can also be put on a schedule — "boil the kettle every
Friday morning" — which anyone in the chat can ask for, set up once with a
confirmation, and pause or cancel later.

## What it deliberately doesn't do

- **Writes nothing into Home Assistant.** No config, no automations, no expose
  changes. When something looks wrong on that side it describes it and stops.
- **Cannot widen its own reach.** Nothing said in chat exposes an entity; only
  the Expose tab in Home Assistant does.
- **Never emulates an action it has no intent tool for.** No chaining intents
  to fake a missing capability; it says it cannot be done and why.
- **Never handles the token.** A pasted credential is not repeated and is asked
  to be rotated; the token lives in the OneCLI vault, not in chat or the template.

## What a day looks like

Once connected, this is the whole interaction model:

```
you:    is the front door locked
agent:  No - Front Door is unlocked.

you:    lock it
agent:  Front Door lock - yes to lock it?
you:    yes
agent:  Front Door is locked.

you:    how warm is the bedroom
agent:  Bedroom: 19.5°, heating set to 21°.

you:    boil the kettle every weekday at 7
agent:  Every weekday at 07:00, turn on Tami4 in the Kitchen. First run is
        tomorrow. Confirm?
you:    yes
agent:  Set. "Kettle weekdays 07:00, for Amit" - say stop it to pause or cancel.

you:    turn on the garage light
agent:  No garage light is exposed to Assist. Settings → Voice assistants →
        Expose in Home Assistant, then tell me and I'll look again.
```

Every state it reports comes from a call made right then, never from earlier
in the conversation. Anything that unlocks, opens, disarms, heats or starts a
motor asks for a yes first; a schedule asks once, at creation, and never at
run time.

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
│           ├── connecting.md         #   the integration, the URL, the token, every 401
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
| 5 | Your Home Assistant URL | the agent asks for it in chat |

Nothing to install: the integration ships with Home Assistant core. Step 3 is
where the agent's reach is actually decided — it can only read and control what
is exposed, and nothing in the chat can widen that. Home Assistant exposes new
lights, switches, covers, climate, fans, media players, scenes, scripts, vacuums
and the common sensors by itself (the "Expose new entities" default), so a
typical house is mostly visible on day one. **Locks are not auto-exposed** and
stay invisible until you expose them on purpose. Multi-select on the Expose tab
does the rest in one pass.

The endpoint the agent connects to is `<your-url>/api/mcp/assist` — the Assist
API's own path, which Home Assistant serves whatever else the integration is
configured with. If you reach Home Assistant through
[Home Assistant Cloud (Nabu Casa)](https://www.nabucasa.com/pricing/), that is
a **paid subscription you buy and hold yourself**; this template ships no
account and no key.

## Stamp an agent from this template

```bash
ncl groups create --template lifestyle/home-assistant --name "Home"
```

Wire this group to its own messaging bot, separate from any other NanoClaw
agent you run — a shared bot mixes this agent's house-control context and
memory into another agent's chat history, and there is no way to unmix them
afterwards.

Then wire it to a chat as usual (`/manage-channels`) and say hi. The agent
introduces itself, asks for the URL, walks you through putting the token in
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

There is nothing to placeholder. The server's only per-user value is your
Home Assistant address, and the agent asks for it in chat and wires the server
itself during onboarding with `add_mcp_server`.

## Credentials: via OneCLI, not env vars

**No token lives in this template.** NanoClaw never passes secrets into agent
containers as env vars, and `add_mcp_server` has no way to set a header anyway.
The token goes into the OneCLI vault, matched on your HA hostname, and the
gateway injects it into outbound calls at the proxy boundary:

| Field | Value |
|---|---|
| API host | your HA hostname alone, no scheme, port or path — one host per vault entry, comma lists do not match |
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
an operator can put the header on the server directly:

```bash
ncl groups config add-mcp-server --id <group-id> --name homeassistant \
  --url <your-url>/api/mcp/assist \
  --headers '{"Authorization":"Bearer <long-lived-token>"}'
ncl groups restart --id <group-id> --message "reconnect Home Assistant"
```

## What the agent writes

Nothing is shipped in the template; both of these are created by the agent at
runtime, on the NanoClaw side:

- **Scheduled tasks**, created with `ncl tasks` when someone in the chat asks
  for one. They live in NanoClaw's task store like any other task.
- **Memory notes** in the group's `memory/` directory, as flat files beside
  `index.md` and linked from its Map, following NanoClaw's own memory system.
  `additional_context/memory.md` tells the agent which files to keep and what
  a line carries: household preferences and device quirks. Schedules are not
  mirrored there; the task store is their only record.
  Each file appears on its first write.

It writes nothing into Home Assistant.

## Security

The agent only sees and controls what is exposed to Assist. That list lives in
Home Assistant under Settings → Voice assistants → Expose, the MCP server
enforces it, and nothing in the chat can widen it. Anyone who can message the
chat can drive what is exposed, so the expose list is where the reach is
decided.

---

Template by [Amit Yanay](https://github.com/CrAzyScreamx).
