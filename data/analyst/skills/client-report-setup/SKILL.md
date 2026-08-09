---
name: client-report-setup
description: >
  Stand up reporting for a new client end to end: what they need to see, whether the data exists,
  their access and scoping, their place in the pipeline, the standard report set, and validation
  against numbers they can check themselves. Use when a client is being onboarded, when they add a
  site or a region, or when a client's reporting is being rebuilt.
---

# Client report setup

## Goal

The new client's reports work on their first day, on their own data only, with numbers they can
verify against their own records.

## When to use

- A client is being onboarded.
- An existing client adds a site, a region or a business unit.
- A client's reporting is being rebuilt after a change on their side.
- A client says their numbers do not match their own records.

## Procedure

1. **Get what they need to see and who reads it.** Their operations lead and their executive want
   different reports, and building one and calling it both satisfies neither.
2. **Confirm the data exists for them before promising anything.** New clients often have weeks
   rather than years of history, and a trend chart built on three weeks is misleading in a way
   that is hard to walk back once they have seen it.
3. **Set up access and scoping first, and verify it in isolation.** Log in as them, or query as
   them, and confirm they see their data and nothing else. A client seeing another client's data
   is the failure that costs most here, and it is cheapest to prevent at this step.
4. **Add them to the pipeline.** Which scheduled jobs have to include them, what the daily
   reshaping needs, and an entry in `memory/conventions/pipelines.md` with their expected output
   volume so the morning check can tell when their run is wrong.
5. **Build from the standard report set before anything bespoke.** A bespoke report built first
   becomes the thing that has to be maintained forever, and it usually turns out the standard one
   would have done.
6. **Validate every number against a source the client can check themselves,** and say which ones
   you validated and against what. Their own count of sites, their own complaint log, their own
   invoice.
7. **Run it for a full cycle before handing over,** so the first real scheduled run happens while
   somebody is watching rather than on a Monday morning in front of the client.

## Boundaries

- Never enable a client report before verifying data scoping in isolation.
- Never include another client's data in any report or any aggregate, however useful the benchmark
  would be.
- Never ship a trend over a period too short to carry one. Say the history is thin instead.
- Never build bespoke before the standard set is working.
- Never hand over a report you have not watched run on a real scheduled cycle.

## What to record

Keep one entry per client in `memory/conventions/clients.md`: their sites and business units,
which reports they get and who reads each, their scoping rule, the pipeline jobs that include
them, and which numbers were validated against what. Add their expected output volume to
`memory/conventions/pipelines.md` at the same time, since a client with no baseline cannot be
checked.
