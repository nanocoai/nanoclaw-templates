---
name: scheduling
description: >
  Manage the principal's calendar end to end — find time with someone, handle an incoming
  invite, resolve a conflict, reschedule, protect focus time, or clear a block. Use this
  whenever the user asks to schedule, book, move, decline, or protect time, asks to "find
  time with" someone or "get X on the calendar," or when an invite or scheduling request
  lands in their channels — even if they don't say "schedule." The output is a confirmed slot
  on the calendar, not a list of options left hanging for the principal to chase.
---

# Scheduling

The deliverable is a confirmed event on the calendar — an invite sent, accepted, and closed
out — run end to end in the principal's voice. Handing back a list of possible times isn't
finishing the job; it just moves the coordinating work back onto the principal, which is the
outcome to avoid.

## Procedure

1. Read the live calendar and the actual request before proposing anything. The exact
   constraints — dates, windows, attendee names, timezones — come from the source and carry
   through unchanged, because a single wrong timezone or a missed existing meeting turns a
   confirmation into a double-booking.
2. Resolve the principal's conventions, in cascade — this order lets routine bookings move
   fast while still protecting you from reshaping their calendar on rules they never set:
   - **Use committed preferences first.** If `memory/conventions/scheduling-preferences.md`
     holds preferences, they take precedence over generic courtesy.
   - **Otherwise, reuse what the calendar already shows.** Read the conventions already
     visible — color-coding, recurring focus or no-meeting blocks, event-naming patterns, the
     durations they actually book. If real conventions are in use, adopt them, save them to
     `memory/conventions/scheduling-preferences.md`, and confirm in one line.
   - **Otherwise, propose before restructuring.** A single booking just proceeds on sensible
     defaults — respect existing blocks, 30-minute default, no double-booking — because it's
     easily reversed. But before imposing any *new organization* on the calendar — a color
     scheme, standing focus blocks, reshaping their week — propose it with a preview and commit
     it to `memory/conventions/scheduling-preferences.md` only once approved. The line is
     reversibility: individual events are cheap to undo, structural changes are not.
3. Propose 2–3 concrete slots, each with an explicit timezone. "Sometime next week" pushes the
   work back to the other party and stalls the thread; specific times get a yes.
4. Drive the thread to a confirmed invite: send it, watch for the acceptance, and chase once if
   it stalls. The loop isn't closed until the event is on the calendar.
5. On conflicts, decline with a specific alternative rather than a bare no — a countered time
   keeps the relationship warm and the thread moving. Anything the principal has marked as not
   movable is not traded away; offer other times around it instead.
6. When it's unclear who outranks whom for a bump, weigh who and what matters most to this
   principal — consult `memory/priorities/people.md` — before moving anyone. When it's genuinely
   a judgment call — trading away something important, bumping a peer — ask the principal with a
   recommendation rather than guessing.

## Examples

**A good time proposal — concrete and timezone-explicit:**

Input: "Find 45 minutes with Jordan this week to review the roadmap."

Output (checks both calendars, avoids the principal's Weds focus block):
```
Hi Jordan — a few options to review the roadmap, 45 min:
 • Tue 2:00–2:45pm ET
 • Thu 10:00–10:45am ET
 • Thu 3:30–4:15pm ET
Let me know what works and I'll send an invite.
```

**A conflict — protect the block, counter with a real alternative:**

Input: A VP requests the principal's Friday 9am, which sits on a standing "no meetings"
focus block the principal has said to keep.

Output: Don't trade the block away. Reply with the nearest genuine openings:
```
Friday mornings are held for focus time — could we do Thursday 4pm or Friday 1pm ET instead?
```

## The memory this skill follows

The principal's scheduling preferences live in `memory/conventions/scheduling-preferences.md` —
earliest meeting time, days to keep clear, default durations and buffers, color and naming
conventions, and what never moves. Who the principal will always move for comes from
`memory/priorities/people.md`. Consult both before proposing or bumping; commit preferences
there through the cascade above. Individual bookings never wait on this; they proceed on
sensible defaults.

Learn preferences from working with them, not a questionnaire. They enter memory through the
cascade — read from the calendar they already keep, or proposed and approved, with one preview
rather than an interview. From then on, treat every correction as a one-line update to the file
it belongs to: "don't book me before 10," "keep Fridays clear," "for the board I'll move
anything" — write it to `memory/conventions/scheduling-preferences.md` (or
`memory/priorities/people.md`) and confirm in one line so they know it stuck. Every so often,
read the inferred preferences back and ask, once, whether that's still how they want you booking.

If memory is unavailable, keep the burden on yourself: restate the preferences you've inferred
when relevant, rather than making the principal re-explain their calendar each time.
