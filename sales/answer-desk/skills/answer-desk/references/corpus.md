# The corpus: reading it and writing to it

`additional_context/corpus/` is the only evidence you have. This reference is
how you use it.

## Reading

Search across every file in `corpus/` before answering. A question about data
residency may be answered in `infrastructure.md`, `security.md` or
`contracts.md`, and the operator does not know which either.

Match on meaning, not wording. "Where is our data stored" and "In which
regions is customer data processed" are the same established fact.

`corpus/README.md` is documentation about the format. It is never evidence
and is never cited.

## The format of an entry

One `##` heading per established question, the answer in plain prose, then a
provenance line. Nothing else.

```markdown
## Where is customer data stored?

AWS eu-west-1, with encrypted backups replicated to eu-central-1. No customer
data leaves the EU.

Recorded 2026-09-04 by Dana.
```

The provenance line is part of the entry and never omitted. It is what makes
a two-year-old answer visibly two years old.

**Name the person, never the channel.** "Recorded 2026-09-04 by Dana."
A provenance line reading `by cli` or `by local-cli` is useless, because the
point of the line is that a human can be gone back to.

**The name lives in `additional_context/operator.md`.** Read that file before
writing your first entry of a session, and use the `name:` it carries. It is
the one definition; do not infer a name from anywhere else and never
substitute a channel id, a username, or a role word.

If `operator.md` still says `(not set)`, look at the most recent provenance
line already in the corpus and use that name, then write it into
`operator.md` so the next session does not have to look. If the corpus is
empty too, ask once, in the same message as the gap question so it costs no
extra turn: "...and whose name should go on it?"

Never block writing an entry on this. If you have asked and have no answer
yet, write the entry with `by (name pending)` and correct it when they say.
An answer captured with a weak provenance line beats an answer lost because
the conversation moved on.

## Citing

Cite as the path relative to `additional_context/` plus the line, or the line
range, that carries the answer: `corpus/infrastructure.md:14` or
`corpus/infrastructure.md:1-4`. A range is better when the answer spans lines.
Read the file and count; do not guess. A wrong citation is worse than a gap,
because it looks checkable and is not.

## Writing

**Append. Never rewrite, never delete.**

New answer, new heading, at the end of the right file. If no file fits, make
one, named after the subject in lowercase, and say that you did.

When a new answer contradicts one already in the corpus, keep both. Add the
new entry, and add one line to the old one:

```markdown
## Do you offer a 99.99% uptime SLA?

99.9% on the standard plan, 99.99% on enterprise.

Recorded 2025-11-02 by Dana.
Superseded 2026-09-04: see "What uptime is committed in the contract?"
```

The operator can prune. You cannot. An answer that vanished is an answer
nobody can audit, and the whole desk rests on being auditable.

## What never goes in

- Anything the operator did not say or confirm.
- Anything you found on the web, including on the company's own site. The
  website is marketing; the corpus is what someone will stand behind.
- Hedges. "Generally", "typically", "industry standard" and "best practice"
  are not facts. If that is genuinely the answer, the entry is a gap.
- Credentials, keys, tokens, or personal data about anybody.
