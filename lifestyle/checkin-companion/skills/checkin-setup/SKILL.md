---
name: checkin-setup
description: Starts a new check-in session from a natural-language request - parses the window, interval, and emergency contact, confirms with the required safety disclaimer, and stores session state in memory.
---

# Check-In Setup

## Purpose

Turn a request like "I'm on a date until 9, check on me every 30 min,
call Danny at +972... if I don't respond" into a stored, active
check-in session.

## Procedure

1. Extract from the request: end time (or duration), check-in interval
   (default 30 minutes if not stated), and the emergency contact's name
   + phone number in E.164 format. **Also ask for the user's own phone
   number** (E.164) if this session isn't wired to a channel where the
   platform identity already is one (WhatsApp's platform ID is a phone
   number; Telegram's is not) - the miss-escalation call needs a real
   number to call, and it must never be guessed or left unset. If any
   phone number isn't in E.164 format, ask for it in that format before
   proceeding - never guess a country code.
2. Only one active check-in session at a time. If one is already
   active, tell the user and ask whether to end it first
   (`checkin-end`) or that this new request replaces it.
3. Write session state to `/workspace/agent/memory/checkin-session.json`:
   ```json
   {
     "active": true,
     "endTime": "<ISO 8601>",
     "intervalMinutes": 30,
     "userPhoneNumber": "+972...",
     "emergencyContactName": "Danny",
     "emergencyContactNumber": "+972...",
     "missCount": 0,
     "lastCheckinSentAt": null,
     "escalatedToUserCallAt": null,
     "escalatedToContactAt": null
   }
   ```
   `userPhoneNumber` is required, not optional - `checkin-cycle` cannot
   place the miss-escalation call without it, so do not write the
   session file until it's captured.
4. Confirm back to the user, **including this exact disclaimer** (not
   paraphrased, not shortened):

   > "Check-in started until [end time], every [interval] minutes.
   > I'll call you if you miss a few, and call [contact name] if you
   > still don't respond. This is a best-effort convenience check-in,
   > not a safety-critical system - if you feel unsafe right now, call
   > emergency services directly, don't wait for or rely on me. Say
   > 'I'm home' any time to end this."

## Output

Confirmation message with the disclaimer above, verbatim.
