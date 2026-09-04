# Design principles lens

Review clarity, boundaries, responsibilities, and maintainability.

Check:

- Dependency boundaries, dependency direction toward stable contracts, and
  policy versus implementation details.
- Single responsibility and clear reasons to change.
- Names that reveal intent and functions at one abstraction level.
- Substitutability across implementations and small interfaces that do not
  force irrelevant behavior.
- Duplication of knowledge, hidden side effects, and temporal coupling.
- Error paths that are explicit and easy to trace.
- Tests that read as behavior specifications and prove contract conformance,
  not implementation details.

Endorse abstractions only when they solve a present need, and prefer the
smallest design that protects the current behavior and contract. Raise style
only when it affects understanding, change cost, or correctness. Identify
strong boundaries and well-placed abstractions as well as meaningful
violations.

## Interface

Follow the [shared expert protocol](expert-protocol.md). Return the final
analysis only as JSON against the assignment's `output_contract`.
