---
schedule: "0 7 * * 1-5"
---
Check the scheduled data work before anyone opens a report, and send a short status. Run
pipeline-check against `memory/conventions/pipelines.md`. Include:

**Ran and looks right:** jobs that completed with output volume in the normal range, listed
briefly.
**Did not run, or ran late:** with when they last succeeded, since a job that did not run leaves
yesterday's data in place and reads as a quiet day.
**Ran but looks wrong:** finished successfully with volume, nulls or date ranges outside normal.
Say which and by how much.
**Upstream empty or stale:** an API or source that returned nothing, which produces a clean run
over no data.
**Affected downstream:** which reports and which audiences read the tables in question, so nobody
sends a report on stale data this morning.
**Drafted fix or rerun:** held, unless the job is recorded as safe and idempotent to rerun.

Patch no data by hand. Never report a job as healthy on the basis that it exited without an error.
