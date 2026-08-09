---
name: query-writing
description: >
  Write the SQL or MongoDB query that answers a question and keeps answering it: the right grain,
  no fan out, parameterised window, checked against something known. Use when a number is needed
  that no report carries, when an existing query returns something that looks wrong, when a query
  is slow or expensive, or when somebody asks for a one off pull.
---

# Query writing

## Goal

A query that returns the right rows today and the same rows next month, saved somewhere it can be
found instead of rewritten.

## Procedure

1. **Get the question before writing anything.** What is being counted, over what window, at what
   grain, with which exclusions. A query written from a one line request answers a question nobody
   asked.
2. **Check whether it already exists.** A saved query in `memory/queries/`, an existing report, a
   definition in `memory/conventions/metrics.md`. Rewriting an existing metric slightly
   differently is exactly how two reports end up disagreeing.
3. **Establish the grain and the key.** Which table or collection is one row per what, and which
   key is genuinely unique. In MongoDB, check whether the document shape is consistent across the
   collection, because it usually is not and the exceptions are where the wrong count comes from.
4. **Write it to be re-run.** Parameterise the window, name the columns rather than selecting
   everything, and avoid a wide scan you do not need. Explore with a limit, then remove it, since
   a limit caps rows returned and not work done.
5. **Check the fan out.** If the row count exceeds the distinct entity count, a join or an unwind
   is multiplying rows and every total after it is inflated. This is the defect that survives
   review because the output looks plausible.
6. **Sanity check the answer against something known** before handing it over: an existing report,
   a manual count on one slice you can verify by hand, last period's figure.
7. **Save it with the question it answers** written next to it, in `memory/queries/`.

## Boundaries

- Never run a write, an update or a delete against production data to answer a question.
- Never hand over a number without its window, its filters and its source.
- Never compute a metric that already has a definition in a different way. Use the definition, or
  change it deliberately and say so.
- Estimate the cost of a heavy scan before running it.
- Never leave a one off query only in a chat message. It will be asked for again.

## What to record

Save the query in `memory/queries/` with the question it answers and the date. When the query
establishes or settles a metric definition, write that to `memory/conventions/metrics.md` with its
numerator, denominator, window and source, so the next person computes it the same way.
