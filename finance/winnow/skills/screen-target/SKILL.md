---
name: screen-target
description: Apply a thesis's hard filters, assign pass/near-miss/fail bands, score preferences, and rank. Use when screening, filtering, qualifying, scoring, or ranking companies against acquisition or screening criteria.
---

# Screen and rank

Turn researched candidates into three banded, ordered lists. Read
`references/thesis-schema.md` for the schema, `references/evidence-policy.md`
for what counts as evidence, `references/scoring-methodology.md` for how the
anchors are read, and `references/judgments-format.md` for the file you write.

## Division of labour — read this first

You make **judgments**. A script does **arithmetic**. Never the reverse.

- You decide, per company and per filter: `pass`, `fail`, or `unresolved`,
  with the evidence and its URL.
- You decide, per company and per criterion: a 0–100 against the anchors, a
  confidence, and one clause of why — or `null` when there is no evidence.
- You write those to disk **as each company completes**, one file per
  candidate (format in `references/judgments-format.md`). Never accumulate a
  whole run's evidence in context — it does not survive compaction.
- Then you run **`node ${PLUGIN_ROOT}/scripts/winnow.mjs screen`**, which
  assigns bands, normalises weights, computes totals, ranks within bands,
  tallies coverage, flags priority, and writes the brief, CSV and JSON.

Do not compute a total, assign a band, tally coverage, or hand-build the
ranked table yourself. Those are deterministic, the script is tested, and a
model doing them across forty companies will drift. If the script rejects the
file it names the company and field — fix the judgment, never work around it.

## 1 — Filter outcomes (yours) → bands (the script's)

Evaluate every hard filter for each company and record `pass`, `fail` or
`unresolved` with evidence. The script then applies:

| Condition | Band |
|---|---|
| Cleared every filter | **PASS** |
| Failed only `revisitable: true` filters | **NEAR MISS** |
| One or more filters unresolved, none firmly failed | **NEAR MISS** |
| Failed any filter without `revisitable: true` | **FAIL** |

A firm failure outranks everything: fail one firm filter and one revisitable
filter, the company is FAIL.

For each NEAR MISS record which filter put it there and what would settle
it — a fact to verify, or a judgement the user has to make. That sentence is
the band's whole purpose.

`missing_data_policy.mode: exclude` is the one override: unresolved filters
become FAIL rather than NEAR MISS.

## 2 — Criterion scores (yours) → totals (the script's)

Score every criterion 0–100 against its anchors for each company that has
not firmly failed a filter — you will not always know the band yet, and the
script ignores scores on FAIL companies. Score against the evidence you have,
not the company you imagine. No evidence → `null`, never a guessed number;
the missing-data policy decides what `null` means.

The script normalises weights, computes the weighted sum, rounds, and
carries the lowest confidence. You never do that arithmetic.

Do not score what a revisitable filter already tested. If the schema and
thesis disagree here, say so rather than silently double-counting.

## 3 — Run the script

```bash
node ${PLUGIN_ROOT}/scripts/winnow.mjs screen \
  ${PLUGIN_DATA}/theses/<thesis>.yaml \
  ${PLUGIN_DATA}/runs/<timestamp>/candidates/ \
  --out ${PLUGIN_DATA}/runs/<timestamp>
```

Point it at the **candidates directory** the run was opened in. The script
merges every `*.json` in it, with `_run.json` supplying top-level fields.

It refuses to screen a run that is not sound, rather than producing a brief
that looks fine:

- **fewer judgment files than the universe carried forward** — research the
  rest, or re-record the universe with `set-universe --carried <actual>`
- **the thesis changed after the run opened** — the evidence was gathered
  against a different screen; open a new run
- **evidence older than a day** — screens, but says so in the output

`winnow.mjs status <candidates-dir>` shows written-versus-expected at any
point. `--force` overrides the first two and records that it was forced; it
does not make the problem go away.

It ranks within bands only (a NEAR MISS at 90 never outranks a PASS at 70 —
it failed a filter the user wrote down), breaks ties on confidence then
scale, and flags PASS entries at or above `minimum_score_for_priority`.

## 4 — Report

Read `brief.md` from the output directory and present it — counts first.
`produce-brief` covers the presentation. Do not retype numbers from the
brief into prose; quote them.

## Consistency

Screen one criterion across all companies before moving to the next, not one
company at a time. Judging the same criterion repeatedly in a row keeps the
standard stable; company-by-company scoring drifts.

In fast mode the research subagents scored company by company, so this pass
is yours to do explicitly before you run the script: one criterion at a
time, down the column of digests, adjusting any score that sits out of line
with comparable evidence — see `research-target`.

Where a call was genuinely close, say so. A borderline 55 reported as a
confident 55 is a lie about precision.
