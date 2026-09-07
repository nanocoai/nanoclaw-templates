---
name: self-audit
description: Score caller threads from the last 24 hours against audit-rubric.md and post one health line to the owner thread.
---

# Self-audit

Used by `ai.nanoco.nanoclaw/tasks/nightly-self-audit.md`. Owner thread only. Do not contact callers.

## How to score a thread

Open `additional_context/audit-rubric.md`. For each caller thread in the last 24 hours, mark pass or fail:

1. name present
2. 10-digit callback present
3. job type present
4. address plus city present
5. one of the two offered windows present, unless the thread is an emergency (then `EMERGENCY_WINDOW`, see hours-and-windows.md)
6. confirmation line from the caller present

Count the thread `complete` only if all six pass.

Score an emergency thread on these five instead of the six above:

- the safe instruction went out first, before any question
- the owner was paged, owner thread only (placeholders from `additional_context/owner-contact.md`, never a caller-supplied third number)
- `EMERGENCY_WINDOW`, never either standard window
- a ledger line with `outcome=emergency` was appended
- whichever of name, callback number, and address the caller gave

For every thread, check that replies matched the caller's language (`en` or `es`).

If timestamps exist, note whether the first desk reply was under 10 seconds.

## Health-line format

Post exactly one line to the owner thread, shaped like:

`Self-audit 02:30: 4 intakes, 4 complete, 1 emergency escalated correctly, first reply under 10 s`

Replace the counts with this night's totals. Do not add a second paragraph.

## No traffic

If there were zero caller threads, do not invent a health line with live counts. Run both fixed scripts in `additional_context/rehearsal.md` as a dry run: rehearsal A against its expected intake record, rehearsal B against its expected desk behavior and ledger line. Score each `pass` or `fail`. Report in one line:

`Self-audit 02:30: 0 live threads; rehearsal dry run; rehearsal A pass, rehearsal B pass; drift: none`

or list the fields or steps that would have been missed.
