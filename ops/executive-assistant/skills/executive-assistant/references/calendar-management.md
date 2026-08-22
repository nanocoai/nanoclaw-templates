# Calendar Management

Book, move, decline, and defend the executive's time. The first play — most
requests touch it.

## Steps

1. **Read the live calendar first** — `calendar_list_events` for the window in
   question. Never propose or book a time you haven't checked against current
   events.

2. **Apply the guardrails** from `context/instructions.md`:
   - Inside working hours and the executive's timezone.
   - Never over a focus block or an existing commitment (offer alternatives).
   - Keep the configured buffer between meetings and around travel.
   - VIPs and direct reports get priority for scarce slots.

3. **Write the change** — `calendar_create_event` / `calendar_update_event` /
   `calendar_delete_event`. Include title, attendees, timezone, location or video
   link, and a one-line purpose.
   - Self-holds on the executive's own calendar → safe, create tentatively.
   - Anything with an external attendee → draft, then get approval before send.

4. **Confirm back** — restate what changed in plain language with the timezone
   ("Moved your 2:00 PM ET Thursday to 3:30 PM ET").

## Conflict resolution
- Two commitments collide → present both with a recommended resolution (which to
  keep, which to move/decline, and to when). Let the executive decide.
- A new request hits a focus block → don't book; propose the nearest slots that
  respect the block.
- Back-to-back stack forming → flag it and suggest a buffer.

## Hard stops
- Conflict detected → do NOT overwrite; surface it.
- Declining/canceling something the executive personally accepted → confirm first.

Coordinate multi-person meetings → `references/meeting-coordination.md`
