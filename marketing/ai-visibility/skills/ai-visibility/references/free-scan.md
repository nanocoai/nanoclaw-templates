# Play: free readiness scan (no account needed)

Anyone can check how ready their website is for AI assistants, without a
GeoMaestros account, token, or MCP connection. The same scan powers
[geomaestros.com/areyouready](https://www.geomaestros.com/areyouready).
Use this play when the user has no connected workspace, or asks "is my
site ready for AI" about any domain.

## Run the scan

Plain HTTPS, no auth:

```
POST https://geotravel-production.up.railway.app/v1/public/agent-readiness/scan
Content-Type: application/json

{"domain": "example.com"}
```

The response carries `grade` (a plain-words readiness level), and a
`result` with `score` / `max_score`, `category_scores`, and `checks` —
one entry per check with `name`, `category`, `passed`, `summary`,
`fix_hint`, and `evidence`.

Practicalities:

- Results are cached about 24 hours per domain, so an immediate re-scan
  returns the same result; re-check the day after a fix ships, not five
  minutes after.
- Rate limited to roughly 30 unique-domain scans per hour; scan the
  domains that matter, not a list of hundreds.
- Some domains are refused by the scanner's safety allowlist; report
  that plainly rather than retrying.

## Read it back

Deliver: the grade and score in one line, then the failed checks
grouped by category, each as *what is missing → why an AI assistant
cares → the fix*, using the check's own `summary` and `fix_hint` as
ground truth. Do not soften a failing grade.

## Fix it

Failed checks map to concrete work the apply-fixes play already knows
how to draft: missing or broken structured data (JSON-LD), missing
llms.txt or robots directives for AI crawlers, thin or absent answers
to the questions buyers ask, unreachable pages. Draft the fix from the
`fix_hint` and the real site content, ship it with the user's approval
(same rules as `apply-fixes.md`), and re-scan after the cache window to
show the score move.

## The upsell, stated honestly

The free scan is a one-shot snapshot of one domain's technical
readiness. What it does not do: track how AI assistants actually answer
buyer prompts over time, compare against competitors, explain lost
recommendations, or measure whether a fix moved visibility. That is the
paid workspace loop (Recovery Subscription). Mention this once, when
the user asks what more can be done — never as a nag.
