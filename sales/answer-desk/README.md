# Answer Desk

An agent for the person who keeps getting sent questions they have to answer
on the record: security questionnaires, vendor due diligence, RFI
clarifications, investor questions, journalist queries.

It answers only from a corpus you wrote, cites the file and line behind every
answer, and marks everything else as a gap with the specific missing fact
named. Then it asks you those questions, one at a time, and writes your
answers into the corpus so the next questionnaire is shorter.

```
ncl groups create --template sales/answer-desk --name "Answer Desk"
```

## What it does

**Answers a question set.** Paste or forward the questions. Every question
comes back in one of three states:

```
Q3. Is customer data encrypted at rest?
ANSWERED  Yes. AES-256 on all database volumes and object storage.
          corpus/infrastructure.md:8-11

Q4. Do you hold SOC 2 Type II?
GAP       Not established. Needed: whether a Type II audit has completed,
          the report date, and the auditing firm.

Q5. Do you offer a 99.99% uptime SLA?
CONFLICT  corpus/contracts.md:1-3 says 99.9% for the standard plan.
```

A `GAP` is never quietly upgraded into "we generally follow industry best
practice". That sentence is an invented answer, and inventing one is the
failure this template exists to prevent.

**Then it closes the gaps.** Straight after handing the set over, it asks you
each missing fact in turn, one question per message, writes your answer into
the corpus in your own words with the date and who said it, and re-answers
the original question with a citation to the line that did not exist a minute
ago. Answers you do not own get recorded with the owner's name against them,
which turns "we don't know" into "Priya knows".

**And once a week** it reports which questions keep coming in that the corpus
still cannot answer, ranked by how often they were asked. That is a writing
list, not a compliance opinion.

## The corpus

`additional_context/corpus/` in the agent's workspace. Markdown, one file per
subject, one `##` heading per established question, a provenance line under
each. It ships empty apart from a README explaining the format, because
nothing in it is true about your company until you say it is.

The desk appends and never deletes. When a new answer contradicts an old one
it keeps both and marks the old one superseded with the date, so a stale
answer is visibly stale rather than silently gone. Pruning is yours.

## Services and credentials

**None.** No `mcp.json`, no API keys, no external accounts, no paid tier.

The template is instructions, five skill plays and one recurring task. It
reads and writes markdown files in its own workspace and talks to you in
whichever channel you have wired up. It never contacts the person who sent
the questions; you send the finished set yourself.

## What ships

| Path | What it is |
|---|---|
| `ai.nanoco.nanoclaw/context/instructions.md` | The persona and the one rule: no answer without a citation |
| `ai.nanoco.nanoclaw/context/additional_context/corpus/README.md` | The corpus format. Documentation, never cited as evidence |
| `ai.nanoco.nanoclaw/context/additional_context/operator.md` | Who the provenance lines name. Set during onboarding |
| `ai.nanoco.nanoclaw/tasks/weekly-gap-report.md` | Monday 09:00 gap report. **Ships paused**, resume with `ncl tasks resume` |
| `skills/answer-desk/` | Five plays: onboard, answer a set, close the gaps, use the corpus, weekly report |
| `skills/welcome/` | First contact, hands straight to onboarding |

## Notes on where it sits

`media/journalist` is the other side of this desk. That template helps a
reporter ask; this one helps a source answer, from a file they can be held
to. They do not overlap: one keeps a beat profile and a source book, this one
keeps a corpus of things the company will stand behind.

## Limits worth knowing before you install it

- **It is only as good as the corpus, by design.** On an empty corpus the
  first questionnaire is a page of gaps. That is the intended first run, and
  the gap-closing interview is how you get from there to useful. Budget
  twenty minutes for the first one.
- **It does not read your policy PDFs.** Onboarding is a conversation, not an
  import. If you already have written policies, paste the parts that answer
  questions; the desk will record them with you as the source.
- **It will not tell you whether your answers are good.** It reports what
  people asked and what you have not written down. Whether "no SOC 2" costs
  you the deal is not its call.
