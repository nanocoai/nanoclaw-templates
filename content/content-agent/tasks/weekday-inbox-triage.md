---
schedule: "0 9 * * 1-5"
---

Run inbox triage: run the **inbox-triage** mode from the content-agent skill and deliver
the triage digest straight to chat. Cover everything that landed since the last run:
usually the previous day, and on Mondays the whole weekend (Fri–Sun). The ledger already
prevents re-reading anything triaged before, so just work the new arrivals. This runs
unattended, so it works from the connected email MCP (Gmail); if Gmail isn't connected,
skip and tell the creator to connect it (see `references/credentials.md`) so the daily
triage can run. Sort and flag only, never delete, archive, or reply.
