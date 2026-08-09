---
name: report-spec
description: >
  Turn a request for a report or a dashboard widget into something buildable: the question it
  answers, the metric and its definition, where the data comes from, the query shape, and what it
  will not answer. Use when a new client report is requested, when an existing one needs changing,
  when a widget is asked for, or when two reports disagree about the same number.
---

# Report spec

## Goal

A spec somebody can build against without a follow up conversation, and a number that means the
same thing next quarter as it does today.

## When to use

- A new client report or dashboard is requested.
- An existing report needs a metric added or changed.
- A widget is asked for in a sentence and needs pinning down.
- Two reports disagree about the same number.

## Procedure

1. **Get the question behind the request.** A request for a chart of complaints per site is really
   a question about which sites need attention, and the answer might not be that chart.
2. **Define the metric precisely:** the numerator, the denominator, the window, the grain and the
   filters. Check `memory/conventions/metrics.md` first, since the same word usually already means
   something here.
3. **Say where each field comes from,** which table or endpoint, at what grain, refreshed how
   often. A metric assembled from two sources with different refresh cadences will disagree with
   itself.
4. **Check the grain before designing the query.** If the join can produce more rows than entities,
   every total downstream is inflated, and this is the defect that survives review because the
   numbers look plausible.
5. **Decide where it is computed.** In the pipeline, in the query, or in the reporting layer.
   Computing the same metric in two places is how two reports end up disagreeing.
6. **Say what it will not answer,** so nobody reads a cause into a count.
7. **Note the cost:** how heavy the query is, how often it runs, and whether it needs its own
   pipeline step rather than running live.

## Boundaries

- Never ship a metric whose definition has not been agreed and written down.
- Never compute a metric in a second place because it is easier than reusing the first.
- Never build a client facing report on a source you have not checked the refresh cadence of.
- Never include another client's data in a client facing report, in any aggregate.
- Do not build it as part of specifying it. The spec is the deliverable here.

## What to record

Write every agreed definition into `memory/conventions/metrics.md` with its numerator,
denominator, window, source and the date it was agreed, and note where it is computed. When two
reports are found disagreeing, record the cause there too, because the same pair will disagree
again after the next change.
