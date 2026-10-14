---
name: checkin-end
description: Ends an active check-in session immediately on request - a session that can't be cleanly cancelled is worse than useless.
---

# Check-In End

## Purpose

Let the user stop an active session at any time ("I'm home", "cancel
the check-in", "I'm fine, stop checking"), with no further messages or
calls afterward.

## Procedure

1. Read `/workspace/agent/memory/checkin-session.json`.
2. If no active session, say so plainly - nothing to end.
3. If active, set `active: false`, clear `missCount` and the
   escalation timestamps, and confirm: "Check-in ended. Glad you're
   safe." Do not require any justification or confirmation step first -
   ending must be immediate and unconditional whenever asked.

## Output

One confirmation message. No further check-in activity for this
session after this point - `checkin-cycle` reads `active: false` and
does nothing on future wakes.
