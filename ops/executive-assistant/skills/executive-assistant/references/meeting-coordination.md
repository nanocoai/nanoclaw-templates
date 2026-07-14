# Meeting Coordination

Get the right people into one meeting: find mutual availability, send the invite,
handle reschedules, and confirm.

## Steps

1. **Gather requirements** — attendees, duration, purpose, preferred window, and
   whether it's in person or video. Ask if any are missing.

2. **Find availability**:
   - Internal attendees → `calendar_get_availability` / free-busy across their
     calendars, intersected with the executive's guardrails.
   - External attendees → propose 2–3 specific options (you can't see their
     calendar); never expose the executive's full calendar.

3. **Propose specific times** — a short numbered list with timezone. Never
   "let me know what works." Hold the top choice tentatively on the executive's
   calendar so it isn't lost.

4. **Send the invite (requires approval)** — once a time is agreed, create the
   event with agenda in the body, video link, and location. Confirm attendees,
   time, and timezone before sending.

5. **Confirm the day before** — send a brief confirmation and make sure the link
   and any pre-reads are attached.

## Reschedules
- Propose new times before canceling the old slot — don't leave a gap the
  calendar treats as free.
- Notify all attendees; update, don't duplicate, the event.

## Hard stops
- No overlapping availability in the window → report it and propose the next
  window, don't force an off-hours slot without approval.
- External send → always get approval first.

Prep the executive for it → `references/meeting-prep.md`
