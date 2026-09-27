# RedReplier lead scout

[RedReplier](https://redreplier.com) is a paid service. Every plan (Starter,
Pro and Business) includes API access; the plans differ in how many keywords
you can watch. See [current plans](https://redreplier.com/pricing). You bring
your own RedReplier account and your own API key. The template ships no key,
no billing, no referral link, no model and no provider.

## What it does

A lead scout for one product. RedReplier watches Reddit, Hacker News, X,
Bluesky and Facebook for the keywords you choose and scores every mention 0 to 100
against your product description. This agent reads those mentions, keeps the
real buying conversations, explains why each one is a lead, and drafts a
reply in your voice that discloses you make the product. It never posts: you
paste the reply on the network yourself. It also triages mentions (approve
or reject) and, after an explicit "yes", tunes your websites, keywords and
email alerts.

It includes one paused daily task (a morning digest of the best new
conversations with a draft reply for each), the `redreplier` skill with
references for replies, keywords, credentials and onboarding, and a
`welcome` skill.

## Layout

```
redreplier/
├── plugin.json                     # Agent Plugins manifest
├── mcp.json                        # the hosted RedReplier MCP server, no credentials
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   └── instructions.md         # standing brief: product profile, approvals, hard rules
│   └── tasks/
│       └── daily-lead-digest.md    # daily 9 AM digest (created PAUSED)
├── skills/
│   ├── redreplier/                 # the lead workflow
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── replies.md          # how a reply should read
│   │       ├── keywords.md         # choosing and pruning keywords
│   │       ├── credentials.md      # read on auth errors
│   │       └── onboarding.md       # first-run product profile
│   └── welcome/                    # first contact on a new channel
│       └── SKILL.md
└── README.md
```

## Stamp an agent from this template

Copy this folder to `templates/social-media/redreplier` in your NanoClaw
install, then:

```bash
ncl groups create --template social-media/redreplier --name "Lead Scout"
```

Wire it to a channel as usual (`/manage-channels`). On first contact the
agent checks the connection, reads the websites you monitor, and asks what
a good lead looks like for you. If you don't monitor a website yet, it
offers to add one.

## Connect your RedReplier key

| | |
|---|---|
| MCP endpoint | `https://mcp.redreplier.com/mcp` (streamable HTTP, hosted by RedReplier) |
| API host to match | `mcp.redreplier.com` |
| Auth style | `Authorization: Bearer <key>`, injected by the credential gateway |
| Where to get the key | https://redreplier.com/api-tokens (keys start with `redreplier_`) |
| Role the key needs | **Editor** (or Admin). Contributor and Viewer keys are refused |

The key has no scopes. It carries the workspace role you pick when you
create it, can never do more than the member who created it, and reaches
every website in that workspace. Create a key for this agent only, so you
can revoke it on its own. If its creator leaves the workspace, the key stops
working and the agent asks for a new one. If the organization's plan stops
including API access, every call answers 403 `subscription_required` until the
plan is renewed.

**On demand.** Don't set anything up first. When the agent finds RedReplier
unauthenticated it asks you to connect it and shows the gateway's connect
link when there is one. Paste the key there, then tell the agent to retry.

**Up front, with OneCLI.** Save the key to a private file, then:

```bash
onecli secrets create --name RedReplier --type generic \
  --host-pattern mcp.redreplier.com \
  --header-name Authorization --value-format 'Bearer {value}' \
  --file <private-key-file>
```

Delete the file afterwards. If the agent is in `selective` secret mode, assign
the secret to it (`onecli agents set-secret-mode --id <agent-id> --mode all`,
or assign just this one). Restart the group if the RedReplier tools were
missing before the key was stored:

```bash
ncl groups restart --id <group-id>
```

Never put the key in `mcp.json`, in chat, or in the container environment.

## What the agent can and cannot change

No tool on the RedReplier MCP server charges money or changes your plan.
Keywords that do not fit the plan's keyword count stay pending until you
change the plan yourself in RedReplier.

The standing brief makes the agent ask for an explicit "yes" before it adds
or deletes a website, changes keywords or changes alert settings. Triage
(approve and reject) is reversible and runs without asking when you ask for
it. That rule is behavioral: the agent follows it, it is not enforced. Every
tool call goes to the same `POST https://mcp.redreplier.com/mcp`, so a
gateway approval rule matched on host, method and path cannot tell a read
from a delete.

Two calls cannot be undone: `delete_keyword` erases the keyword and every
mention it produced, and `delete_website` stops all monitoring for a site
(re-adding the same URL revives it).

## The daily lead digest (scheduled task)

`tasks/daily-lead-digest.md` runs every day at 9 AM in your install's
timezone: the best new conversations from the last 24 hours, at most five,
each with a link and a draft reply. It does not triage or change anything,
and it ships **paused**. The agent offers to turn it on during onboarding,
or:

```bash
ncl tasks list --group <agent-group-id> --status paused
ncl tasks resume <task-id>
```

## First useful action

Ask: "Show me the three best new leads from this week and draft a reply for
the top one. Don't change anything."

## Revoking and removing

Revoke the key at https://redreplier.com/api-tokens and delete the secret
from the gateway. Removing the group alone does not revoke RedReplier access
or stop RedReplier's own monitoring and email alerts.

Created by [RedReplier](https://redreplier.com). This registry copy is under
the repository's MIT license.
