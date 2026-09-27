# Flowsery site analyst

[Flowsery](https://flowsery.com) is a paid service. Both plans (Team and Pro)
include every feature, API access among them, and every account starts with
a 14-day free trial that needs no card. During the trial only the first ten
AI-detected issues can be opened in full. See
[current plans](https://flowsery.com/pricing). You bring your own Flowsery
account, your own API key and a website with the Flowsery tracking snippet
installed. The template ships no key, no billing, no referral link, no model
and no provider.

## What it does

A site analyst for your websites. It answers traffic and revenue questions
from Flowsery's analytics (visitors, sources, channels, campaigns, pages,
countries, devices, goals, conversion rate, revenue, live visitors) and
reports what is broken: the bugs, broken flows and UX problems Flowsery's AI
found in real session recordings, ranked by how many sessions they hit. It
can mark issues in progress, resolved or suspended, and, after an explicit
"yes", record goals and payments or delete them.

It includes one paused weekly task (a Monday site health report), the
`flowsery` skill with references for reports, writes, credentials and
onboarding, and a `welcome` skill.

## Layout

```
flowsery/
├── plugin.json                     # Agent Plugins manifest
├── mcp.json                        # the hosted Flowsery MCP server, no credentials
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   └── instructions.md         # standing brief: site profile, approvals, hard rules
│   └── tasks/
│       └── weekly-health-report.md # Monday 9 AM report (created PAUSED)
├── skills/
│   ├── flowsery/                   # the analytics and issues workflow
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── reports.md          # report shapes, weekly health report
│   │       ├── writes.md           # issue status, recording and deleting data
│   │       ├── credentials.md      # read on auth errors
│   │       └── onboarding.md       # first-run site profile
│   └── welcome/                    # first contact on a new channel
│       └── SKILL.md
└── README.md
```

## Stamp an agent from this template

Copy this folder to `templates/data/flowsery` in your NanoClaw install,
then:

```bash
ncl groups create --template data/flowsery --name "Site Analyst"
```

Wire it to a channel as usual (`/manage-channels`). On first contact the
agent checks the connection, lists your websites and asks what counts as a
win for you.

## Connect your Flowsery key

| | |
|---|---|
| MCP endpoint | `https://mcp.flowsery.com/mcp` (streamable HTTP, hosted by Flowsery) |
| API host to match | `mcp.flowsery.com` |
| Auth style | `Authorization: Bearer <key>`, injected by the credential gateway |
| Where to get the key | the workspace **API Tokens** page, https://flowsery.com/api-tokens (keys start with `flow_ws_`) |
| Role the key needs | **Editor** (or Admin). Contributor and Viewer keys are refused |

The key has no scopes. A workspace key reaches every website in the
workspace, carries the role you pick when you create it, and can never do
more than the member who created it. Create a key for this agent only, so
you can revoke it on its own. If its creator leaves the workspace, the key
stops working and the agent asks for a new one. If the workspace plan
lapses, the key answers 403 `subscription_required` until the plan is renewed.

**On demand.** Don't set anything up first. When the agent finds Flowsery
unauthenticated it asks you to connect it and shows the gateway's connect
link when there is one. Paste the key there, then tell the agent to retry.

**Up front, with OneCLI.** Save the key to a private file, then:

```bash
onecli secrets create --name Flowsery --type generic \
  --host-pattern mcp.flowsery.com \
  --header-name Authorization --value-format 'Bearer {value}' \
  --file <private-key-file>
```

Delete the file afterwards. If the agent is in `selective` secret mode, assign
the secret to it (`onecli agents set-secret-mode --id <agent-id> --mode all`,
or assign just this one). Restart the group if the Flowsery tools were
missing before the key was stored:

```bash
ncl groups restart --id <group-id>
```

Never put the key in `mcp.json`, in chat, or in the container environment.

## Writes and personal data

Most tools only read. Five change data, and none of them charges a customer,
moves money or touches a payment provider:

| Tool | Effect | The agent |
|------|--------|-----------|
| `update_issue_status` | Sets an issue open, in progress, resolved or suspended; reversible | Asks which state you mean |
| `track_goal`, `track_payment` | Record a goal completion or an analytics payment | Asks for a "yes" |
| `delete_goals`, `delete_payments` | Erase recorded goals or payments; permanent | Restates website, filters and range, then waits for a "yes" |

These rules are behavioral: the agent follows them, they are not enforced.
Every tool call goes to the same `POST https://mcp.flowsery.com/mcp`, so a
gateway approval rule matched on host, method and path cannot tell a read
from a delete.

Visitor profiles and payments can hold names, emails, locations and revenue.
The agent opens a visitor profile only when you ask about that visitor, and
keeps names and emails out of reports.

## The weekly health report (scheduled task)

`tasks/weekly-health-report.md` runs Mondays at 9 AM in your install's
timezone: what changed last week against the week before, the top open
issues by sessions affected, and the one thing to fix first. It is read only
and ships **paused**. The agent offers to turn it on during onboarding, or:

```bash
ncl tasks list --group <agent-group-id> --status paused
ncl tasks resume <task-id>
```

## First useful action

Ask: "How did my site do last week compared with the week before, and what's
the most common thing breaking for visitors right now?"

## Revoking and removing

Revoke the key at https://flowsery.com/api-tokens and delete the secret from
the gateway. Removing the group alone does not revoke Flowsery access.

Created by [Flowsery](https://flowsery.com). This registry copy is under the
repository's MIT license.
