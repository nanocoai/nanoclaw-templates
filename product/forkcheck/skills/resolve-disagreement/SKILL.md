---
name: resolve-disagreement
description: >
  Detect and resolve a factual or testable disagreement by normalizing scope,
  expressing competing hypotheses, finding a discriminating observation,
  gathering evidence, issuing a qualitative verdict, and storing an evidence
  receipt. Use when a user presents conflicting claims, asks which source is
  correct, or when mutually incompatible evidence is discovered during work.
---

# Resolve a disagreement

## Goal

Turn disagreement into an observable fork: a result expected under one
hypothesis and not the alternatives.

## Procedure

1. Quote or faithfully normalize each claim. Identify claimant, time, version,
   region, environment, and definitions.
2. Test whether the claims genuinely contradict. Resolve ambiguity and scope
   first. If both can be true under different scopes, return `NO MATERIAL
   CONFLICT` or formulate the narrower remaining conflict.
3. Reject false objectivity. Subjective preferences, values, predictions with no
   measurable horizon, and unfalsifiable claims are not factual disagreements.
4. Form hypotheses that are mutually distinguishable and collectively cover the
   plausible claim set. Use H1/H2 for two claims; use H1..Hn when reality is not
   binary.
5. State the decisive question: “What observable result would differ if H1
   rather than H2 were true?”
6. Use the `design-test` skill. Do not gather broad research until the desired
   discriminating evidence is clear.
7. Gather only evidence relevant to the predictions. Use Tavily Search/Extract
   to discover current primary sources when available, but do not treat search
   rank, snippet text, or result count as a verdict.
8. If documents settle the question conclusively, stop. Otherwise, execute the
   selected minimal test only when the safety policy permits it.
9. Use the `evaluate-evidence` skill. Explicitly map each observation to every
   hypothesis.
10. Present the result in this order:
    `CONFLICT`, `HYPOTHESES`, `DECISIVE QUESTION`, `TEST OPTIONS`, `SELECTED
    TEST`, `OBSERVATION`, `VERDICT`, `EVIDENCE RECEIPT`, `RECHECK POLICY`.
11. Store the completed record using the ledger CLI. Write the record payload to
    the durable state directory, then run:

    ```bash
    node /workspace/agent/plugins/forkcheck/scripts/forkcheck-ledger.mjs record \
      --data-dir /workspace/agent/plugin-data/forkcheck \
      --input /workspace/agent/plugin-data/forkcheck/pending-record.json
    ```

    Report the assigned `FC-NNNN` ID and receipt path. Delete only the temporary
    payload after the command succeeds; never delete the ledger or receipts.

## Required record fields

The JSON payload must contain:

```json
{
  "question": "Exact scoped question",
  "hypotheses": { "h1": "...", "h2": "..." },
  "decisiveTest": {
    "name": "...",
    "method": "...",
    "expectedByHypothesis": { "h1": "...", "h2": "..." },
    "executed": true,
    "safety": "read-only"
  },
  "evidence": [
    {
      "classification": "OBSERVED",
      "title": "...",
      "source": "https://...",
      "retrievedAt": "ISO-8601 timestamp",
      "finding": "...",
      "supports": ["h1"],
      "contradicts": ["h2"],
      "limitations": ["..."]
    }
  ],
  "observation": "What was observed",
  "status": "SUPPORTED",
  "supportedHypotheses": ["h1"],
  "confidence": "HIGH",
  "limitations": ["..."],
  "volatility": "HIGH",
  "recheckIntervalDays": 7
}
```

Set `executed` to `false` for a documentary test or proposed experiment. Never
label an inference as an observation.

## Failure handling

- Inaccessible or authenticated evidence: record what was attempted and return
  `UNRESOLVED` unless other decisive evidence exists.
- Unsafe decisive test: show the test as `NOT TESTED`, explain the boundary, and
  return `UNRESOLVED` if passive evidence is insufficient.
- More than two claims: retain all viable hypotheses and choose tests that split
  the set as efficiently as safety permits.

