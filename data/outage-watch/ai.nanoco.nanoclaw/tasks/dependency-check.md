---
schedule: "*/15 * * * *"
---
Run outage-triage against every row in `additional_context/services.md`. For each service:

1. Check its official status page.
2. Check for current unofficial signal (recent, independent-domain mentions of it being down).
3. Compare the resulting state to what's already open in `memory/incidents.md`.
4. Alert only on a new incident or a state change, per the tiers and cooldown in `additional_context/escalation-policy.md`.
5. Update `memory/incidents.md` with the current state of every service checked, confirmed or clear.

Never place a call or send an SMS outside what the escalation policy allows for that service's tier. If nothing changed anywhere, say nothing — a silent 15 minutes is a working 15 minutes.
