---
name: pipeline-check
description: >
  Check that the scheduled data work behind the reports actually ran and produced something
  sensible: the daily reshaping scripts, the API pulls, the tables the client reports read from.
  Use each morning before anyone opens a report, when a report looks wrong, after a schema or API
  change, or when a new client is added to the pipeline.
---

# Pipeline check

## Goal

A broken or stale pipeline is found before a customer opens a report built on it, not after.

## When to use

- The morning check, before the reports are read.
- A report looks wrong and nobody knows whether it is the data or the query.
- After a schema change, an API change, or a new client being added.
- A scheduled job failed, or finished suspiciously fast.

## Procedure

1. **Check it ran at all, and when it finished.** A job that did not run leaves yesterday's data
   in place, which reads as a quiet day rather than as a failure. This is the single most valuable
   check here.
2. **Check the output volume against normal.** Row counts per client and per table, against what
   that day of the week usually produces. A run that finished in a third of the usual time with a
   tenth of the rows succeeded technically and failed in every way that matters.
3. **Check the freshness of what it depends on.** An upstream API that returned an empty response
   produces a clean run over nothing.
4. **Spot check the shape, not just the count.** Nulls where there should be values, dates outside
   the expected window, a client whose rows all landed on one site.
5. **Trace anything odd to the change that caused it.** A schema change, a new client, a source
   field renamed. `memory/conventions/pipelines.md` records what each job reads and writes.
6. **Say what is affected downstream:** which reports and which clients read the tables in
   question, so somebody knows who not to send a report to this morning.
7. **Draft the fix or the rerun and hold it,** unless a rerun is safe, idempotent and recorded as
   such.

## Boundaries

- Never rerun a job that is not recorded as safe to rerun. A partial second run is worse than a
  missing one.
- Never patch data by hand in a production table to make a report look right.
- Never report a job as healthy on the basis that it exited without an error.
- Never let a client report go out on data you know is stale without saying so.
- Keep customer data out of any log or message written while investigating.

## What to record

Keep `memory/conventions/pipelines.md` current: what each scheduled job reads and writes, when it
runs, what a normal output volume looks like, whether it is safe to rerun, and which reports
depend on it. Add each failure and its cause, since the same upstream API times out again.
