---
name: checkin-cycle
description: The core check-in loop - decides whether to send a check-in, resend, escalate to calling the user, or escalate to calling the emergency contact, based on session state in memory.
---

# Check-In Cycle

## Purpose

Runs every time the `checkin-poll` task wakes the agent. Reads session
state, decides the one right action, updates state, never does more
than one escalation step per wake.

## Procedure

1. Read `/workspace/agent/memory/checkin-session.json`. If no active
   session (`active: false` or file missing), do nothing - no message,
   no call. This is the common case; most wakes should be silent.
2. If `endTime` has passed, mark the session inactive and send one
   final "Check-in window ended, hope you had a good time!" message.
   No further action.
3. If it's been at least `intervalMinutes` since `lastCheckinSentAt`
   (or a prior check-in is still unconfirmed), determine the miss
   count and act on exactly one of:
   - **First 1-2 misses**: resend "Checking in - you OK? Reply to
     confirm." Increment `missCount`. Update `lastCheckinSentAt`.
   - **3rd miss** (configurable, default 3): call `place_checkin_call`
     with `to` = the stored `userPhoneNumber`. Message: "This is your
     check-in companion -
     please reply to confirm you're OK, or I'll contact [contact
     name]." Record `escalatedToUserCallAt`.
   - **After the user-call escalation, still no reply within one more
     interval**: escalate to the emergency contact. Call
     `place_checkin_call` with the stored `emergencyContactNumber`.
     Message must match this shape exactly - never claim certainty:
     "This is an automated check-in alert. [User] set a check-in and
     hasn't confirmed after multiple attempts as of [time]. This is
     not a confirmed emergency - please try to reach them and use your
     own judgment." Record `escalatedToContactAt`, then mark the
     session inactive - do not keep escalating after the contact call.
4. Any reply from the user at any point resets `missCount` to 0 and
   clears the escalation timestamps - a confirmed reply always wins
   over an in-progress escalation.

## Output

At most one message or one call per wake. Silence is the correct,
common outcome.
