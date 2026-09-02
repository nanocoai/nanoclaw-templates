# Read the Transcript

The call ended. Now decide what actually happened.

```bash
dial call get "$CALL_ID" --json
```

Transcripts come back inline up to about 4,000 characters; for a long call, `dial call get` is
where the full one lives.

## The only question that matters

**Did someone at the business confirm a specific booking, in the read-back?**

You are looking for the four facts coming back *from them*, not from your own agent: the date, the
time, the party size, and the name it's under. The address is a bonus that usually comes with it.

There are three outcomes, and only three.

## 1. Confirmed

They read it back, or clearly agreed to it in terms you can quote. You have a booking. Extract:

- date and time **as they said it** — if they said "quarter past eight" and you asked for 20:00,
  the booking is 20:15, and the calendar gets 20:15;
- party size, likewise as confirmed;
- the name it's under;
- the address, if given;
- anything they added that you didn't ask for: "we hold the table 15 minutes," "come to the side
  door," "bring the card you booked with." **These are the things worth remembering.**

Then `references/hold-the-calendar.md`.

## 2. A clear no

They're full, closed, don't take phone bookings, won't deal with an assistant, or don't do what
was asked. This is a real answer and a useful one. Record it on the place — "doesn't take phone
bookings, use the app" saves every future call — and move to the next place on the shortlist.

## 3. Inconclusive

Everything else. The call dropped, it never got past an IVR, it reached voicemail, the read-back
never happened, or the transcript is ambiguous about whether anything was actually held.

**Inconclusive is not a booking.** No calendar event, no "booked" in the report. Say plainly that
you couldn't get a clear confirmation, give the number and what was discussed, and let them finish
it. Then treat it like a no for the run: retry once if it was a no-answer, otherwise next place.

The temptation here is real — the call went well, they said "yeah, sure, see you Thursday" — and
it is still not a confirmation you can point to. A phantom booking means they arrive to no table.
Nothing you save by guessing is worth that.

## Ambiguities worth naming

- **A different time slipped in.** They offered 20:15 and the agent took it. Fine if it was inside
  the authorised window — and the *new* time is what goes in the calendar and the report. Check it
  against the window: if it fell outside, you have an unauthorised booking, so say so and offer to
  ring back and cancel.
- **A different party size.** "We can do four, not three" is a changed booking. Report it.
- **They took a name you don't recognise.** Record what they actually took; that's the name that
  will be on the door.
- **A deposit or card was mentioned.** The booking is not secure. Report it as needing their
  action, with what the place said.
- **Held, not booked.** "We'll pencil you in, call back to confirm" is inconclusive with a
  deadline. Say what the deadline is.
