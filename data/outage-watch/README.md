# Outage Watch Template

A NanoClaw template that watches your cloud/SaaS/data-infra dependencies and tells
you the moment one is actually having an incident — cross-referencing each
vendor's own status page against live web signal, since status pages are
reliably slower than the internet to admit a problem. Confirmed, critical-tier
incidents can escalate to a real phone call via Dial; everything else stays in
chat.

## Layout

```
outage-watch/
├── plugin.json                              # Agent Plugins manifest
├── mcp.json                                 # Tavily MCP server: placeholder credential, no secrets
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   ├── instructions.md                  # the persona — two-signal triage, tiered escalation
│   │   └── additional_context/
│   │       ├── services.md                  # EDIT ME: which services you watch, and their tier
│   │       ├── escalation-policy.md         # the two-signal method, what each tier/state does
│   │       └── memory-structure.md          # where learned state (open incidents) lives
│   └── tasks/
│       └── dependency-check.md              # every 15 minutes — checks every watched service
├── skills/
│   └── outage-triage/
│       └── SKILL.md                         # the check itself: official + unofficial signal, tiering
└── README.md                                # this file
```

## Stamp an agent

```bash
ncl groups create --template data/outage-watch --name "Outage Watch"
```

Then edit `additional_context/services.md` to match your actual stack, wire the
agent to a channel (`/manage-channels`), and connect Tavily (below). The
scheduled check installs paused — activate it once you've configured your
service list.

## Credentials

| Service | API host | Auth style | Where to get it |
|---|---|---|---|
| Tavily | `api.tavily.com` (or `mcp.tavily.com` for the remote MCP) | API key, `Authorization: Bearer` | tavily.com → API Keys |

**Tavily is paid past its free tier.** A free tier exists and is enough to try
this template; watching many services on a 15-minute cadence will exceed it in
real use. Check tavily.com/pricing for current plan names — bring your own key,
this template ships none.

`mcp.json`'s `TAVILY_API_KEY: "placeholder"` is required because the local MCP
server refuses to boot without the env var present — it is not a real key.
OneCLI injects the real one at the `api.tavily.com` boundary once you've
connected Tavily in the vault. Never replace the placeholder yourself.

## Phone escalation via Dial (optional)

Calling/texting on a confirmed critical-tier outage is **not** wired through
`mcp.json`, unlike Tavily — Dial's own setup skills (`/add-dial-tool`,
`/add-dial`) install the CLI into the sandbox and pair a real phone number,
which can't be pre-baked into a template. Run those against the stamped agent
if you want phone escalation; until you do, the agent degrades to chat-only
alerts for every tier and says so once.

**Dial is a paid, usage-billed service** — a phone number plus SMS/call usage.
See Dial's own pricing for current plan names; you connect your own account,
this template ships no shared line.

## Notes

- **Two-signal detection is the whole point.** An official-status-only checker
  is a cron job hitting a JSON endpoint; this template exists because status
  pages lag the internet, sometimes by 30+ minutes, and unofficial chatter
  (forums, aggregators, news) usually knows first. See
  `additional_context/escalation-policy.md`.
- **"Is it us or them" on demand.** Ask the agent directly whether a specific
  service is down and it runs the same check immediately, outside the
  schedule — useful mid-incident, not just as a morning digest.
- **No repeat pages.** An open incident is tracked in `memory/incidents.md` and
  only re-alerts on a state change or after an hour of continuous confirmed
  state — not every 15 minutes.
- **Scheduled check starts paused**, like every NanoClaw task — nothing pages
  anyone until you activate it.
