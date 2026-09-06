---
schedule: "0 9 * * *"
script: |
  node /workspace/agent/plugins/forkcheck/scripts/due-check.mjs --data-dir /workspace/agent/plugin-data/forkcheck
---

# Recheck due ForkCheck verdicts

The script gate supplies the IDs of volatile verdicts whose `nextCheckAt` has
arrived. For each due ID, use the `recheck-verdict` skill.

Reconstruct the original decisive test, verify that it remains safe and valid,
and repeat it with current evidence. Preserve all prior evidence and history.
Stay quiet when no verdict is due. Notify the user only if a verdict is
`WEAKENED`, `UNRESOLVED`, or `INVALIDATED`, or if user action is required.

