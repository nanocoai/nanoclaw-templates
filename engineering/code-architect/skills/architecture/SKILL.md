---
name: architecture
description: Plan or review software architecture through a small expert panel. Use when the user explicitly asks for architecture planning, system design, technical strategy, an architecture assessment, a design review, or a system health review. Do not use for ordinary PR review, debugging, or implementation.
---

# Architecture

Choose the mode from the user's request:

| Mode | Request | Instructions |
|------|---------|--------------|
| Planning | Design a new system, feature, refactor, migration, or technology choice. | [references/planning.md](references/planning.md) |
| Review | Assess an existing system, codebase, or proposed design for strengths and risks. | [references/review.md](references/review.md) |

Read the [shared workflow](references/workflow.md) and the selected mode's
instructions, then run the workflow end to end. The mode supplies scope inputs,
the book-guided expert output contract, verification checks, and report
sections; panel selection and expert execution are shared.

All resources ship inside this skill. Follow links relative to the file that
contains them. Assignment `output_contract` paths are relative to this skill's
`references/` directory, as defined in the
[assignment contract](references/contracts/expert-assignment.json).

Stay read-only unless the user separately asks for implementation. Deliver the
coordinator's verified report, keeping expert JSON as internal working data.
