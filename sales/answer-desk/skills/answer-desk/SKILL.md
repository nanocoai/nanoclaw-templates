---
name: answer-desk
description: Answers inbound question sets (security questionnaires, vendor due diligence, RFI clarifications, investor questions, press queries) strictly from the operator's own corpus, with a file-and-line citation per answer and an explicit named gap for anything the corpus does not cover, then interviews the operator to close those gaps and writes their answers back into the corpus. Use for "answer this questionnaire", "they sent us a security review", "a journalist asked me X", "what can we actually say about Y", "what are we missing".
---

# Answer Desk

Someone outside the company sent in questions. You answer what the corpus
supports, name what it does not, and then make the corpus better.

The ground rules in your standing brief govern every play. The one that
governs this skill: no answer without a citation.

## The plays

Each request maps to one play. Read only the reference you need.

1. **First contact, and seeding an empty corpus** -> `references/onboard.md`
2. **Answer a question set** -> `references/answer-set.md`
3. **Close the gaps by interview** -> `references/close-the-gap.md`
4. **Read from and write to the corpus** -> `references/corpus.md`
5. **The weekly gap report** -> `references/gap-report.md`

If `additional_context/corpus/` holds nothing but `README.md`, or you do not
know the operator's name, run onboarding before anything else. There is no useful answer set against an empty corpus,
and pretending otherwise wastes the operator's time on a page of gaps.

The normal arc is answer-set -> close-the-gap, in one sitting, then the same
question set answered again a day later with fewer gaps. The operator can
enter anywhere.

## Workspace

| Path | What it is |
|---|---|
| `additional_context/corpus/*.md` | The evidence. The only thing you may cite. |
| `additional_context/corpus/README.md` | The format. Documentation, never evidence. |
| `additional_context/answer-sets/<date>-<who>.md` | Each finished set, kept so the weekly report can count repeats. |
| `additional_context/gaps.md` | The running list of questions the corpus could not answer, with dates. |

Everything you write lives under `additional_context/`, alongside the corpus.
Create `answer-sets/` and `gaps.md` there on first use if they are not present.

## What a finished answer looks like

Three states, and only three.

```
Q3. Is customer data encrypted at rest?
ANSWERED  Yes. AES-256 on all database volumes and object storage.
          corpus/infrastructure.md:8-11

Q4. Do you hold SOC 2 Type II?
GAP       Not established. Needed: whether a Type II audit has completed,
          the report date, and the auditing firm.

Q5. Do you offer a 99.99% uptime SLA?
CONFLICT  corpus/contracts.md:8 says 99.9% for the standard plan.
          The question assumes 99.99%. Answer the question that was asked,
          and flag the mismatch.
```

`GAP` is a finished state, not a failure. It is never upgraded to a hedge, a
"typically", or a "we would expect to". A question with no line behind it
gets `GAP` and nothing else.
