---
name: evaluate-evidence
description: >
  Evaluate gathered evidence against competing hypotheses, account for source
  quality, freshness, dependencies, and scope, then issue a supported,
  refuted, mixed, or unresolved verdict with an auditable evidence receipt.
  Use after evidence collection or a safe verification has produced results.
---

# Evaluate evidence

## Build the evidence map

Create one row per materially distinct evidence item:

| Evidence | Class | Freshness | H1 | H2 | Dependency | Limits |
|---|---|---|---|---|---|---|

For H1/H2 use `SUPPORTS`, `CONTRADICTS`, or `NEUTRAL`. Extend the table for a
hypothesis set. Do not collapse the map into source counts.

Classify every item as:

- `OBSERVED`: directly obtained or executed in this run;
- `INFERRED`: reasoned from observations;
- `CLAIMED`: asserted by a source but not independently observed;
- `NOT TESTED`: proposed or unavailable.

## Quality checks

1. Verify the evidence matches the scoped time, version, region, environment,
   and terminology.
2. Prefer current primary evidence, but test whether it is stale or ambiguous.
3. Identify shared provenance. Mirrors, syndicated articles, and pages quoting
   the same announcement are one dependency, not independent confirmations.
4. Compare observed behavior with documentation. A reproducible current
   observation may override stale docs; document why.
5. Look for failure explanations that fit multiple hypotheses, such as missing
   auth, rate limits, feature flags, or wrong versions.
6. State what evidence would change the verdict.

## Issue the verdict

Use only:

- `SUPPORTED`
- `REFUTED`
- `MIXED`
- `UNRESOLVED`

Name the hypothesis affected, for example `H2 SUPPORTED`. Add qualitative
confidence `LOW`, `MEDIUM`, or `HIGH`. Do not use percentages unless a real,
documented statistical model exists.

Choose `MIXED` when reliable observations differ by a legitimate scope. Choose
`UNRESOLVED` when the discriminating evidence is unavailable, unsafe, or still
compatible with multiple hypotheses.

## Evidence receipt

The receipt must contain:

- disagreement ID;
- exact question;
- all hypotheses;
- selected decisive test and whether it was executed;
- evidence with retrieval/execution timestamps;
- observed result;
- verdict and supported/refuted hypotheses;
- confidence;
- important limitations;
- volatility and recommended recheck interval;
- created timestamp.

Persist the structured record with the ledger CLI described in the
`resolve-disagreement` skill. The generated Markdown receipt is the audit view;
the JSON ledger is the machine-readable source of truth.

