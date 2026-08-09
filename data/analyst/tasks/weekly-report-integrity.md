---
schedule: "0 9 * * 1"
---
Check that the reporting still says the same thing it said last week, and send what has drifted.
Include:

**Metrics computed in more than one place:** any metric in `memory/conventions/metrics.md` now
calculated in both the pipeline and a report or query, since that is where two reports start
disagreeing.
**Disagreements:** where two reports carrying the same number returned different values this week,
with both figures and which you believe.
**Definitions with no entry:** numbers appearing in a client report that are not defined in
`memory/conventions/metrics.md`, listed so they get settled rather than inherited.
**Clients with no baseline:** anyone in `memory/conventions/clients.md` whose expected output
volume is not recorded in `memory/conventions/pipelines.md`, meaning their runs cannot be checked.
**Queries worth saving:** anything answered ad hoc this week that is likely to be asked again and
is not yet in `memory/queries/`.

Change nothing. Report the drift and draft the fix. If a client report could not be reached, say
so rather than reporting it consistent.
