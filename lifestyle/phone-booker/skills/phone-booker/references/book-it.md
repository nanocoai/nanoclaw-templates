# Book It

The whole run, end to end: an ask becomes a phone call becomes an event in the calendar. Every
other reference in this skill is a step of this one.

This covers **rescheduling** and **cancelling** too — same run, ringing a place you already have
in memory with a different brief.

## Steps

1. **Ground in memory.** Before any search: do you already know this place
   (`memory/places/`)? Which standing asks apply (`memory/asks/` plus the place's own)? What name
   do they book under? This is always the first move — `references/memory-structure.md`.

2. **Nail down the ask.** What, when (a window, not a point), for how many, and any constraint.
   Fill gaps from memory, not from assumption. Only ask if a gap would change which place you ring
   or what you ask them for — and then one question, not a form.

3. **Find the place** — `references/find-the-place.md`. You want a shortlist of up to three, each
   with a number, an address, and hours, best first.

4. **Pick the slot** — `references/pick-the-slot.md`. A time inside their window they can actually
   make.

5. **Check the autonomy setting** in memory. If it says check first, show the plan in one line —
   place, time, party, what you'll ask for — and wait. If it says handle it, go.

6. **Write the brief and call** — `references/call-brief.md`.

   ```bash
   dial call --to "+1415..." --outbound-instruction "$BRIEF" \
     --idempotency-key "$RUN_ID-attempt-1" --json
   ```

   Always pass `--idempotency-key`. It is what stops a resumed run from dialling the same place
   twice: build it from the run and the attempt (`booking-2026-09-04-marcos-attempt-1`) so a retry
   after a crash returns the call you already placed instead of ringing them again.

   **Before you place it, schedule your own safety net.** Create a one-shot task for ~6 minutes out
   — "resume booking `<run id>`, the call to `<place>` may have finished" — and cancel it if this
   turn survives to the end. If the container recycles mid-call, that task is the only thing that
   brings the run back.

7. **Wait for the call to end.**

   ```bash
   dial wait-for call.ended -f callId="$CALL_ID" -t 600 --json
   ```

   `-t` is not optional: `wait-for` defaults to a 30-second timeout and a real booking call runs
   minutes, so without it you will conclude the call failed while it is still ringing. `call.ended`
   fires however the call ends — completed, failed, or cancelled — so the wait always resolves.
   If the timeout does expire, don't redial: poll `dial call get`.

8. **Read what happened** — `references/read-the-transcript.md`. This decides whether you have a
   booking, a dead end, or nothing you can trust.

9. **Book the calendar** — `references/hold-the-calendar.md`. Only on a real confirmation.

10. **Learn** — `references/memory-structure.md`. What you learned about the place, and any new
    standing ask.

11. **Report once.**

## When it doesn't go clean

| What happened | What you do |
|---|---|
| Full across their whole window | Next place on the shortlist, from step 4. **Cap: three places.** |
| No answer, or voicemail | One retry, ~20 minutes later, via a one-shot task. Then next place. Never leave a voicemail asking to be called back — the owner's line is not staffed. |
| Number is wrong or dead | One re-search for a better number, then next place. Correct the place file either way. |
| **No read-back on the transcript** | **No calendar event.** Report it as inconclusive with the number, so they can finish it themselves. |
| They want a card, a deposit, or a prepayment | Stop. You cannot give payment details on a call. Tee up everything else and hand it back with the number and what's already agreed. |
| Dial errors: no credit, call cap, number not provisioned | Say so plainly and stop — it's the owner's account and only they can fix it. `references/setting-up-dial.md`. |
| Three places tried, nothing booked | Stop. Say what you tried, what each said, and what you'd try next. Don't keep dialling. |

**Substituting the place is allowed; hiding it is not.** If they said Marco's and you booked
Luigi's, that fact leads the report.

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
