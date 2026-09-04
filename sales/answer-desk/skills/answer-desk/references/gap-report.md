# The weekly gap report

Runs from the `weekly-gap-report` task. It is the operator's writing list.

## What it is

The questions that came in during the week that the corpus still cannot
answer, ranked by how often they were asked.

Read every file in `additional_context/answer-sets/` from the last seven days, plus
`additional_context/gaps.md`.
Group questions that mean the same thing even when the wording differs; three
customers asking about data residency in three phrasings is one gap asked
three times, and the count is the point.

## Shape

```
Week to 2026-09-08. 4 sets, 96 questions, 71 answered, 25 gaps.

Asked most, still unanswered:
  3x  Do you hold SOC 2 Type II?              (Northwind, Acme, Bergen)
  2x  Where is customer data processed?       (Acme, Bergen)
  2x  Is there a documented DR test?          (Acme, Northwind)

Routed to an owner, still open:
  1x  Cyber liability cover           -> Priya, since 2026-08-27
```

Then one line, and only one:

> Writing three entries would have answered 7 of the 25 gaps this week.

Stop there. Do not propose the entries, do not draft them, and do not offer
an opinion about the company's compliance posture. The operator decides what
is true about their own company; the report only says what people keep asking.

## When there is nothing

If no sets ran, say so in one line and stop. Do not manufacture a report out
of an empty week, and do not repeat last week's.

## After the report

Offer, once, to close the top gap by interview. If they say yes, run
`references/close-the-gap.md` against it. If they do not reply, leave it.
Never chase.
