# The Call Brief

`--outbound-instruction` is the system prompt for the voice agent that will actually speak to the
business. **You are not on the call.** You write the brief, the call happens without you, and you
read the transcript afterwards.

That one fact decides everything here: any decision the call might face has to be **pre-authorised
in the brief**, because there is nobody to ask mid-call. A brief that says "book 19:30" and nothing
else will hang up empty when they offer 19:45.

## The five parts, in order

**1. Who's calling, and for whom.** Fixed, first, never dropped:

> You are an assistant calling on behalf of Yarin to make a booking. You are not Yarin. If anyone
> asks whether you're a person or an AI, tell them plainly that you're an AI assistant calling for
> a customer, and carry on politely.

Never write a brief that impersonates the owner. If the business declines to deal with an
assistant, that's a real answer — take it, note it on the place, and move on.

**2. The ask.** Concrete and complete, so the voice agent never has to improvise a fact: what,
what date (the actual date, spelled out), what time, how many people, and the name to book under.

**3. The standing asks**, in the words they'd be said on a phone. "A table outside if you have
one." "A high chair for a toddler." "If Marco's in, we'd like to be in his section." Mark which are
must-haves and which are nice-to-haves, or the call will refuse a good slot over a preference:

> The outside table is a preference, not a condition — if they only have inside, take it.

**4. The fallbacks you pre-authorise.** This is the part that makes the call worth placing:

> Preferred time is 19:30. Anything between 19:00 and 21:00 is fine, take the closest to 19:30.
> Outside 19:00–21:00, do not book — instead ask what they do have that evening, note it, and end
> the call politely.

State the boundary as clearly as the permission. The call should know exactly where its authority
stops.

**5. The read-back. Mandatory, always last.**

> Before you hang up, read the booking back and get them to confirm it: the date, the time, the
> number of people, and the name it's under. Also ask for the address to make sure we have the
> right one.

Without this, the transcript may not contain a confirmation you can trust, and then there is no
booking — see `references/read-the-transcript.md`. Never omit it to save space.

## Placing it

```bash
dial call --to "+14155550142" \
  --outbound-instruction "$BRIEF" \
  --idempotency-key "booking-2026-09-04-marcos-attempt-1" \
  --json
```

- `--idempotency-key` on **every** call. Re-running with the same key returns the call already
  placed instead of dialling again — this is what makes a resumed run safe after a crash. Build it
  from the run and the attempt.
- `--language <bcp47>` when the business's language isn't the default for its country code, or when
  the owner tells you the place is easier in another language. Unset, it auto-detects from the
  destination's country alongside en-US.
- `--from-number <ref>` if the owner has more than one line and one of them is the right identity
  to call from. Otherwise leave it; it defaults to the onboarding number.
- `--max-call-duration <seconds>` for a place you know keeps you on hold forever, so a stuck call
  can't eat the budget. Note free Dial accounts are already capped at five minutes per call and two
  concurrent — `references/setting-up-dial.md`.
- `--transfer-to <e164>` exists and rides out hold and IVR before cold-transferring to a human.
  It's the wrong tool here — it hands the call to a person's phone rather than booking anything.
  Only reach for it if the owner explicitly asks to be put through.

## Things that go wrong in briefs

- **An unresolved date.** "This Thursday" means nothing to the voice agent. Compute the date and
  write it out.
- **A preference written as a condition.** The commonest failure: the call walks away from a table
  because it couldn't get one outside.
- **A window with no boundary.** Say what's out of bounds, not just what's preferred.
- **A missing party size.** Restaurants can't hold anything without it.
- **No read-back.** You'll get a call that probably booked something, and no way to prove it.
- **Volunteering things the business doesn't need.** Why they're going, who with, a medical reason
  beyond what the appointment requires. Give the booking what it needs and nothing more.

## Rescheduling and cancelling

Same structure. For a reschedule, the brief needs the original booking's details (date, time, name)
so they can find it, plus the new window and the same fallback rules. For a cancellation, the brief
needs the original details and the read-back becomes "confirm the booking is cancelled." A
cancellation you can't prove is worse than none — the calendar event only comes out on a confirmed
cancel.
