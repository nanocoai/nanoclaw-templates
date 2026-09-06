---
name: critical-spike-alert
description: Places a voice call via Dial to alert an on-call human when anomaly-detective classifies a spend spike as critical. Used sparingly and only for genuine P1s.
---

# Critical Spike Alert

## Purpose

Escalate the rare case that genuinely warrants interrupting a human, by
phone, instead of waiting for the next digest.

## When to use this skill

Only when `anomaly-detective` has classified a finding as **critical**
(not notable). If you are unsure whether a finding is critical, it is
not - use the weekly digest instead. Placing a call is expensive and
disruptive; false alarms erode trust in this skill faster than anything
else it does.

## Procedure

1. Confirm the finding is classified critical by `anomaly-detective`
   before doing anything else.
2. Compose a short spoken message: service name, $ delta, % deviation,
   and the plain-English driver if `unknown-service-lookup` was used.
   Keep it to 2-3 sentences - it will be read aloud.
3. Call the `place_alert_call` tool with that message.
4. Report back the call outcome and transcript summary returned by the
   tool. If the call fails (no answer, API error), report that plainly -
   do not retry more than once.

## Output

Call outcome (answered / no answer / failed), transcript summary if
available, and confirmation of what message was sent.
