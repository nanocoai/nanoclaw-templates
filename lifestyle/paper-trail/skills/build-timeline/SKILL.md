---
name: build-paper-trail-timeline
description: Turn indexed Paper Trail facts into a cited chronology, conflict register, and prioritized missing-evidence list after evidence has been ingested or updated.
---

# Build the timeline

Read `additional_context/evidence-rules.md` and
`additional_context/output-contract.md` first.

## Procedure

1. Read `case.json`, `manifest.json`, and every line of `facts.jsonl`.
2. Confirm each cited exhibit exists before using the fact.
3. Write `timeline.json` as an array of material events.
4. Use exact dates/times only when the cited source supports that precision.
   Put unknown-date events at the end with an empty `date`.
5. Detect disagreements in dates, amounts, identities, reference numbers,
   delivery status, and promised outcomes.
6. Write each unresolved disagreement to `conflicts.json`. Preserve every
   supported alternative and citation.
7. Determine what evidence is absent. Write `missing.json` with `BLOCKING`,
   `HIGH`, `MEDIUM`, or `LOW` priority, why it matters, where it might be found,
   and whether the packet can proceed.
8. Do not invent an organization's requirements or a legal deadline.

## Review gate

Set `case.json.state` to `REVIEW_NEEDED` when:

- a blocking item is missing;
- the requested outcome is unclear;
- a central fact has unresolved alternatives that would materially change the
  draft;
- an important exhibit is unreadable.

Ask the smallest question that can unblock the case. Ask one question at a
time. Otherwise leave the case ready for drafting.

