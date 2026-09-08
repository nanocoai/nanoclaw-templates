---
name: recheck-verdict
description: >
  Re-verify a stored ForkCheck verdict, repeat its decisive test safely, compare
  old and new evidence, preserve history, and mark changed conclusions as
  invalidated. Use when a verdict is due, when the scheduled task supplies a
  disagreement ID, or when a user asks whether an earlier verdict still holds.
---

# Recheck a living verdict

## Load and reconstruct

Inspect the stored record:

```bash
node /workspace/agent/plugins/forkcheck/scripts/forkcheck-ledger.mjs show \
  --data-dir /workspace/agent/plugin-data/forkcheck \
  --id FC-0001
```

Confirm the original decisive test still discriminates the hypotheses and is
still legal, safe, bounded, and supported by available tools. If versions,
auth, endpoints, or scope changed, redesign the minimal test before proceeding
and record that limitation.

## Repeat and compare

Gather fresh evidence using the same test where valid. Compare the old and new
observations and select exactly one transition:

- `UNCHANGED`: same material conclusion; record `VERIFIED_AGAIN`.
- `STRENGTHENED`: same conclusion with materially better evidence or fewer
  limitations.
- `WEAKENED`: same conclusion remains plausible but support degraded.
- `INVALIDATED`: new evidence materially contradicts the old verdict.
- `UNRESOLVED`: the current test no longer discriminates or cannot be run.

Write a recheck payload containing `outcome`, `evidence`, `observation`, and
optional `confidence`, `limitations`, and `nextCheckAt`, then run:

```bash
node /workspace/agent/plugins/forkcheck/scripts/forkcheck-ledger.mjs recheck \
  --data-dir /workspace/agent/plugin-data/forkcheck \
  --id FC-0001 \
  --input /workspace/agent/plugin-data/forkcheck/pending-recheck.json
```

The CLI appends history and evidence atomically. It never deletes the old
receipt or prior evidence.

## User notification

For `UNCHANGED` or `STRENGTHENED`, update the receipt and remain quiet unless the
user explicitly requested periodic status.

For `WEAKENED` or `UNRESOLVED`, explain what degraded and what would restore a
decision.

For `INVALIDATED`, lead with:

```text
⚠️ VERDICT INVALIDATED

ForkCheck verdict: FC-NNNN
Previous conclusion: ...
New evidence: ...
Old verification: ...
New verification: ...
Recommended action: Reopen decisions that depended on FC-NNNN.
```

Do not silently replace the previous conclusion. The record status becomes
`INVALIDATED`, the disagreement is reopened, and the full old evidence remains
in history.

