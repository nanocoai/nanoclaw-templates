---
name: audit-paper-trail-case
description: Validate checksums, evidence references, fact states, timelines, conflicts, missing items, and draft grounding before declaring a Paper Trail packet ready or rendering it.
---

# Audit and render a case

## Validate

Run:

```bash
node plugins/paper-trail/skills/audit-case/scripts/validate-case.mjs "cases/<slug>"
```

Read the complete JSON result. If validation fails:

- do not set `PACK_READY` or `DRAFT_READY`;
- report all errors, not only the first;
- preserve completed work;
- repair deterministic format errors directly;
- ask one focused question for evidence ambiguities.

## Render

Only after validation succeeds, run:

```bash
node plugins/paper-trail/skills/audit-case/scripts/render-pack.mjs "cases/<slug>"
```

Then validate again. Report the generated paths:

- `CASE.md`
- `TIMELINE.md`
- `EXHIBITS.csv`
- `CONFLICTS.md`
- `MISSING.md`
- `DRAFT-LETTER.md`
- `PACK.html`

The rendered files are local views. Do not upload or publish them.

## Completion message

Summarize:

- unique exhibit and duplicate counts;
- supported timeline-event count;
- conflict count;
- blocking/high missing count;
- the most important unresolved item;
- packet and draft paths;
- reminder that the user must review before sharing.
