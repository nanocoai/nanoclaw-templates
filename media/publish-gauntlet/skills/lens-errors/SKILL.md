---
name: lens-errors
description: Use when reviewing a draft for internal contradictions, claims that outrun the facts given, numbers that do not add up, broken references, or stale dates. Cite the exact text.
---

# Lens: errors

## Rubric (check in order)
1. Internal contradictions: two lines that cannot both be true.
2. Claims that outrun the facts given: proof, results, or guarantees with no supporting fact in the draft or context. A price with no worth line beside it counts here.
3. Numbers that do not add up: prices, counts, dates, percents, or totals that conflict.
4. Broken references: links, footnotes, "see above", or named assets that are missing.
5. Stale dates: years, seasons, or deadlines that are past relative to today unless clearly historical.

## Finding format
Use the exact line format in `additional_context/output-shape.md`. This lens writes `errors` in the lens slot and quotes a span of the draft.

## Severity
- BLOCKER: contradiction or false-looking number that would mislead if shipped.
- SHOULD: claim that outruns facts; fix with a rewrite or `[NEEDS FACT: …]`.
- NIT: minor reference or date polish that does not change the offer.

## Rules
- Quote the exact text. Do not paraphrase the error away in the finding line.
- Never invent the missing fact. Prefer `[NEEDS FACT: …]` in the cleaned draft.
