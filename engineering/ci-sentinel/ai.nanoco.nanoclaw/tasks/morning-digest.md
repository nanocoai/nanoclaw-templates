---
schedule: "0 8 * * 1-5"
---

Produce the morning CI digest using the `ci-report` skill.

Summarise the last 24 hours from `ci-sentinel/state/decisions.jsonl`, the ledger, and
`memory/ci/fingerprints/`. One message, ranked so the item that most needs a human is first.

If nothing failed, say exactly that in one line and stop — a quiet night should cost the reader
two seconds. If a budget stopped you short overnight, say what you did not get to.
