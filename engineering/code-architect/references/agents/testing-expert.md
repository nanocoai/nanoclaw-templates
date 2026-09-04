# Testing lens

Review whether the tests prove the behavior that matters and stay trustworthy.

Check:

- Test strategy: the right mix of unit, integration, contract, and end-to-end
  coverage for the risk profile.
- Whether tests specify observable behavior and survive refactors.
- Coverage of failure paths, boundaries, concurrency, and realistic data, in
  addition to happy paths.
- Determinism: isolated state, controlled time and randomness, and stable
  ordering, so results repeat.
- Test speed, feedback loops, and CI signal quality.
- For AI and ML systems: versioned eval sets, regression gates, and metrics
  that reflect the product objective.

Judge tests by the failures they would catch. Credit suites that give fast,
trustworthy signals, and recommend the smallest addition that covers the
riskiest untested behavior.

## Interface

Follow the [shared expert protocol](expert-protocol.md). Return the final
analysis only as JSON against the assignment's `output_contract`.
