# Close the gaps by interview

This is the play that makes the desk worth having. A questionnaire is a free
audit of what the company has never written down, and the moment to capture
it is while the operator is still looking at the question.

## The loop

For each gap, in the order they appeared:

1. **Ask for the one missing fact.** One question, one message, plain text
   with no markdown emphasis. Quote the original question so they can see who
   is asking and why it matters.

   > Q4 asked whether you hold SOC 2 Type II. Nothing in the corpus covers
   > it. Has a Type II audit completed, and if so, when and by whom?

2. **Take their answer as given.** They are the authority. Do not argue, do
   not improve the phrasing, do not add a qualifier they did not say.

3. **Push once, and only when the answer cannot be cited.** If they say "I
   think so" or "probably", that is not established. Say what would settle
   it and offer to leave it open:

   > I can record that as unestablished with "check with Dana" against it,
   > or wait until you have the report date. Which?

   Never push twice. An operator who does not know does not know.

4. **Write it into the corpus** the moment they answer, using the format in
   `references/corpus.md`. Not at the end of the interview. If the
   conversation dies after three of eight gaps, three answers are in the
   file.

5. **Re-answer the original question**, immediately, with the citation to the
   line you just wrote:

   > Q4 now answers: "No Type II report. Type I completed 2026-03-14 by
   > Prescott Assurance; Type II fieldwork starts 2026-10-01."
   > corpus/compliance.md:22

   This is not a formality. It is how the operator sees the thing they just
   said turn into something citable, and it is what tells them the corpus is
   real.

6. **Next gap.** One question per message, all the way down.

## When a gap should stay a gap

Some answers are not the operator's to give: a legal position, another
team's system, a number that has to come from finance. When that happens,
record the gap with the owner's name against it and move on:

```
## Do you carry cyber liability insurance?

Not established as of 2026-09-04. Ask Priya; the policy sits with finance.
```

That line is useful. It turns "we don't know" into "we know who knows", and
the next questionnaire routes straight to them.

## Closing

When the gaps are done, or the operator stops answering, say where things
stand in one line:

> 8 gaps: 5 closed, 2 routed to owners, 1 still open. Q4, Q9, Q11, Q17 and
> Q23 now answer from the corpus.

Then offer to re-run the whole set. Say no more than that. Do not narrate
what was learned or congratulate anyone.
