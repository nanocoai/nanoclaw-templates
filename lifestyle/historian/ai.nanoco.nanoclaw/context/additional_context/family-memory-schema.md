# The family memory (`family-memory/`)

`schema_version: 1`

One folder, plain Markdown, readable by a person and by any agent. Two kinds of agent write it:
an interviewer (this template) writes what people *told* it; a records researcher (for example
the `lifestyle/historian` template) writes what documents *show*. Both use the same files, so a
family can run either or both on one memory.

```
family-memory/
├── index.md              # entry point: one line per person, place, era, with links
├── people/<slug>.md      # one person
├── places/<slug>.md      # one place, with its name variants
├── eras/<slug>.md        # one period of one person's life
├── claims/<id>.md        # ONE fact each, with provenance and status
├── open-questions.md     # what a human must answer or fetch
└── log/<date>.md         # optional, agent-only: a researcher's search ledger; interviewers may ignore it
```

Slugs are lowercase, hyphenated, ASCII (`rivka-adler`, `lodz`, `rivka-adler-1946-1952`). Claim ids
are `<subject-slug>-<3 digits>` (`rivka-adler-017`): the subject the claim is about, then the next
unused number for that subject in `claims/`. Any agent writing a claim scans the folder first, so
two agents never mint the same id.

## `index.md`

```markdown
---
consent: { by: miriam-adler, on: "2026-09-04", wording: "Yes, keep it." }
---
# Family memory: the life of Rivka Adler

## People
- [Rivka Adler](people/rivka-adler.md) — subject; b. 1931 Łódź (candidate); d. 2019 Haifa (confirmed)
- [Miriam Adler](people/miriam-adler.md) — daughter, telling; living

## Places
- [Łódź](places/lodz.md) — birthplace (also "Lodz", "Litzmannstadt" 1940–45)

## Eras
- [Childhood in Łódź, 1931–1939](eras/rivka-adler-1931-1939.md)
```

## `people/<slug>.md`

```markdown
---
name: Rivka Adler
aka: [Rivka Adlerova, Regina Adler]
born: { date: "1931", place: lodz, confidence: candidate }
died: { date: "2019-03-02", place: haifa, confidence: confirmed }
living: false
relations:
  - { to: miriam-adler, kind: daughter }
prompt_pause_until: ""   # optional, tellers only: no scheduled prompts to this person before this date
---

What we know, in one paragraph per era, each sentence traceable to a claim: ... (rivka-adler-003)
```

`living: true` on any person means: every claim about them is `operator_only` and never appears
in a draft, summary, or message to the group. A claim whose subject is not living may name a
living relative ("survived by her daughter Miriam"); present-day facts about that relative
(health, money, whereabouts, conflict) are `operator_only` whichever claim they sit in. The
`consent` line in `index.md` is the interviewer's record that the family agreed to be recorded and
named; an interviewer that finds it missing runs its welcome first. Rule of thumb when unknown: born after
(current year − 100) and no death event ⇒ treat as living. **No dates at all ⇒ treat as living**
until a record shows a death or a birth more than a hundred years ago.

## `places/<slug>.md`

```markdown
---
name: Łódź
variants: [Lodz, Lodzh, Litzmannstadt (1940–1945)]
country_today: Poland
---
```

## `eras/<slug>.md`

```markdown
---
person: rivka-adler
years: "1931–1939"
place: lodz
people_present: [rivka-adler, chaim-adler]
---

Summary of the era from the claims, with claim ids in parentheses.
```

## `claims/<id>.md`

The unit of truth. One fact per file. Never merged, never silently edited; a wrong claim is
marked, not deleted.

```markdown
---
id: rivka-adler-017
subject: rivka-adler
statement: "Rivka's family lived at Kwiatowa 3 before the war."
status: candidate          # candidate | confirmed | unproven | stranger | contradicted | withdrawn
verified_by: interview     # interview | record | both
operator_only: false
sources:
  - kind: told
    by: miriam-adler
    on: "2026-09-04"
    quote: "Mum always said Kwiatowa 3, the one with the green gate."
  - kind: record
    url: "https://example.org/register/1939/172"
    quote: "Adler, Chaim, Kwiatowa 3"
    accessed: "2026-09-05"
---

Notes: why this status; what would change it.
```

Status ladder:

- **candidate**: one source, plausible.
- **confirmed**: two independent sources (two different tellers, or a teller and a record, or two
  records). One source never confirms.
- **unproven**: looked for, not found, with the search recorded. Not "false".
- **stranger**: a record about a same-named different person. Kept so nobody re-finds it.
- **contradicted**: two sources disagree. Both stay; the note says what each says.
- **withdrawn**: a verifier killed it (the quote is not on the page, the control was not a real
  control, the page is gone). The file stays with the reason in the note; nothing else changes.

A verifier only ever moves a claim down this list, never up, and never adds one. Claims whose only
sources are `told` are outside the verifier's reach (there is no page to re-open); they are not
stamped `verified` and stay `candidate` until a record arrives.

## `open-questions.md`

```markdown
- [ ] (ask_family) Which year did Rivka arrive in Haifa? — ask Miriam; fixes the 1946–1952 era boundary.
- [ ] (login_gated) 1939 register scan needs a human to order it from the archive — blocks "Kwiatowa 3" going to confirmed.
- [ ] (not_indexed_yet) Town cemetery index not yet online — retry later.
```

One line each: a blocker kind in parentheses, the question, who can answer or what a person must
do, why it matters. Blocker kinds, fixed list: `ask_family | login_gated | paid_index | image_only |
living_person | not_indexed_yet | other`. An interviewer mostly writes `ask_family`; a records
researcher writes the rest, and a scheduled retry may touch only `not_indexed_yet` lines.
