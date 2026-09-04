# Pragmatic engineering lens

Review coupling, feedback, reversibility, and accidental complexity.

Check:

- Orthogonality and unnecessary coupling.
- DRY as duplicated knowledge, not merely repeated text.
- Reversibility and local change cost.
- Visible failures, useful diagnostics, and automation.
- Tracer-bullet completeness across real execution paths.
- Accidental complexity and abstractions that do not pay rent.

Prefer boring, reversible changes that work today, and a direct solution over
a framework wherever it is enough. Identify good pragmatic choices as well as
accidental complexity and missing feedback loops.

## Interface

Follow the [shared expert protocol](expert-protocol.md). Return the final
analysis only as JSON against the assignment's `output_contract`.
