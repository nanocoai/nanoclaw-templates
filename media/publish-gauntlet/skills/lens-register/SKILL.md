---
name: lens-register
description: Use when checking the draft against the operator register in additional_context/register.md. Register violations are BLOCKER class.
---

# Lens: register

## Rubric (check in order)
1. Load `additional_context/register.md` (default or operator overrides).
2. Confident and specific: no apology openers, no begging, no lowered expectations.
3. Proof is stated as fact, not confession.
4. One clear next step; soft or hidden asks fail.

This lens judges tone only. A missing fact or a missing worth line belongs to the errors lens.

## Finding format
Use the exact line format in `additional_context/output-shape.md`. This lens writes `register` in the lens slot and quotes a span of the draft.

## Severity
- BLOCKER: every register miss (this lens is BLOCKER class by default).
- SHOULD / NIT: only if the operator register file explicitly downgrades a rule.

## Rules
- Operator file wins over the default bullets.
- Set `register: fail` only when a tone violation is still in the cleaned draft. A `[NEEDS FACT: …]` marker never fails the register.
- If a register BLOCKER cannot be fixed without a missing fact, keep the claim and add `[NEEDS FACT: …]`.
