# Social Strategist Template

A social media strategist for one creator or brand, across every channel they connected in
[Buffer](https://buffer.com): Instagram, TikTok, LinkedIn, YouTube, Facebook, X, Threads,
Pinterest and more. It reads your posts and their numbers through Buffer and tells you what's
actually working for you, by topic, format, hook, length, day and time of day. Every morning it picks up what
you posted and logs it with a topic tag. Ask what to post and it gives you ranked ideas grounded
in your own numbers, then writes the reel script, the carousel or the LinkedIn post in your voice,
and turns one finished piece into versions for your other platforms.

**It needs a Buffer account and your own Buffer API key**, which works on Buffer's free plan; see
the cost note below.

## Layout

```
social-strategist/
├── plugin.json                         # Agent Plugins manifest (marks the folder as a plugin)
├── mcp.json                            # Buffer's hosted MCP server; no secrets, OneCLI injects the key
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   ├── instructions.md             # persona + the 10 ground rules
│   │   └── additional_context/
│   │       └── memory-structure.md     # memory concepts + what it learns over time
│   └── tasks/                          # created PAUSED; the agent offers them at onboarding
│       ├── weekly-content-plan.md      # Monday: the week's plan
│       └── daily-post-check.md         # every day: pull new posts + fresh numbers from Buffer
├── skills/
│   ├── welcome/
│   │   └── SKILL.md                    # first contact: intro, then onboarding
│   └── social-strategist/              # one skill: routes each ask to a capability below
│       ├── SKILL.md
│       └── references/
│           ├── onboarding.md           #   connect Buffer, four questions, a first look, one offer
│           ├── credentials.md          #   connecting Buffer via OneCLI (read on auth errors)
│           ├── engagement-analysis.md  #   baselines, what works, topic scoreboard
│           ├── post-ideas.md           #   ranked ideas per platform
│           ├── script-builder.md       #   platform-shaped scripts and posts
│           └── repurpose.md            #   one piece → your other platforms
└── README.md                           # this file
```

## Stamp an agent from this template

```bash
ncl groups create --template social-media/social-strategist --name "Social Strategist"
```

Then wire it to your own chat (usually a DM) as usual (`/manage-channels`). On first use the
agent connects Buffer: it asks for your OneCLI dashboard URL and sends back a prefilled link where
you paste your Buffer API key. It reads your channels from Buffer, then asks, one at a time and
all skippable: how many days of posts to pull (each with its own numbers), how many days of
overall likes, comments, reactions and impressions (up to 365), your niche and audience in one
line, and your goal (grow, leads, community or brand). Then it pulls your history and shows you
what's working. Your voice, posting language, cadence, filming setup and off-limits topics it
learns over time instead of asking.

## What it does

| Capability | Ask it |
|------------|--------|
| engagement-analysis | "what's working on TikTok?" · "which topics are working?" |
| post-ideas | "what should I post on LinkedIn this week?" |
| script-builder | "write me a reel about pricing mistakes" |
| repurpose | "turn this YouTube video into a LinkedIn post and a TikTok" |

Every number comes from Buffer or what you told it, with the sample size and date range printed
next to it. Posts younger than 7 days are still collecting numbers and stay out of the stats;
small samples are labeled directional, and "no data yet" is said out loud rather than papered
over with generic advice. Your goal decides what counts as working. The agent sees what Buffer
sees: a channel not connected in Buffer is invisible to it.

## Recurring tasks

Both ship **paused**. At the end of onboarding the agent offers them together, in one question;
on a yes it confirms the time, updates the schedule and resumes them. Cron runs in the NanoClaw
host's timezone.

| Task | Default | What it does |
|------|---------|--------------|
| `weekly-content-plan` | Monday 09:00 (`0 9 * * 1`) | posts the week's plan to your chat |
| `daily-post-check` | every day 10:00 (`0 10 * * *`) | syncs Buffer: logs and tags new posts, refreshes numbers of posts under 7 days old; one line per new post, silent otherwise |

```bash
ncl tasks list --group <agent-group-id> --status paused
ncl tasks resume <task-id>
```

## Credentials: via OneCLI

**No API keys live in this template.** The OneCLI gateway holds your Buffer key in its vault and
injects it into every call to Buffer's MCP server at the proxy boundary, so `mcp.json` carries
only the server URL.

| Service | API host to match | Auth style | Scopes | Where to get the key |
|---------|-------------------|------------|--------|----------------------|
| Buffer (MCP) | `mcp.buffer.com` | `Authorization: Bearer` | a personal API key (needs post-metrics read access; app clients can't read metrics) | publish.buffer.com/settings/api → create an API key |
| Web search | n/a | n/a | n/a | provided by the runtime; no setup |

The agent handles the connection at first contact: it asks for your OneCLI dashboard URL and
hands you a link prefilled for `mcp.buffer.com`, so you only paste the key. It never asks for the
key in chat. No dashboard access? It sends the host-side equivalent instead, to run on the
NanoClaw machine:

```bash
onecli secrets create --name "Buffer" --type generic \
  --host-pattern mcp.buffer.com --header-name Authorization \
  --value-format "Bearer {value}" --value "<your-buffer-api-key>"
```

### Buffer troubleshooting (operator)

Buffer's MCP server loads when the agent starts. If the agent started before the key was in the
vault, restart it once the key is saved:

```bash
ncl groups restart --id <group-id> --message "connect buffer"
```

Buffer answers an unauthenticated request with an OAuth challenge. If the agent ever connected
without the key and the tools still don't appear after a restart (the agent is told to
authorize, and no 401 shows anywhere), the MCP client cached an OAuth registration: delete the
`buffer|…` key from `mcpOAuth` in `data/v2-sessions/<group-id>/.claude-shared/.credentials.json`,
reset `.claude-shared/mcp-needs-auth-cache.json` to `{}`, and restart the group.

### Buffer cost note

[Buffer](https://buffer.com/pricing) is a separate service; you bring your own account and key.
API access, including post metrics, is available on every Buffer plan, **Free** included. What
the plans change is how many channels you can connect (Free covers a few) and the API quota
(rolling 15-minute, 24-hour and 30-day windows; Essentials and Team raise the daily and monthly
caps). The agent keeps within it: a daily sync reads only posts from the last week, the backfill
pages through posts once at onboarding, and on a rate-limit error it stops and picks up next time.
Without Buffer, post ideas, scripts and repurposing still work from your niche and goal.

## Privacy

Your posts' numbers are stored in the agent's own memory so later analyses can compare periods,
and they stay in your chat with the agent. It never looks up your stats on the web, never fetches
your post links, and never shares your data with anyone.
