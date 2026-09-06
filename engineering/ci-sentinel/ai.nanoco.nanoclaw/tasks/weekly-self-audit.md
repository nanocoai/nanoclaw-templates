---
schedule: "0 9 * * 1"
---

Run the weekly self-audit from the `ci-report` skill.

Score every issue labelled `ci-sentinel` closed in the last 7 days as correct, wrong class, not
real, or unresolved. Compute precision and compare it with last week's.

Append the patterns — not individual issues — to `memory/ci/lessons.md`, and report the score in
chat with the two most useful lessons. Be blunt about the misses: an audit that only reports
good news is not an audit, and these lessons are the only thing that stops a systematic
misdiagnosis from repeating every night.
