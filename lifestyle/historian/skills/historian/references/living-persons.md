# Living persons

Records research finds things about people who did not ask to be found. For
the dead, that is history. For the living, it is a privacy problem, and it
is not yours to solve. You hold them back and let the family decide.

## Who counts as living

A person is treated as living when **any** of these is true:

- The person page says `living: true`.
- Their birth year is later than the current year minus 100, and no death
  event is recorded.
- **They have no dates at all.** No birth, no death. Unknown is living until
  a record shows a death, or a birth more than a hundred years ago.

The family member who is talking to you is living. Their children are living.
Anyone named only as "my cousin" or "his grandson" is living.

## What the hold means

For a living person:

- Every claim with them as `subject` has `operator_only: true`.
- Those claims never appear in a draft, a summary, a report, or a message
  to the chat. Not as a count, not as "one hit was set aside", not as a
  hint that something is held. They exist in the folder for the family's
  own record and for the operator who runs the agent.
- You do not search for them. If the brief says "find out about Eitan", write
  an open question with kind `living_person` and ask the family what they
  actually want. Usually they want the grandmother, and Eitan is context.
- You do not open a page whose main subject is a living person. If a search
  result is clearly about one, mark it `skipped: living person` in the
  ledger.

## The subject with no stated status

"My grandfather Moshe, somewhere in Galicia" does not say whether Moshe is
alive. Past tense is not a death. Ask one question first: "Is Moshe still
with us?" Until it is answered he is living, and you say so in one line
rather than silently returning nothing.

## What you read is not what you repeat

A told claim or an open question may carry a living relative's present-day
behaviour or state ("David rolls his eyes at that one every year", "Ruth is
not well"). When you read such a line, use the fact it contains and drop
the person. Your plan, your open questions and your report never repeat a
living person's behaviour, health, opinions or whereabouts, even when the
family wrote them first.

## The grey case

A record about the dead often names the living. A death notice for the
grandmother lists her children. Quote the line about the grandmother. Do not
create claims for the children from it. If the family wants the children's
names recorded, they say so, and the claims are `operator_only`.

## Worked example

Brief: Hinda Rosner (d. 2018), told by her daughter Miriam Katz (b. 1958),
grandson Eitan.

- Hinda: died 2018. Not living. Research her.
- Miriam: born 1958, that is later than current year minus 100, no death.
  Living. `people/miriam-katz.md` gets `living: true`. No search. No claims
  in any report.
- Eitan: no dates. Living by default. Same treatment.

A death notice for Hinda says "survived by her daughter Miriam and grandson
Eitan". The claim is about Hinda: "Hinda Rosner died in 2018; a notice names
a daughter and a grandson." Quote it. Do not write `miriam-katz-001`.

## Why this is strict

An agent that leaks one living person's address into a family chat has done
more harm than a hundred unfound records. The rule has no exceptions and the
verifier checks it on every claim.
