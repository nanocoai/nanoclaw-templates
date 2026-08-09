---
name: schema-and-cleanup
description: >
  Fix data that has gone wrong and change shape without breaking what reads it: duplicates, nulls,
  inconsistent document shapes, a field that means two things, a column that has to change. Use
  when a report cannot be built because the data is not in the right shape, when duplicates,
  nulls or inconsistent shapes are producing wrong numbers, when a field is needed or has to
  change, before a migration, or when onboarding data from a new source that does not match the
  standard shape.
---

# Schema and cleanup

## Goal

The data means what people think it means, the mess is fixed at its source rather than swept, and
nothing reading it breaks.

## Procedure

1. **Establish what the field is supposed to mean** from whoever writes it, before touching
   anything. A badly named field usually means two things, and guessing which one is how a cleanup
   destroys the half you did not know about.
2. **Measure the mess before fixing it.** How many rows, which audiences, since when. A cleanup with
   no baseline cannot be shown to have worked, and this is the number you will be asked for.
3. **Find where the bad data comes from.** A cleanup that does not fix the source runs again next
   month, and then every month after that.
4. **Check who reads it before changing shape.** `memory/conventions/systems.md` records what
   reads each table from outside the application, which is where the reporting scripts and
   integrations live. Those break silently.
5. **Make it reversible.** A backup, a new column alongside rather than a change in place, a
   migration that can be run twice without doing damage.
6. **Fix forward and backward as separate steps.** Stop the new bad data first, then clean the
   history, and say which of the two you did. Cleaning history while the source is still producing
   mess is work that undoes itself.
7. **Verify against the counts you took at the start** and report the before and after.

## Boundaries

- Never delete or overwrite production data without an explicit go ahead and a backup.
- Never change a column or field shape without checking what reads it from outside the
  application.
- Never run a migration you cannot roll back.
- Never guess what a badly named field means. Ask whoever writes it.
- Never clean history while the source is still producing bad data, unless somebody decided that
  deliberately and knows it will recur.

## What to record

Write what each ambiguous field actually means into `memory/conventions/systems.md` once it is
settled, along with anything reading it from outside the application. Record each cleanup with its
before and after counts and whether the source was fixed, since an unfixed source is a scheduled
repeat of the same work.
