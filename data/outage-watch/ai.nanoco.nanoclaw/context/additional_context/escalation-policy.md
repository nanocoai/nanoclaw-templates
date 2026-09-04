# Escalation policy

## The two-signal method

Every check for a service produces one of three states:

1. **Confirmed** — the service's own status page reports anything other than fully operational. High confidence; act on it.
2. **Suspected** — no official confirmation yet, but independent, current web signal (recent posts/threads/news mentioning the service being down, from more than one distinct domain) is spiking. Real but unconfirmed — the whole reason this template exists is that official status pages lag live incidents, often by 15-30+ minutes.
3. **Clear** — neither signal present.

Never report "confirmed" from unofficial signal alone, and never report a tier of certainty higher than the evidence supports — say which state it is, and cite what you found.

## What each state does

| State | critical tier | high tier | normal tier |
|---|---|---|---|
| Confirmed | chat alert + phone call/SMS via Dial (if connected) | chat alert | chat alert |
| Suspected | chat alert, marked unconfirmed, no call | chat alert, marked unconfirmed | log only, no alert |
| Clear | nothing (or resolve an open incident) | nothing | nothing |

## De-duplication and cooldown

Before alerting, check `memory/incidents.md` for an already-open incident on that service. If one is open and the state hasn't changed, do not alert again — an ongoing incident should not repage every 15 minutes. Re-alert only when the state changes (e.g. suspected → confirmed, or confirmed → clear/resolved), or after 60 minutes of continuous confirmed state, whichever comes first.

## Dial availability

Only place a call or send an SMS if the `dial` CLI is available in this sandbox (check for `DIAL_CLI_PATH` before attempting). If it isn't connected, degrade to chat-only for every tier and say so once, not on every check.
