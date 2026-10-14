# Writing memory

The layout is in `additional_context/family-memory-schema.md`. This is how to fill it honestly.

## Claims first

Everything factual becomes a claim file, one fact each, before it goes anywhere else. A person
file or an era file only summarizes claims and cites their ids. If you cannot point at a claim,
you cannot write the sentence.

For anything a family member told you:

```yaml
sources:
  - kind: told
    by: <teller slug>
    on: "<date>"
    quote: "<their actual words, short>"
status: candidate
verified_by: interview
```

One teller is `candidate`. Two tellers who were not in the same conversation, agreeing
independently, is `confirmed`. Two tellers disagreeing is `contradicted`, with both quotes, and a
line in `open-questions.md`. A teller saying "I think" or "maybe" stays `candidate` and the note
says they were unsure.

## The statement is the fact, not the telling

Write the statement as the fact the teller asserted, and let `sources` carry who said it:
`statement: "Houdini was born in Appleton on April 6, 1874."` with `by: ruth` and Sol's words in the
quote. Never `"Sol told the family that Houdini was born in Appleton"`: that sentence is true
even if the fact is false, so nothing can ever confirm or contradict it, and a records
researcher reading the folder later has nothing to test. The subject of the claim is the person
the fact is about; when a teller passes on a story about someone outside the family (a public
figure, a neighbour), the subject is that person and the note says who told it and on what
occasion. Notes explain the status; they never instruct another agent ("do not research this"):
what to research is the family's decision, made when they run a researcher.

## What is a fact and what is not

Facts: names, dates, places, relationships, events, objects, who was present.
Not facts, but still gold: feelings, sayings, habits, the way she laughed. Put these in the
person's file body or the era file, attributed ("Miriam remembers her mother humming while
cooking"), not as claims. They are never `confirmed` or `contradicted`; they are remembered, and
a draft may use them, cited by file.

## Living people

Every teller is living. Mark them `living: true`. Any present-day fact about a living person
(health, money, conflict, whereabouts) is `operator_only: true` and never appears in a draft or a
message to the group. A claim about the subject may name living relatives ("survived by her
daughter Miriam"); the tellers agreed to be named at the welcome. A claim's statement never
carries a living person's present-day behaviour or opinion ("David rolls his eyes at that one");
that detail is theirs, not the subject's, and stays out of the statement. If the subject is living, the
same rule applies to their present-day life; their past is the book.

## Names and spellings

Keep the first spelling you were given as `name`, and every other spelling you hear in `aka`.
Never "correct" a family's spelling of their own name. Ask once if two tellers spell it
differently; record both.

## Dates

Store what was said, with its precision: `"1931"`, `"spring 1946"`, `"before the war"`. Do not
invent a month. When you compute an age or a gap between two dates, do it with code if the host
offers code, and write the computed value in the note with both inputs. Without code, write the
inputs and the arithmetic in the note and leave the result as a question, not a fact.

## Eras

Create an era when three or more claims cluster in one period and place. Name it
`<person>-<start>-<end>`. The era body is a short narrative built only from its claims, with ids
in parentheses, so a reader can check every sentence.

## Notes

A claim's note says why it has its status and what would change it. It carries no outside
knowledge and no interpretation: not what a custom "usually means", not where a habit "probably
came from". If context seems worth having, it is a question for the family, not a note.

## Open questions

One line per gap: the question, who can answer it, why it matters. Create the file in the first
session that produces a claim, even with a single line; a memory with claims and no open
questions is a sign the session was not written up. Remove a line only when a claim answers it;
cite the claim.

## Index

Keep `index.md` current every time you add a person, place, or era. One line each, with a link
and the one fact that identifies them. The index is what a family member opens first.
