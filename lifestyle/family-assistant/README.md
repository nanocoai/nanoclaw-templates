# Family Assistant Agent Template

A NanoClaw agent template for a whole household. It runs a morning brief, plans
meals and builds a grocery list (hunting the best prices), looks ahead at the
week's logistics, stays on top of the kids' school, watches prices on things the
family wants, and helps book appointments and reservations.

## Layout

NanoClaw stamps an agent from the parts of this folder its plugin reader loads
(`skills/` and the `ai.nanoco.nanoclaw/` extension dir); README.md is not one
of them.

```
family-assistant/
├── plugin.json                       # Agent Plugins manifest (marks the folder as a plugin)
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   └── instructions.md           # persona + the 7 ground rules
│   └── tasks/                        # recurring tasks, each created PAUSED
│       ├── daily-morning-brief.md
│       ├── weekly-meal-plan.md
│       ├── weekly-week-ahead.md
│       ├── weekly-school-sweep.md
│       ├── daily-price-watch.md
│       └── weekly-memory-hygiene.md
├── skills/
│   ├── welcome/                      # first contact: intro + onboarding (overrides the built-in)
│   │   └── SKILL.md
│   └── family-assistant/             # the router + all mechanics
│       ├── SKILL.md                  #   entry: capabilities → references routing
│       └── references/               #   one file per capability + setup
│           ├── connecting-google.md
│           ├── family-onboarding.md
│           ├── morning-brief.md
│           ├── meals-and-grocery.md
│           ├── week-ahead.md
│           ├── school.md
│           ├── price-watch.md
│           └── book-it.md
└── README.md                         # this file
```

There's no `mcp.json` and no scripts; every tool reaches its API through the
OneCLI proxy, so there's nothing to pin or format deterministically.

## What it does

Six capabilities, routed by the `family-assistant` skill (mechanics live in the
matching `references/*.md`):

| Capability | What it's for |
|------------|---------------|
| **morning-brief** | today at a glance: events, owners, the critical few from email/chats, weather |
| **meals-and-grocery** | plan the week's dinners off real recipes, build the list, hunt sourced deals |
| **week-ahead** | the wider planning view: deadlines, pickups, prep, what needs an owner |
| **school** | opt-in tracker: sweep dates/forms onto the calendar, track grades over time |
| **price-watch** | a standing wishlist; ping only when a price really drops |
| **book-it** | find a place, request the appointment or reservation, hold the slot |

## Configure before first use

Nothing to fill in by hand. The agent builds the family's profile conversationally on first
contact and keeps it in its memory (see
`skills/family-assistant/references/family-onboarding.md`): the people, the
calendars and inbox to read, food staples and allergies, schools, activities,
and which recurring tasks they want and when. That profile is the source of
truth every capability grounds in, and the agent keeps it current as things
change.

## Stamp an agent from this template

```bash
ncl groups create --template lifestyle/family-assistant --name "Family Assistant"
```

Then wire it to the family's group chat as usual (`/manage-channels`). Give it
**write** access to the chat you want it to post into; anywhere it should only
read for context, keep it **read-only** and it stays silent there.

## Recurring tasks

The six files in `ai.nanoco.nanoclaw/tasks/` are the scheduled runs: the morning brief, weekly
meal plan, weekly week-ahead, weekly school sweep, daily price-watch, and a weekly memory-hygiene
pass that keeps the agent's memory tidy. Each
is **created paused**: every scheduled task is opt-in, and the family turns on
the ones they want at onboarding (or later) and picks the time. The `schedule`
cron in each file is only a sensible default.

## Credentials: via OneCLI, not env vars

The agent uses three tools, all through the OneCLI proxy: **Gmail**, **Google
Calendar**, and **web search**. **No API keys live in this template**; NanoClaw
never passes secrets into agent containers as env vars; the OneCLI gateway holds
credentials in its vault and injects them into outbound HTTPS calls at the proxy
boundary.

The default is one Google account where the family funnels everything into, used
for both Gmail and Calendar. OneCLI also supports more than one account per
provider (e.g. each parent's own Gmail) as an optional path. Full step-by-step lives in
`skills/family-assistant/references/connecting-google.md`; the short version:

| Tool | Setup | Scopes | Where |
|------|-------|--------|-------|
| **Gmail** | OAuth sign-in via OneCLI; an instance without platform Google credentials asks for your own Web-app OAuth client (Client ID + Secret) from Google Cloud Console | `gmail.readonly`, `gmail.modify`, `gmail.send` | OneCLI → Apps → Gmail → Connect |
| **Google Calendar** | Same flow; one OAuth client covers both apps | `calendar.readonly`, `calendar.events` | OneCLI → Apps → Google Calendar → Connect |
| **Web search** | Provided by the runtime: used for prices, weather, and finding places to book | n/a | no per-family setup |

If a Google call ever returns `401` / `403` /
"not connected," the connector has no credential in the vault yet; the agent
walks the family through connecting it, then retries. Until Calendar is
connected, the calendar-dependent capabilities work from what they can see and
say what's missing.

### One-time Google prerequisite (self-hosted OneCLI)

The Connect screen asks for a **Client ID + Secret**. Create your own
**Web-application OAuth client** in Google Cloud Console; one client covers both Gmail and
Calendar, and the agent walks the family through the console steps in chat when a call first
fails.

### Running on a remote box?

If NanoClaw runs on a VM, the Google connect flow still happens in your browser, and Google's
sign-in has to reach OneCLI back; that usually means an SSH tunnel from your machine (never
expose OneCLI publicly when a tunnel is possible). The agent walks you through it in chat; the
exact steps live in `skills/family-assistant/references/connecting-google.md` under "Remote
box?".
