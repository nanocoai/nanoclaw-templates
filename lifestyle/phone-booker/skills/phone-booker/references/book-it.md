# Book It

The whole run, end to end: an ask becomes a phone call becomes an event in the calendar.

This covers **rescheduling** and **cancelling** too — same run, ringing a place you already have
in memory with a different brief.

## 1. Ground in memory

Before any search: do you already know this place (`memory/places/`)? Which standing asks apply
(`memory/asks/` plus the place's own)? What name do they book under? This is always the first
move — `references/memory-structure.md`. If they said "the usual" or "same as last time", memory
is the only place that answer exists.

## 2. Nail down the ask

What, when (a window, not a point), for how many, and any constraint. Fill gaps from memory, not
assumption. Only ask if a gap would change which place you ring or what you ask them for — and
then one question, not a form.

## 3. Find the place

You want a shortlist of up to three, best first, each with a **phone number, address, and hours**.
A fourth fact matters: **do they take bookings by phone at all?** Plenty of places are walk-in
only or will just tell you to use the app — note it on the place when you learn it, it saves
every future call.

Prefer the business's own site for the number over an aggregator; aggregators carry stale numbers
and forwarding services. Push a broad sweep to a subagent and have it hand back just the
shortlist.

Order the shortlist by *them*, not by ratings: a place they've been to before comes first, then
one that fits their standing asks (if they always want a table outside, a place with no outside
seating is a bad first call however good it is), then the ordinary signals.

If they named a specific place, there's no shortlist to build — go straight there. Build a
fallback list only if the autonomy setting says handle it, and say so in the report.

## 4. Pick the slot

**Resolve the window with code, not by eye.** "Thursday between 19:00 and 21:00" needs a real
date — compute it and check the weekday-and-date pairing before you use it. Models get this wrong
with total confidence, and a booking on the wrong day is a wasted call and a wasted evening.

Read the calendar across the window *plus a margin either side* — a meeting ending at 18:55 across
town does not leave them free at 19:00. Leave travel room rather than stacking the booking against
the wall of another event.

**Come out with a first choice and a range**, never a single time. A call authorised for one exact
time will fail on a place that has 19:45.

If the window is genuinely full, don't quietly widen it — say what's in the way and ask. The
autonomy setting covers calling and substituting a place, not rewriting the time they asked for.

## 5. Check the autonomy setting

In memory. If it says check first, show the plan in one line — place, time, party, what you'll ask
for — and wait. If it says handle it, go.

## 6. Write the brief and call

`references/call-brief.md` has the structure. Then:

```bash
dial call --to "+14155550142" --outbound-instruction "$BRIEF" \
  --idempotency-key "$RUN_ID-attempt-1" --json
```

Always pass `--idempotency-key`. It is what stops a resumed run from dialling the same place
twice: build it from the run and the attempt (`booking-2026-09-19-kokkari-attempt-1`) so a retry
after a crash returns the call you already placed instead of ringing them again.

**Before you place it, schedule your own safety net.** Create a one-shot task for ~6 minutes out —
"resume booking `<run id>`, the call to `<place>` may have finished" — and cancel it if this turn
survives to the end. If the container recycles mid-call, that task is the only thing that brings
the run back.

## 7. Wait for the call to end

```bash
dial wait-for call.ended -f callId="$CALL_ID" -t 600 --json
```

`-t` is not optional: `wait-for` defaults to a 30-second timeout and a real booking call runs
minutes, so without it you will conclude the call failed while it is still ringing. `call.ended`
fires however the call ends — completed, failed, or cancelled — so the wait always resolves. If
the timeout does expire, don't redial: poll `dial call get`.

## 8. Read what happened

`references/read-the-transcript.md`. This decides whether you have a booking, a dead end, or
nothing you can trust.

## 9. Hold the calendar — only on a real confirmation

The point of the event is that on the day they can act on it from the notification alone.

- **Title**: what and where. "Dinner — Marco's Trattoria". "Dentist — Dr Levi".
- **Time**: what was actually confirmed, not what you asked for, with a sensible duration.
- **Location**: the street address that will open in a maps app. If the call gave you an address
  that differs from what you searched, the call wins.
- **Description**, where the value is — the name it's under **first**, because that's what they'll
  need at the door and what they'll have forgotten:

  ```
  Booked under: Yarin
  Party of 3
  Asked for: outside table, high chair, Marco's section
  Phone: +1-415-555-0142
  They hold the table 15 minutes.
  ```

**Never invite anyone without asking** — their own calendar is yours to write; someone else's
reaches another person. **Rescheduling moves the existing event**, it doesn't add a second one. A
**confirmed** cancellation removes it; an unconfirmed one leaves it alone and says so.

If the calendar write fails, don't lose the booking: report it in full, say the write failed, and
retry. A silent failure here is how a real table ends up forgotten.

## 10. Learn, then report once

Update the place file and `asks/` — `references/memory-structure.md`. Then one message.

## When it doesn't go clean

| What happened | What you do |
|---|---|
| Full across their whole window | Next place on the shortlist, from step 4. **Cap: three places.** |
| No answer, or voicemail | One retry, ~20 minutes later, via a one-shot task. Then next place. Never leave a voicemail asking to be called back — the owner's line is not staffed. |
| Number is wrong or dead | One re-search for a better number, then next place. Correct the place file either way. |
| **No read-back on the transcript** | **No calendar event.** Report it as inconclusive with the number, so they can finish it themselves. |
| They want a card, a deposit, or a prepayment | Stop. You cannot give payment details on a call. Tee up everything else and hand it back. |
| Dial errors: no credit, call cap, wrong from-number | Say so plainly and stop — `references/setting-up-dial.md`. |
| Three places tried, nothing booked | Stop. Say what you tried, what each said, and what you'd try next. Don't keep dialling. |

**Substituting the place is allowed; hiding it is not.** If they said Marco's and you booked
Luigi's, that fact leads the report.

**Watch the clock at the destination, not yours.** A place is only reachable in its own business
hours: ringing a San Francisco restaurant at 08:00 Pacific gets you a recording however good the
shortlist is. Check the local time where the place is before you build the list, and if nothing is
open in that window, say so instead of burning three calls on answerphones.

## Output

```
Booked
✅ Marco's Trattoria — Thu 4 Sep, 20:00, table for 3
   Outside table, asked for Marco, high chair.
   Under "Yarin". 12 Valencia St. +1-415-555-0142
   In your calendar.

Booked somewhere else
✅ Marco's was full all evening, so — Luigi's, Thu 4 Sep, 19:45, table for 3
   Outside table, high chair. Under "Yarin". 8 Mission St.

Inconclusive (no confirmation on the call)
⚠️ Rang Marco's but couldn't get a clear confirmation — nothing's in your calendar.
   Their number: +1-415-555-0142. Ask for Marco.

Nothing available
❌ Tried Marco's, Luigi's and Sabbia — all full Thursday evening.
   Want me to try Friday, or look further out?
```

Lead with what they need to know on a phone screen. The transcript is available if they ask; don't
narrate the call unasked.
