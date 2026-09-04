# Watched dependencies

One row per service this agent watches. Add or remove rows freely — this is the only file you need to edit to change what's monitored.

| Service | Status page | Tier |
|---|---|---|
| AWS (us-east-1) | https://health.aws.amazon.com/health/status | critical |
| Stripe | https://status.stripe.com | critical |
| Snowflake | https://status.snowflake.com | critical |
| GitHub | https://www.githubstatus.com | high |
| Datadog | https://status.datadoghq.com | high |

**Tier** controls escalation, defined in `additional_context/escalation-policy.md`:
- `critical` — confirmed outage pages the on-call number (if Dial is connected)
- `high` — confirmed outage posts to chat only, no call
- `normal` — unofficial-only signal, or a confirmed outage on a non-critical dependency; logged, chat only, no repeat pings
