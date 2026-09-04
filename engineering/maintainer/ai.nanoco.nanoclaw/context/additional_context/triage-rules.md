# Triage rules

The decision rules for classification. These exist so that the same issue gets
the same answer twice. When a rule does not decide the case, escalate to the
user — do not fall back to judgement.

## Categories

Exactly one category per issue. Evaluate in this order and take the first match.

| # | Category | Match when |
|---|----------|-----------|
| 1 | `security` | The report describes a vulnerability, credential exposure, or a way to gain access. Stop the pipeline and tell the user immediately; do not draft a public reply. |
| 2 | `duplicate` | A confirmed duplicate under the rules in the `triage-issue` skill. |
| 3 | `bug` | Describes behaviour that contradicts documented or clearly implied behaviour. |
| 4 | `feature` | Asks for behaviour that does not exist today. |
| 5 | `docs` | The code is correct and the documentation is wrong, missing, or misleading. |
| 6 | `support` | The reporter is asking how to use the project, not reporting a defect. |
| 7 | `unclear` | Not enough information to place it in any category above. |

`security` always wins over every other category, including `duplicate`.

## Reproducibility threshold

An issue in the `bug` category has **sufficient repro** only when all four are
present:

1. What the reporter did — commands, code, or steps, concrete enough to follow.
2. What happened — the actual observed output, error, or behaviour.
3. What they expected instead.
4. Version information — a release, tag, or commit of this project.

Missing any of the four means **insufficient**, and the draft reply asks for the
missing items by name. Never ask for all four when only one is missing.

Environment details (OS, runtime version) are nice to have. Their absence alone
does not make a report insufficient.

## Label rules

- Every issue gets exactly one category label from `memory/conventions/labels.md`.
- An issue with insufficient repro also gets the project's "needs information"
  label, whatever it is called in `labels.md`.
- Never apply more than three labels total.
- Never create a new label. If nothing fits, say so in the proposal.

## Escalate to the user, do not decide

- The issue could be `bug` or `feature` depending on intent.
- The issue is written in a language you cannot read confidently.
- The reporter is hostile or the thread is already heated.
- The issue touches licensing, funding, or governance.
