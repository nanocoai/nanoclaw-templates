# AdaptlyPost social media manager

[AdaptlyPost](https://adaptlypost.com) is a paid service. Every plan
(Creator, Pro and Enterprise) includes API access, and every plan starts
with a 7-day free trial that needs no card. See
[current plans](https://adaptlypost.com/pricing). You bring your own
AdaptlyPost account, your own API key and your own connected social
accounts. The template ships no key, no billing, no referral link, no model
and no provider.

## What it does

A social media manager agent for one brand. It drafts posts in the brand's
voice, shows them to you, and after an explicit "yes" schedules or publishes
them on Instagram, X, Bluesky, Mastodon, TikTok, Threads, LinkedIn, Facebook,
Pinterest and YouTube. It then checks each network's result separately,
explains failures, retries once the cause is fixed, and answers performance
questions from AdaptlyPost's analytics (views, likes, comments, followers,
top posts, network comparisons).

It includes one paused weekly task (a Monday review of last week and the
week ahead), the `adaptlypost` skill with references for media, analytics,
credentials and onboarding, and a `welcome` skill.

## Layout

```
adaptlypost/
├── plugin.json                     # Agent Plugins manifest
├── mcp.json                        # the hosted AdaptlyPost MCP server, no credentials
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   └── instructions.md         # standing brief: brand profile, approvals, hard rules
│   └── tasks/
│       └── weekly-review.md        # Monday 9 AM review (created PAUSED)
├── skills/
│   ├── adaptlypost/                # the posting and analytics workflow
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── media.md            # uploading files and URLs
│   │       ├── analytics.md        # which report answers which question
│   │       ├── credentials.md      # read on auth errors
│   │       └── onboarding.md       # first-run brand profile
│   └── welcome/                    # first contact on a new channel
│       └── SKILL.md
└── README.md
```

## Stamp an agent from this template

Copy this folder to `templates/social-media/adaptlypost` in your NanoClaw
install, then:

```bash
ncl groups create --template social-media/adaptlypost --name "Social Media Manager"
```

Wire it to a channel as usual (`/manage-channels`). On first contact the
agent checks the connection, lists your connected accounts and asks a few
questions about the brand.

## Connect your AdaptlyPost key

| | |
|---|---|
| MCP endpoint | `https://mcp.adaptlypost.com/mcp` (streamable HTTP, hosted by AdaptlyPost) |
| API host to match | `mcp.adaptlypost.com` |
| Auth style | `Authorization: Bearer <key>`, injected by the credential gateway |
| Where to get the key | https://adaptlypost.com/api-tokens (keys start with `adaptly_`) |

The key has no scopes. It carries a workspace role you pick when you create
it, and it can never do more than the member who created it:

| Role | The agent can |
|------|---------------|
| Viewer | Read accounts, posts and analytics |
| Contributor | The above, plus upload media and create and edit its own drafts. A person publishes from AdaptlyPost |
| Editor | The above, plus schedule, publish, retry, bulk schedule, delete, work on other members' posts, and trigger an analytics sync |

Start with **Contributor** if you want every post to pass a human in
AdaptlyPost, and move to **Editor** when you trust the agent to publish.
An Admin key can do what an Editor key can. Create a key for this agent
only, so you can revoke it on its own. If its creator is demoted, the key
loses what the new role lacks on the next call; if the creator leaves the
workspace, the key stops working and the agent asks for a new one.

**On demand.** Don't set anything up first. When the agent finds AdaptlyPost
unauthenticated it asks you to connect it and shows the gateway's connect
link when there is one. Paste the key there, then tell the agent to retry.

**Up front, with OneCLI.** Save the key to a private file, then:

```bash
onecli secrets create --name AdaptlyPost --type generic \
  --host-pattern mcp.adaptlypost.com \
  --header-name Authorization --value-format 'Bearer {value}' \
  --file <private-key-file>
```

Delete the file afterwards. If the agent is in `selective` secret mode, assign
the secret to it (`onecli agents set-secret-mode --id <agent-id> --mode all`,
or assign just this one). Restart the group if the AdaptlyPost tools were
missing before the key was stored:

```bash
ncl groups restart --id <group-id>
```

Never put the key in `mcp.json`, in chat, or in the container environment.

## Approvals

The standing brief makes the agent show the final post and wait for an
explicit "yes" before it publishes, schedules, bulk schedules, retries,
unschedules or deletes. That rule is behavioral: the agent follows it, it is
not enforced.

The hard limit is the key's role. Every tool call goes to the same
`POST https://mcp.adaptlypost.com/mcp`, so a gateway approval rule matched on
host, method and path cannot tell a read from a publish. If you need a
guarantee that nothing goes live without a person, use a **Contributor** key:
AdaptlyPost itself refuses schedule and publish for it, and the agent saves
drafts instead.

## The weekly review (scheduled task)

`tasks/weekly-review.md` runs Mondays at 9 AM in your install's timezone: last
week's headline numbers, the top post, any failed networks, and what's queued
for the week. It is read only and ships **paused**. The agent offers to turn
it on during onboarding, or:

```bash
ncl tasks list --group <agent-group-id> --status paused
ncl tasks resume <task-id>
```

## First useful action

Ask: "List my connected accounts, then draft a LinkedIn and a Threads post
about [topic] as drafts. Don't publish anything."

## Revoking and removing

Revoke the key at https://adaptlypost.com/api-tokens and delete the secret
from the gateway. Removing the group alone does not revoke AdaptlyPost
access. Deleting a post in AdaptlyPost never removes what is already live on
a network.

Created by [AdaptlyPost](https://adaptlypost.com). This registry copy is
under the repository's MIT license.
