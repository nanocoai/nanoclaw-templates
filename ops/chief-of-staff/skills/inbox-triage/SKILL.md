---
name: inbox-triage
description: >
  Sort a principal's inbox, DMs, or message backlog into action buckets and attach a
  ready-to-send draft to everything that needs a reply. Use this whenever the user asks
  to triage, clear, process, sort, "deal with," or catch up on email or messages, when
  they say their inbox is a mess or they're behind on replies, or when a scheduled review
  surfaces new inbox activity — even if they don't say the word "triage." The output is a
  sorted set of buckets with drafts already written, never a raw list of what needs doing.
---

# Inbox triage

The job is to turn a pile of unread messages into a sorted set of buckets where every item
that needs a reply already has a draft attached, written in the principal's voice and ready
to send. The sort and the drafts are the whole point — a raw, unsorted list hands the work
back to the principal instead of doing it, which is the one outcome to avoid.

## What you deliver

Return the backlog grouped by bucket, most important item first within each bucket. Each
entry names the sender and subject in one line, and every item in the reply-needed bucket
carries its draft directly beneath it. End with a short running list of anything that has an
owner or a deadline, so nothing with a clock on it gets lost in a bucket.

A useful shape to hand back:

```
## Respond (3)
1. Priya — "Q3 board deck review"
   Draft: Hi Priya — the deck looks strong. My only note is slide 7 ...
2. ...

## Decide (2)
1. Legal — "Vendor contract: sign or renegotiate?"
   Recommendation: Sign as-is; the indemnity clause is standard for this size.

## Read (5)
...

## Archive (12)
...

## Open items
- Reply to Priya before Thursday's board meeting.
- Marco is waiting on the budget number you owe him.
```

## Procedure

1. Read the actual messages — the live threads, not a summary or your memory of them. Drafts
   are only as good as the real context they answer, so pull the current thread before writing.
2. Resolve the bucket scheme, in cascade — this order exists so you never impose structure
   the principal never agreed to:
   - **Use a committed scheme first.** If `memory/conventions/triage-scheme.md` holds a
     scheme, that is the scheme. Follow it.
   - **Otherwise, reuse how they already organize.** Look at their existing labels, folders,
     flags, and pinned or starred threads. If a real scheme is already in use, adopt it as
     the buckets, save it to `memory/conventions/triage-scheme.md`, and confirm in one line.
     Mirroring what they do beats inventing something new.
   - **Otherwise, propose before organizing.** Draft a scheme — start from **Respond**,
     **Delegate**, **Decide**, **Read**, **Archive** and tailor it to what's actually in the
     backlog — and show it with a small preview of how today's messages would sort. Only
     organize once they approve, then commit it to `memory/conventions/triage-scheme.md`.
     Restructuring an inbox on a scheme they never saw is how you lose their trust.
3. Sort every input into exactly one bucket, applying any drafting rules or do-not-touch
   entries the scheme carries. Rank within each bucket by who and what matters to this
   principal — consult `memory/priorities/` — priority people (`people.md`) and
   time-sensitive threads first, known noise (`noise.md`) last.
4. For everything in **Respond**, write the reply in the principal's voice, complete enough
   to send. A note that says "reply needed here" is not the deliverable; the reply is.
5. For **Decide** items, attach a one-line recommendation so the principal can act on your
   judgment rather than re-deriving the decision.
6. Add anything with an owner or a deadline to the running list in `memory/commitments/`.

## Writing drafts in their voice

Match how the principal actually writes — greeting, sign-off, sentence length, warmth,
and how blunt or hedged they tend to be. Study a few of their own sent replies before
drafting if you have access to them; imitating real examples beats guessing at a "professional"
default. Keep each draft self-contained and specific to the thread, so it reads as theirs and
needs no rewrite before it goes out.

**Example — a Respond item and its draft:**

Input: Priya emails asking for feedback on the Q3 board deck by Thursday's meeting.

Output:
```
Priya — "Q3 board deck review"
Draft: Hi Priya — read through it, and it's in good shape. One thing: slide 7's
revenue chart buries the YoY growth number, which is the headline. Can we pull that
to the top? Happy to look again after. Thanks for getting this out early.
```

## The memory this skill follows

The scheme lives in `memory/conventions/triage-scheme.md` — the buckets, the drafting rules
(e.g. "always draft replies to the board"), and the do-not-touch threads. Who ranks first and
what counts as noise come from `memory/priorities/` (`people.md`, `noise.md`). Consult both
before sorting; commit the scheme there through the cascade above, and treat the running
open-items list as `memory/commitments/`.

Learn the scheme from working with them, not from a questionnaire. It enters memory through
the cascade — adopted from how they already organize, or proposed and approved, with one
preview rather than an interview. From then on, treat every correction as a one-line update to
the file it belongs to: if they rename a bucket, move an item, say "that's not urgent," or
"always draft replies to my board," write it to `memory/conventions/triage-scheme.md` (or the
right `memory/priorities/` file) and confirm in one line so they know it stuck. Every so often,
read the inferred scheme back and ask, once, whether that's still how they want things sorted.

If memory is unavailable, keep the burden on yourself, not them: restate what you've learned at
the start of each triage and let them correct it, rather than making them re-explain their
system from scratch.
