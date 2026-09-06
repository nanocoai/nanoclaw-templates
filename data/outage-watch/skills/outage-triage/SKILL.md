---
name: outage-triage
description: >
  Check whether a specific cloud/SaaS/data-infra dependency is actually having an
  incident, using both its official status page and independent web signal, and
  decide whether/how to alert. Use on the recurring dependency check, when the
  principal asks whether a specific service is down, when a suspected incident
  needs re-checking for an update, or when a new dependency is added to
  `additional_context/services.md` and needs a first baseline.
---

# Outage triage

## Goal
Tell the difference between "actually down," "probably down but not yet confirmed," and "not this service's fault" — fast enough to matter, and precisely enough to trust.

## Procedure

1. **Look up the service's status page and tier** in `additional_context/services.md`. If it isn't listed and the principal asked about it directly, still check it — just note it isn't a tracked dependency yet.
2. **Check the official signal.** Fetch the status page's current content. Anything other than a clean "operational"/"all systems normal" statement is `confirmed`.
3. **Check the unofficial signal**, regardless of what step 2 found. Search for recent mentions of the service being down, restricted to the last few hours. Count independent domains, not raw hits — five people quoting the same one post is one signal, not five.
4. **Weigh them.** Official non-operational → `confirmed`, cite the page's own wording. Official clean but multiple independent-domain unofficial hits in a short window → `suspected`, cite the specific sources. Neither → `clear`.
5. **Check `memory/incidents.md`** for an already-open incident on this service. If the state matches what's already recorded and it's within cooldown, do not send a new alert — update the record's "last checked" only.
6. **Decide the action** from the tier (`services.md`) × state (this check) × the table in `additional_context/escalation-policy.md`. A call/SMS only ever happens for `confirmed` + `critical`, and only if the `dial` CLI is available (check before attempting — degrade to chat-only and say so once if it isn't).
7. **Record the outcome** in `memory/incidents.md`: service, state, evidence sources, tier, action taken, timestamp. Close out incidents that return to `clear`.

## Boundaries
- Never call a state `confirmed` on unofficial evidence alone.
- Never escalate by phone below `critical` tier or on a `suspected`-only state.
- Never re-alert an unchanged, already-open incident before its cooldown elapses.
- Never attempt a Dial call/SMS without first checking the CLI is actually available in this sandbox.
- Never fabricate a source. If you found nothing on either signal, that's `clear`, not silence.

## What to record
Keep `memory/incidents.md` current: every service's last-checked state, the evidence for it, whether it's open or resolved, and what action was taken. Keep `memory/conventions/vendor-notes.md` for anything vendor-specific worth remembering (a status page that lags, an RSS/JSON feed that's more reliable than the HTML page, etc.).
