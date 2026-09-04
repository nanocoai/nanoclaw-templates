# Onboarding: seed the corpus

Run this when `additional_context/corpus/` holds only `README.md`, or when the
operator asks to start over.

The goal is not a complete corpus. It is enough of one that the first real
question set produces some answers and not a page of gaps. Six to ten
established facts is enough to start.

## How to run it

One question per message. Wait for the answer. Write it into the corpus
before asking the next one, so that an interrupted onboarding still leaves
something behind.

Open by getting the one thing every later entry needs:

> Before we start: what should I put on entries you establish? Every answer
> in the corpus carries who said it, so a name is enough.

Write it into `additional_context/operator.md` as the `name:` value, and use
it in every provenance line from then on. Without
it the corpus fills with entries recorded "by the operator", which defeats the
purpose of the line: somebody reading a two-year-old answer needs a person to
go back to.

Skip this question when the corpus already carries provenance lines: read the
most recent one instead. Onboarding an established corpus should not ask for
something the file already says.

Then ask what they get sent, not what you want to store:

> What kind of questions do you get sent most? Security reviews from
> customers, investor diligence, press, something else?

Their answer chooses the starting file. Then work through the subjects below
that apply, one question at a time, in their words.

| If they get | Start with |
|---|---|
| Security reviews, vendor onboarding | `corpus/security.md`, `corpus/infrastructure.md` |
| Investor or acquirer diligence | `corpus/company.md`, `corpus/contracts.md` |
| Press and analyst queries | `corpus/company.md`, `corpus/product.md` |
| Procurement and RFIs | `corpus/company.md`, `corpus/contracts.md` |

Useful opening subjects, in rough order of how often they get asked:

- What the company does, in the sentence they would use on the record.
- Where customer data lives: which provider, which regions.
- Encryption at rest and in transit, if they know it.
- Which compliance reports exist today, and which do not. **Record the ones
  that do not.** "No SOC 2 report as of 2026-09-04" is an established answer
  and it is the single most useful line in a new corpus.
- Whether there is a DPA, and where it lives.
- Headcount, incorporation, and how long they have been operating.
- Support and uptime commitments actually written into contracts.

## Two things to insist on

**Their words, not yours.** Write down what they said. If they say "we have
not done SOC 2 and we are not going to this year", that is the answer. Do not
translate it into "SOC 2 certification is not currently in scope".

**Do not accept a maybe.** If they say "I think we're on AES-256?", that is
not established. Say so, and record it as a gap with the specific thing to
check, rather than putting a question mark in the corpus.

## Closing

Read back what is now established, as a short list with the file names. Then
tell them the desk is ready and that the first real questionnaire will produce
gaps, which is the point, because each one gets closed in the same
conversation.
