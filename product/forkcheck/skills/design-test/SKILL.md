---
name: design-test
description: >
  Design and rank observations or experiments that distinguish explicit
  competing hypotheses. Use after a disagreement has been scoped, when deciding
  what evidence would actually settle a claim, or before executing a live
  verification.
---

# Design a discriminating test

## Core question

For each hypothesis ask: “What result would be expected here, and which other
hypotheses would make that result unlikely or impossible?”

## Candidate generation

Generate the smallest useful set of candidate tests, normally three:

1. current authoritative documentation or specification;
2. current machine-readable state, schema, repository, or API inspection;
3. minimal reproducible observation or executable request.

Add other candidates only when they produce a genuinely different observation.

## Candidate card

For each test state:

- predicted result under every hypothesis;
- evidential strength: `LOW`, `MEDIUM`, `HIGH`, or `VERY HIGH`;
- cost and time: `VERY LOW`, `LOW`, `MEDIUM`, or `HIGH`;
- risk: `NONE`, `LOW`, `MEDIUM`, or `HIGH`;
- reversibility: `READ-ONLY`, `REVERSIBLE`, or `IRREVERSIBLE`;
- permissions and credentials required;
- freshness and scope;
- stopping rule: the exact result that makes further testing unnecessary.

## Selection rule

Discard any candidate that is illegal, unsafe, irreversible, meaningfully
expensive, outside authorization, or unsupported by available tools.

Among the remaining tests, choose the cheapest test with enough evidential
strength to materially discriminate. A low-cost test that cannot distinguish
the hypotheses is not cheaper in the relevant sense; it is wasted work.

Prefer passive primary evidence when conclusive. Prefer a minimal direct
observation when documents conflict or describe behavior ambiguously. Stop as
soon as the decisive threshold is met.

## Before execution

Read `additional_context/safety-policy.md`. Confirm:

- target and scope are exact;
- request count and resource impact are bounded;
- expected outputs are safe to record;
- no secret will enter chat, source control, or the ledger;
- a failure cannot corrupt state or affect third parties;
- the result can be reproduced or independently inspected.

If any condition fails, return the proposed design as `NOT TESTED` and hand the
workflow back for passive evidence or `UNRESOLVED`.

