---
name: lens-ai-tells
description: Use when scanning a draft for em dashes, banned terms, hedge stacks, repeated sentence templates, and stacked verb lists. Counts must hit zero in the cleaned draft when a plain rewrite exists.
---

# Lens: AI tells

## Rubric (check in order)
1. Em dashes: count every em dash (Unicode U+2014). Target is zero.
2. Banned terms from `additional_context/banned-terms.md` (seamless, leverage, elevate, robust, unlock, delve, "it's important to note", "in today's fast-paced world", formulaic triads, hedge stacks like "try to / if possible / ideally" on requirements).
3. Identical sentence templates repeated three or more times.
4. Stacked verb lists that pad a line without adding a real step.

## Finding format
Use the exact line format in `additional_context/output-shape.md`. This lens writes `ai-tells` in the lens slot and quotes a span of the draft.

## Severity
- BLOCKER: any em dash; any banned term; any hedge stack on a requirement; triad or template spam that reads as generic model copy.
- SHOULD: stacked verbs that can be cut without losing meaning.
- NIT: near-miss phrasing that is not on the banned list but still sounds stock.

## Rules
- Read `additional_context/banned-terms.md` every run.
- Cleaned draft must report `Em dashes: 0 · banned terms: 0 · hedges: 0` when facts allow a rewrite.
