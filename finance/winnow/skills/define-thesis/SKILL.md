---
name: define-thesis
description: Interview the user and write a screening thesis file. Use when the user wants to start a new screen, set up acquisition criteria, define what they are looking for, change an existing screen's criteria, or when a screening request arrives with no active thesis.
---

# Define a thesis

Produce a thesis YAML at `${PLUGIN_DATA}/theses/<slug>.yaml`. The schema is
`../screen-target/references/thesis-schema.md` — read it first.

Never write a thesis silently from conversation. Walk the steps, then show
the interpretation back before anything runs.

## Steps

**1 — The shape of the search.** What kind of company, what geography,
platform or add-on, rough size, obvious exclusions. Enough for a first draft.

**2 — Sort every criterion.** For each thing the user named, ask the
disqualification question in plain words:

> "If a company fails this, is it out — or is it just less attractive?"

Out → `hard_filters`. Less attractive → `scored_preferences`. Neither, but
they want it determined → `research_questions`.

**3 — Find the revisitable filters.** For each hard filter, ask:

> "If a company failed only this one, would you want to see it anyway?"

Yes → `revisitable: true`. Expect one or two. A screen with none is usually
a screen where someone has not admitted which rule they would bend. A screen
where everything is revisitable has no filters at all — push back.

**4 — Draft the scoring rubric.** Propose criteria, weights, and 100/50/0
anchors. The user edits; they should never build it from scratch. Check for
double-counting against revisitable filters: the filter sets the band, the
preference orders within it.

**5 — Research questions.** Ask what they would want an analyst to determine
about every company even when it decides nothing. This is where the unusual
diligence questions go. For anything where absence of evidence is likely,
write the evidence guidance to say so explicitly.

**6 — Depth and limits.** `fast` / `standard` / `deep`, universe size, and
deep-research cap. Say what each will cost in time.

**7 — Output preferences.** Which of the ranked table, briefs, failure
reasons, score breakdown, confidence, citations, and exports they want.

**8 — Interpretation, read back.** Before writing the file, state the thesis
in plain language:

> "I will include X, exclude Y — treating Z as revisitable — rank survivors
> on A, B, C, and investigate D and E for every company."

Correct whatever they push back on. This step catches more errors than the
rest combined.

**9 — Test run.** Screen 3–5 companies the user already has an opinion
about. Show band, findings, score, confidence, and reasoning for each. Ask
whether the calls match their judgement. Adjust the thesis, not the output.

Only then offer the full universe run.

## Writing the file

Write to `${PLUGIN_DATA}/theses/<slug>.yaml`, creating the directory if
needed. Never write into `${PLUGIN_ROOT}` — it is read-only.

Comment the file as you write it. Record *why* a filter is revisitable and
why a question is a question rather than a filter; a thesis reread in three
weeks needs its reasoning attached. `${PLUGIN_ROOT}/theses/example-fencing.yaml`
shows the commenting style.

**Only copy a thesis you intend to edit.** A shipped thesis under
`${PLUGIN_ROOT}/theses/` can be run directly — nothing writes to it. A copy
under `${PLUGIN_DATA}` is not updated when the template is, so an unnecessary
copy silently keeps running an old screen after an update. `init-run` reports
it when a copy shadows a shipped thesis that differs, but the cheaper fix is
not to copy in the first place.

To start from an example you *do* want to change, copy it into
`${PLUGIN_DATA}/theses/` first, then edit the copy.

## Validate before anything runs

```bash
node ${PLUGIN_ROOT}/scripts/winnow.mjs validate ${PLUGIN_DATA}/theses/<slug>.yaml
```

It checks structure — every criterion has a positive weight and 100/50/0
anchors, `revisitable` is a boolean, `coverage.report_by` names a filter
with an `include` list, enums are spelled right — and warns if weights do
not sum to 100. Run it every time you write or edit a thesis, and show the
user the result. A thesis that fails validation is not active.

The parser accepts a deliberate YAML subset (see `thesis-schema.md`). Write
plain nested maps and lists; avoid anchors, aliases and flow mappings.
