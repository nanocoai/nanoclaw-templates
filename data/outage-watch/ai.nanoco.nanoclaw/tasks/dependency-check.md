---
schedule: "*/15 * * * *"
script: |
  # Gate for the 15-min frequency limit: NanoClaw caps ungated tasks at 4
  # fires/24h, and this task fires 96x/day. This does a cheap, LLM-free
  # pre-check (curl only) so the agent wakes only when something needs it:
  #
  #   - Fast path: any watched service whose status page follows the
  #     Statuspage.io JSON convention (<page>/api/v2/status.json) reports a
  #     non-"none" indicator. Covers Snowflake, GitHub, Datadog, and most
  #     Statuspage.io-hosted vendors out of the box.
  #   - AWS's Health Dashboard and Stripe's own status page don't expose that
  #     JSON endpoint, so they don't get the fast path - this is a known gap,
  #     not silently swallowed. Those (and the unofficial-signal half of the
  #     check, which needs Tavily) are only covered by the heartbeat below.
  #   - Heartbeat: if nothing tripped the fast path, wake anyway once an hour
  #     so the full two-signal check still runs periodically for every
  #     configured service, keeps memory/incidents.md fresh, and the "is it
  #     down" on-demand answer never goes stale by more than an hour.
  #
  # Edit HEARTBEAT_INTERVAL_SEC to trade cost against staleness tolerance.
  SERVICES_FILE="/workspace/agent/plugins/outage-watch/ai.nanoco.nanoclaw/context/additional_context/services.md"
  HEARTBEAT_FILE="/workspace/agent/memory/outage-watch-last-heartbeat"
  HEARTBEAT_INTERVAL_SEC=3600

  WAKE=false

  if [ -f "$SERVICES_FILE" ]; then
    URLS=$(grep -oE '\| [^|]+\| https://[^ ]+ \|' "$SERVICES_FILE" | grep -oE 'https://[^ ]+')
    for url in $URLS; do
      RESP=$(curl -s -m 5 "${url%/}/api/v2/status.json" 2>/dev/null)
      INDICATOR=$(echo "$RESP" | grep -oE '"indicator":"[a-z]+"' | head -1 | cut -d'"' -f4)
      if [ -n "$INDICATOR" ] && [ "$INDICATOR" != "none" ]; then
        WAKE=true
      fi
    done
  fi

  if [ "$WAKE" != "true" ]; then
    NOW=$(date +%s)
    LAST=0
    [ -f "$HEARTBEAT_FILE" ] && LAST=$(cat "$HEARTBEAT_FILE" 2>/dev/null)
    [ -z "$LAST" ] && LAST=0
    if [ $((NOW - LAST)) -ge $HEARTBEAT_INTERVAL_SEC ]; then
      WAKE=true
    fi
  fi

  if [ "$WAKE" = "true" ]; then
    date +%s > "$HEARTBEAT_FILE" 2>/dev/null
  fi

  echo "{\"wakeAgent\": $WAKE}"
---
Run outage-triage against every row in `additional_context/services.md`. This task fires
every 15 minutes but the pre-check script above only wakes you when a watched service's
Statuspage.io-style status API reports trouble, or once an hour as a heartbeat sweep that
also covers AWS and Stripe (whose status pages don't expose that JSON endpoint) and the
unofficial-signal half of the check. For each service:

1. Check its official status page.
2. Check for current unofficial signal (recent, independent-domain mentions of it being down).
3. Compare the resulting state to what's already open in `memory/incidents.md`.
4. Alert only on a new incident or a state change, per the tiers and cooldown in `additional_context/escalation-policy.md`.
5. Update `memory/incidents.md` with the current state of every service checked, confirmed or clear.

Never place a call or send an SMS outside what the escalation policy allows for that service's tier. If nothing changed anywhere, say nothing — a silent 15 minutes is a working 15 minutes.
