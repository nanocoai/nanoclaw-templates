# Memory Structure

This is what makes the agent worth keeping. The first booking at a place is work; the tenth should
be one sentence from the owner and nothing else.

You remember **two different kinds of thing**, and keeping them apart is the whole discipline.

```
memory/
├── index.md              # the owner: name they book under, callback number,
│                         # autonomy setting, default party — and links out
├── places/
│   ├── index.md          # one line per place, so a scan finds it
│   └── marcos-trattoria.md
└── asks/
    ├── index.md
    ├── dining.md
    └── appointments.md
```

## A place file: what's true about the business

```markdown
---
type: place
title: "Marco's Trattoria"
tags: ["restaurant", "italian", "tel-aviv"]
---

Phone: +972-3-555-0110 (verified on the call, 2026-09-04)
Address: 12 Rothschild
Books by: phone only — the website form is never answered
Ask for: Marco, the owner; he handles the outside tables
Standing asks here: table outside; never the back room
Quirks: rings ~40 seconds before anyone picks up. Won't seat under 4 outside on Fridays.
        They hold the table 15 minutes.
Booked under: Yarin
Last booked: 2026-09-04 · Booked 6 times
```

Everything here you learned by ringing them. The quirks are the expensive knowledge — the second
call is short because the first one was long.

## An ask file: what's true about the owner

```markdown
---
type: ask
title: "Dining"
tags: ["restaurant"]
---

Always: high chair (toddler), quiet table, no bar seating
Usually: party of 3 · prefers 19:30 over 20:30
Never: tasting menus
```

Split "always" from "usually" from "never" — the brief treats them differently. An "always" is a
must-have; a "usually" is a preference that must never cost a booking.

## The rule that keeps them apart

A standing ask goes **on the place** when it's about that place, and in **`asks/`** when it's about
them anywhere.

> **The test: would I want this at a place I've never been?**
> Yes → `asks/`. No → the place file.

"A high chair" travels — every restaurant, forever. "Marco's section" does not. Get this wrong in
the wrong direction and you ask a dentist for a table outside, which is the failure that makes an
agent look stupid on the phone.

When you're not sure, put it on the place. A preference that should have travelled costs one extra
ask later; one that shouldn't have travelled costs credibility on every call.

## How things get in

**Silently, as they happen.** Never interrupt a booking to ask whether to remember something.
They asked for the outside table; that's a fact about them, and it goes in.

**Then say what you applied.** Every booking report names the preferences it used — "outside table,
asked for Marco, high chair." That line is the only correction surface there is: they see it, and
if it's wrong they say so, and you fix it. This is why the report line is not optional.

**One-off versus standing.** "Just this once, somewhere quiet, it's a work dinner" is not a
standing ask. When they mark something as unusual, record it on the booking, not on the profile.
When they don't say, and it's the kind of thing that recurs (a high chair, an access need, a
dietary constraint), treat it as standing — those are cheap to apply and painful to forget.

**Corrections beat everything.** "No, not outside, it's cold now" doesn't just change this booking;
it changes the standing ask. Update it in the same turn.

## Keeping it honest

- **The live record wins.** What the business said on the phone beats what the place file says.
  What the calendar says beats what you remember booking. On a conflict, fix memory in the same
  turn.
- **A failed number is information.** Correct it the moment a call fails, so the next run doesn't
  repeat it.
- **A place they stopped using isn't deleted**, it just stops being first on the shortlist. The
  weekly tidy-up handles genuine rot; don't prune in the middle of a booking.
