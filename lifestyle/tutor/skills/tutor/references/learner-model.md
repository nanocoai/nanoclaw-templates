# The learner model

Everything the tutor knows about the learner lives in memory as linked Markdown, per the memory
system's OKF convention (one concept per file, YAML frontmatter with `type`). This file fixes the
layout and the rules so every session reads and writes it the same way.

## Layout

```
memory/
├── index.md                       # Core Memory + Where we are (always loaded)
├── learner.md                     # type: learner
└── subjects/
    ├── index.md                   # one line per subject
    └── <subject-slug>/
        ├── index.md               # concept table
        └── <concept-slug>.md      # type: concept
```

Slugs: lowercase, hyphens, ASCII (`python`, `spanish`, `music-theory`; `list-comprehensions`,
`subjunctive-mood`).

## `memory/index.md`

Core Memory holds three lines, kept current:

```markdown
## Core Memory

- Learner: Dana. Default mode Explain; Socratic for maths. English, some Hebrew.
- Active subjects: [python](subjects/python/index.md) (12 concepts, 5 solid), [spanish](subjects/spanish/index.md) (3 concepts)
- Where we are: python / [decorators](subjects/python/decorators.md), Socratic, 2026-09-06. Stopped mid-way through why `@wraps` matters.
```

"Where we are" is what makes resume work. Update it at the end of every session and whenever the
subject changes mid-session.

## `memory/learner.md`

```markdown
---
type: learner
title: Dana
---

# Dana

## How they like to learn
- Default mode: Explain. Maths: Socratic.
- Likes analogies from cooking; dislikes long preambles.
- Language: English.

## Why they're learning
- Python: wants to automate reporting at work. Started 2026-09-01.
- Spanish: partner's family. Started 2026-09-04.

## Self-reports
- 2026-09-06: "I've got list comprehensions" → solid, on their word.
```

## Subject index: `memory/subjects/<subject>/index.md`

```markdown
---
type: subject
title: Python
description: Automating reporting at work; started 2026-09-01
---

# Python

| Concept | Status | Last touched | Next |
|---------|--------|--------------|------|
| [functions](functions.md) | ● solid | 2026-09-02 | |
| [closures](closures.md) | ◑ shaky | 2026-09-05 | why late binding bites in loops |
| [decorators](decorators.md) | ◔ forming | 2026-09-06 | `@wraps`, then decorators with arguments |
| [generators](generators.md) | ◯ untouched | | after decorators |
```

Glyphs: ◯ untouched · ◔ forming · ◑ shaky · ● solid.

`memory/subjects/index.md` is one line per subject: link, concept count, solid count, started date.

## Concept file: `memory/subjects/<subject>/<concept>.md`

```markdown
---
type: concept
title: Decorators
subject: python
status: forming
last_touched: 2026-09-06
prerequisites: [functions, closures]
related: [../design-patterns/wrapper]
sources:
  - https://docs.python.org/3/glossary.html#term-decorator
  - https://realpython.com/primer-on-python-decorators/
---

# Decorators

## What they've got
- Sees a decorator as "a function that takes a function and returns a function". Applied `@timer` correctly to their own code.

## Open threads
- 2026-09-06: said the decorated function "keeps its name". It doesn't without `@wraps`. Not yet resolved.
- 2026-09-06: hesitated on where the wrapper's arguments come from. Ties back to [closures](closures.md).

## Notes
- The analogy that landed: gift-wrapping a present, same present inside.
```

`prerequisites` and `related` are links to other concept files: same subject by bare slug, other
subjects by `../<subject>/<slug>`. Links go both ways: when you add one on A, add the reverse on B.

## Status rules

| From | To | When |
|------|----|------|
| untouched | forming | first real engagement with the concept |
| forming | solid | the learner explains it, applies it to a new case, or says they've got it |
| any | shaky | a misstatement or a hesitation on a foundation, or the learner says so |
| shaky | solid | the specific open thread is resolved: they explain the thing they had wrong |
| solid | shaky | a foundation slip surfaces later, inside another concept |

The learner's word always wins and is recorded as such: set the status they said, and add a line
under Self-reports in `memory/learner.md`. Never re-test a self-reported status.

## Writing rules

- Write during the session, not only at the end: after each probe result, each resolved thread,
  each new tangent.
- Open threads are dated and specific: the exact misstatement, not "confused about X".
- When a thread resolves, move it from Open threads into What they've got, with the date.
- When a tangent becomes its own concept, create the file with `status: forming`, link it from
  the concept that spawned it under `related`, and add the reverse link.
- Update the subject index row whenever the concept file changes. Update `subjects/index.md` when
  a subject is added.
- `sources` holds only URLs you actually taught from or recommended, not every search hit.
- Set `last_touched` to today whenever you edit the file for a reason other than a link update.
