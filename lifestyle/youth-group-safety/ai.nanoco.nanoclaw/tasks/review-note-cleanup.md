---
schedule: '15 3 * * *'
script: |
  bun /workspace/agent/plugins/youth-group-safety/skills/youth-group-safety/scripts/cleanup-review-notes.mjs
---

The derived review-note cleanup found one or more records with invalid expiry metadata. Send one calm, private message to `moderator-review` saying that automatic cleanup needs an adult administrator to check the agent configuration. Do not expose filenames, child information, or record contents. Return only an internal acknowledgement after sending.
