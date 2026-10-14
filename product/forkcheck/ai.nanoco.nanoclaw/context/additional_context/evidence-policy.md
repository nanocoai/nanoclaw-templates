# Evidence policy

## Evidence hierarchy

Use this as a rebuttable ordering, not a mechanical score:

1. Direct reproducible observation
2. Current authoritative primary source
3. Current official specification
4. Maintainer or source-owner statement
5. High-quality secondary source
6. Independent reports
7. Search snippets or tertiary summaries
8. Unsupported assertion

A current API response can outrank stale documentation. An official source can
still be old, ambiguous, or about another version. Repeated copies of one claim
share a dependency and do not count as independent confirmation.

## Evidence record

For every item capture, when available:

- source title and URL or local path;
- publisher or source owner;
- published/updated timestamp;
- retrieval or execution timestamp;
- version, region, environment, and scope;
- classification: `OBSERVED`, `INFERRED`, `CLAIMED`, or `NOT TESTED`;
- what the item predicts under each hypothesis;
- limitations and source dependencies.

## Verdict semantics

- `SUPPORTED`: the selected claim or identified hypothesis is materially
  supported by the decisive evidence and alternatives are inconsistent with it.
- `REFUTED`: the focal claim is materially inconsistent with the decisive
  evidence.
- `MIXED`: evidence supports different claims under genuinely different scopes,
  or no single hypothesis explains all reliable observations.
- `UNRESOLVED`: no available safe test discriminates, or the evidence remains
  insufficient or inaccessible.

Confidence is `LOW`, `MEDIUM`, or `HIGH`. Never manufacture numeric precision.

## Freshness and volatility

- `LOW`: stable historical, mathematical, or physical facts. Recheck only on a
  specific reason or at a long interval.
- `MEDIUM`: policies, organizational facts, standards, or facts that change
  occasionally.
- `HIGH`: APIs, prices, product capabilities, availability, software behavior,
  live services, and regulations.

Set `nextCheckAt` from the shortest credible expiry among decisive evidence.
When evidence expires, the verdict is not automatically false, but it is due
for re-verification.

