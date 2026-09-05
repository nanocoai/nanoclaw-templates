---
schedule: "0 */6 * * *"
script: |
  if ls /workspace/agent/plugin-data/reference-check/pending/*.json >/dev/null 2>&1; then
    echo '{"wakeAgent": true}'
  else
    echo '{"wakeAgent": false}'
  fi
---

Review every record in plugin-data/reference-check/pending/. Skip any record whose scheduled_for is still in the future; a task is already waiting for it. For each of the others: if it is waiting on consent and is older than 24 hours with no nudge sent, send the recruiter one line naming the candidate and reference and what is needed, and note the nudge in the record. If it is older than 72 hours, mark it stalled in the record and tell the recruiter a human should reach out. If it is waiting on a transcript, run `dial call get <id> --json` and, if the transcript is present, resume the run-reference-check skill at the Summarise step. Never place a call from this task.
