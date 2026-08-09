---
name: report-onboarding
description: >
  Stand up reporting for a new audience — an external client, a business unit, a region, an
  executive team — end to end: what they need to see, whether the data exists, access and
  scoping, their place in the pipeline, the standard report set, and validation against numbers
  they can check themselves. Use when a new audience is onboarded, when an existing one adds a
  site, a region or a business unit, when their reporting is rebuilt after a change on their
  side, or when they say the numbers do not match their own records.
---

# Report onboarding

## Goal

Three things are true before the new audience sees anything, and each is checked, not assumed:

1. Every report they were promised exists and runs on its schedule.
2. They see their own data and nothing else — verified in isolation, by querying or logging in
   as them, wherever a scoping rule applies.
3. Every headline number has been validated against a source they can check themselves, and
   which number was validated against what is recorded.

## Procedure

1. **Get what they need to see and who reads it.** An operations lead and an executive want
   different reports, and building one and calling it both satisfies neither.
2. **Confirm the data exists for them before promising anything.** A new audience often has weeks
   rather than years of history, and a trend chart built on three weeks is misleading in a way
   that is hard to walk back once they have seen it.
3. **Set up access and scoping first, and verify it in isolation.** Log in as them, or query as
   them, and confirm they see their data and nothing else. One audience seeing another's data
   is the failure that costs most here, and it is cheapest to prevent at this step.
4. **Add them to the pipeline.** Which scheduled jobs have to include them, what the daily
   reshaping needs, and an entry in `memory/conventions/pipelines.md` with their expected output
   volume so the morning check can tell when their run is wrong.
5. **Build from the standard report set before anything bespoke.** A bespoke report built first
   becomes the thing that has to be maintained forever, and it usually turns out the standard one
   would have done.
6. **Validate every number against a source the audience can check themselves,** and say which
   ones you validated and against what. Their own count of sites, their own complaint log, their
   own invoice.
7. **Run it for a full cycle before handing over,** so the first real scheduled run happens while
   somebody is watching rather than on a Monday morning in front of the audience.

## Boundaries

- Never enable a report before verifying data scoping in isolation, wherever a scoping rule
  applies.
- Never include another audience's data in any report or any aggregate, however useful the
  benchmark would be.
- Never ship a trend over a period too short to carry one. Say the history is thin instead.
- Never build bespoke before the standard set is working.
- Never hand over a report you have not watched run on a real scheduled cycle.

## What to record

Keep one entry per audience in `memory/conventions/audiences.md`: their sites and business units,
which reports they get and who reads each, their scoping rule, the pipeline jobs that include
them, and which numbers were validated against what. Add their expected output volume to
`memory/conventions/pipelines.md` at the same time, since an audience with no baseline cannot be
checked.
