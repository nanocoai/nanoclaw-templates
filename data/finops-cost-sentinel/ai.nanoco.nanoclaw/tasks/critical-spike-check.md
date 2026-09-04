---
schedule: "0 * * * *"
script: |
  # Gate for the hourly frequency limit: NanoClaw caps ungated tasks at
  # 4 fires/24h to stop wasteful full-agent invocations, and this task
  # fires 24x/day. /critical-check on the AWS bridge proxy answers
  # {"wakeAgent": bool} cheaply (raw cost data, no LLM) so the agent is
  # only ever woken for the rare genuinely-critical case.
  #
  # ASSUMPTION NOT YET VERIFIED LIVE: this relies on NanoClaw's egress
  # vault rewriting the Authorization header on this plain curl the same
  # way it does for the agent's own MCP calls (both are just outbound
  # HTTPS from the container, hostname-matched) - confirm this against a
  # real run before trusting it, and replace the URL below with your
  # deployed proxy's real address.
  RESULT=$(curl -s -H "Authorization: Bearer placeholder" \
    https://finops.realcy.app/critical-check)
  if echo "$RESULT" | grep -q '"wakeAgent":true'; then
    echo '{"wakeAgent": true}'
  else
    echo '{"wakeAgent": false}'
  fi
---

Run anomaly-detective's critical-threshold check only, over the last 3
days vs. the 7-day baseline. Do not run the other skills and do not
produce a digest. If a finding is classified critical, hand off to
critical-spike-alert to place the call. If nothing is critical, do
nothing - no output, no digest, no call.
