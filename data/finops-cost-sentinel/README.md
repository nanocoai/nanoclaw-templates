# Cost Sentinel

A NanoClaw agent template that watches your AWS bill for anomalies, tag
gaps, and rightsizing waste; researches unfamiliar charges; and calls a
human when something is genuinely critical.

Built for the [NanoClaw Agent Templates Hackathon](https://nanoclaw.dev/hackathon)
(Sep 4-6, 2026).

## What it does

- **Weekly digest** (Monday 08:00, agent-local time): anomaly scan, spend
  breakdown by service, tag hygiene report, rightsizing opportunities,
  month-end forecast.
- **Hourly critical-spike check**: silent unless a spend spike crosses a
  high, explicit bar - then places one voice call to an on-call number.
- **Never guesses**: unfamiliar service/SKU names are looked up via
  Tavily before being reported.
- **Read-only**: this agent never modifies, stops, resizes, or deletes
  any AWS resource. It analyzes and recommends only.

## Required services and credentials

### AWS (required) - via a small proxy you deploy yourself

**This is not a stdio MCP server with env-var credentials, and that's
deliberate.** NanoClaw's credential vault injects secrets by rewriting
the `Authorization` header of outbound HTTPS requests, matched by
hostname - a model built for single bearer tokens. AWS SigV4 signs a
request with the real access key + secret key *before* it leaves the
process; a header-rewriting proxy can't repair a signature that was
computed against a placeholder value. NanoClaw's mount-security policy
also blocks mounting `~/.aws` into a container by default, closing the
other obvious route.

So `aws-cost-explorer` in `mcp.json` is a `streamable-http` server
pointed at a small Cloudflare Worker (in `proxy/`) that you deploy with
your own AWS credentials. The Worker holds your real keys, signs
requests to AWS Cost Explorer itself, and exposes a plain
bearer-token-gated MCP endpoint - exactly the shape the vault is built
for. Your AWS credentials never enter the NanoClaw container.

Setup: see `proxy/README.md`. In short - deploy the Worker
(`cd proxy && pnpm install && pnpm wrangler login && pnpm wrangler secret
put ...` for each secret, then `pnpm run deploy`), then update this
template's `mcp.json` with your Worker's URL and grant its bearer token
through the vault:

```bash
onecli secrets create \
  --name aws-cost-explorer-proxy \
  --type api_key \
  --value "<your PROXY_AUTH_TOKEN>" \
  --host-pattern <your-worker>.workers.dev \
  --header-name Authorization \
  --value-format 'Bearer {value}'
```

The `--value-format` matters: `mcp.json` ships the bare literal
`"placeholder"` (required for the stamp-time secret lint to pass), and
this is what tells the vault to actually send `Bearer <token>` on the
wire.

Minimum IAM policy for the credentials you give the Worker (read-only,
Cost Explorer):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "ce:GetCostAndUsage",
      "ce:GetCostForecast",
      "ce:GetAnomalies",
      "ce:GetRightsizingRecommendation"
    ],
    "Resource": "*"
  }]
}
```

AWS Cost Explorer is a metered API - see
[AWS Cost Explorer pricing](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/pricing/)
for current rates. This template's call volume (one digest per week, one
lightweight check per hour) is low. The Worker itself runs on
[Cloudflare Workers' free plan](https://developers.cloudflare.com/workers/platform/pricing/)
at this volume.

### Tavily (required for unknown-service-lookup)

Sign up at [tavily.com](https://tavily.com) for an API key. Tavily has a
free tier sufficient for this template's usage pattern (a handful of
lookups per digest, only when a service name isn't already known).

### Dial (required for critical-spike-alert) - paid service

This skill requires a [Dial](https://getdial.ai) account with a
registered, OTP-verified phone number **to call from**
(`DIAL_FROM_NUMBER`) - Dial's API rejects calls with no `fromNumber` set,
there's no account-level default. This is separate from
`DIAL_ALERT_PHONE_NUMBER`, the destination the alert calls **to**.
**Paid service - bring your own account:**

- See [Dial's pricing](https://getdial.ai/pricing) for current plans;
  this skill needs at least one phone number provisioned on either the
  flat-rate or metered/pay-as-you-go plan
- No sandbox/test mode exists - testing this skill uses your real
  account balance

If you don't want the phone-call escalation, you can stamp this template
and simply leave `critical-spike-check` paused - the rest of the agent
(digest, tag hygiene, forecast) works fully without it.

`mcp.json`'s `dial-alert` server is a small custom script
(`scripts/dial-call.mjs`), not Dial's own packaged MCP server - see the
comment at the top of that file for why.

## Tuning

Edit `ai.nanoco.nanoclaw/context/additional_context/thresholds.md` after
stamping to adjust: anomaly thresholds, which cost allocation tags are
checked, and the monthly budget used by `forecast-watch` (unset by
default on purpose - it will not compare against $0).

## Local testing

```bash
mkdir -p <nanoclaw>/templates/data
cp -R . <nanoclaw>/templates/data/finops-cost-sentinel
ncl groups create --template data/finops-cost-sentinel --name "Test Sentinel"
ncl tasks list --status paused
ncl tasks run <task-id>
ncl groups delete --id <agent-group-id>
```

Check the `templateReport` in the creation response for any skipped
components before relying on a run.

## Scope and safety

This agent is advisory-only. It reads AWS Cost Explorer data, performs
web lookups, and - only for critical findings - places one outbound
voice call. It does not have write access to any cloud resource and
cannot take remediation actions.
