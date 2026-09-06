# AI Visibility Agent Template

A NanoClaw agent template for the newest marketing problem: your
customers now ask ChatGPT, Perplexity, Gemini and Google's AI answers
what to buy, and those engines either recommend you or they don't. This
agent watches how they answer for your brand, explains why competitors
win, drafts the fixes (pages, FAQs, schema.org structured data), and
reports every shipped fix back so the before/after impact is measured.

It runs the loop most tools stop halfway through:
**measure → explain → fix → report → re-measure.**

Built on a [GeoMaestros](https://geomaestros.com) workspace, reached
over remote MCP — nothing runs locally.

## What the agent does

- **Weekly digest** (scheduled task, created paused): share of voice
  and its trend, prompts won and lost, why competitors were recommended
  instead, and the top three fixes for the week.
- **Executes the fix backlog**: GeoMaestros distills audits and gap
  analyses into prioritized recovery actions; the agent grounds each in
  the captured AI answers, drafts the content or JSON-LD, ships it once
  you approve (git repo, or ready-to-paste for your CMS), and reports it
  executed so impact tracking starts.
- **Works the citation sources**: maps the domains AI engines actually
  cite in your category, finds the heavy hitters you're absent from,
  and writes the listing or pitch that gets you on them.
- **Free scan for anyone**: even with no GeoMaestros account, the agent
  can run the free AI-readiness scan (the one behind
  [geomaestros.com/areyouready](https://www.geomaestros.com/areyouready))
  on any domain over a public endpoint, read back the grade and failed
  checks, and draft the fixes. No token needed for this part.

## Layout

```
ai-visibility/
├── plugin.json                     # Agent Plugins manifest
├── mcp.json                        # GeoMaestros remote MCP server (streamable HTTP, no secrets)
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   └── instructions.md         # the agent's standing brief
│   └── tasks/
│       └── weekly-visibility-review.md  # Monday digest (created paused)
├── skills/
│   ├── ai-visibility/              # the operating system (auto-triggers on visibility tasks)
│   │   ├── SKILL.md                #   routing + tool map + memory conventions
│   │   └── references/
│   │       ├── free-scan.md
│   │       ├── visibility-review.md
│   │       ├── apply-fixes.md
│   │       ├── sources-and-citations.md
│   │       └── credentials.md
│   └── welcome/                    # first-contact intro on a newly wired channel
│       └── SKILL.md
└── README.md                       # this file
```

## Stamp an agent from this template

```bash
ncl groups create --template marketing/ai-visibility --name "AI Visibility"
```

Then wire it to a channel as usual. The weekly task ships paused;
unpause it once the workspace is connected.

## Paid service: GeoMaestros (bring your own token)

**GeoMaestros is a paid SaaS** (the author of this template is its
founder — disclosed up front). See
[geomaestros.com](https://geomaestros.com) for plans. The MCP workspace
connection is included with the **Recovery Subscription** plan. You
supply **your own** workspace token; the template ships no credential
and no shared key. The free readiness scan needs no plan and no token
at all — only the workspace loop is paid.

| Service | API host | Auth style | Where to get the key |
|---|---|---|---|
| GeoMaestros MCP | `geotravel-production.up.railway.app` | `Authorization: Bearer` | your workspace → Workspace Settings → AI Assistant → Create token |

- Endpoint: `https://geotravel-production.up.railway.app/v1/mcp`
  (remote streamable HTTP; `mcp.json` declares no credential — the
  OneCLI vault injects the token per request, so never edit a key into
  `mcp.json`).
- Scopes: keep **"Allow my assistant to report executed fixes"** ticked
  when creating the token — that grants `mcp:write` on top of read
  (`mcp:tools`). Read-only works for digests, but the impact loop needs
  the write scope for `update_recovery_action`.
- Tokens show once at creation time, are scoped to one workspace,
  default lifetime 90 days, revocable from the same settings page.

Register the token in the OneCLI vault for the host above, or just run
the agent: on the first unauthenticated call it hands you a prefilled
connect link, you paste the token, and retry.

## Tools exposed by the server

Read: `list_properties`, `list_keywords`, `get_sov`,
`get_share_of_voice_trend`, `get_visibility_gaps`, `get_competitors`,
`get_evidence`, `get_source_map`, `get_audit_summary`,
`get_recovery_actions`.
Write: `update_recovery_action` (report an executed fix; starts impact
measurement).

## Guardrails

The standing brief enforces: no invented numbers (every figure comes
from a tool call), no publish to your site without approval of the
specific draft, and no recovery action reported as executed unless the
fix actually shipped. For hard enforcement on top, add a OneCLI approval
rule for POSTs to the host above — the write tool is the only mutating
call this template makes.

---

Template by [Vincent Sider](https://github.com/vincentsider), founder of
GeoMaestros.
