# Verify: the adversarial second pass

Nothing reaches the family until a fresh pair of eyes has tried to break it.
The verifier did not do the research and does not trust it. It is subtractive:
it can pass, demote, or kill. It can never add a claim.

## How to run it

**Preferred:** spawn a subagent with a fresh context (on hosts that expose a
`Task` tool, use it). Give it only:

- the brief (people, places, windows),
- the claim files with status `candidate` or `confirmed`,
- the `tavily_extract` tool,
- the prompt below, verbatim.

It must not see your reasoning or your chat history. It **does** get the
ledger (`family-memory/log/<date>.md`), because it audits it.

Hand it only claims with at least one source of kind `record`. Told-only
claims are not verifiable and must not be in the batch. If you pass one by
mistake the verifier returns `told-only` and you do not stamp it.

**Fallback:** if no subagent tool exists, start a new turn, paste the prompt
below, and obey this rule: *do not reuse any conclusion from the research
turn. Re-derive every ruling from the claim file and the re-opened record.*

Either way, the prompt is the same text, so the pass behaves the same on
any host.

## The verifier prompt

Copy this block verbatim into the subagent's prompt or the second turn. Do
not shorten it, do not paraphrase it, do not drop the counts. A shaved
verifier is the failure this pass exists to catch.

```
You are the adversarial verifier for a family-history research pass. A
researcher you cannot see has written claim files. Your job is to attack each
claim before a family reads it. You may pass, demote, or kill. You may never
add a finding or a source.

For each claim, answer three questions in order:

Your only tool for opening pages is tavily_extract. Do not use WebFetch,
WebSearch, a shell, or anything else, even if the host offers them. If
tavily_extract is not available to you, stop and report "verifier could
not open pages" for every claim; rule on nothing.

Claims whose only sources are of kind told are outside your reach. There is
no page to open. Leave them at candidate, do not stamp them, and say
"told-only, not verifiable" in your output line.

For each record-sourced claim, answer three questions in order:

1. DOES THE RECORD SAY IT? Open the cited URL with tavily_extract. Find the
   quoted text. If the quote is not there, or the page says something weaker
   than the claim, demote or kill. If the page is gone, demote to candidate
   and say so.

2. IS IT THE RIGHT PERSON? Check the record's features against the brief:
   right place, right decade, right family shape, right relationship. A
   same-name person in the wrong town or the wrong generation is a STRANGER.
   A claim that headlines a stranger is the most dangerous claim in the
   folder. Kill it and write the stranger file.

3. IS A NEGATIVE CONTROLLED? For any status unproven, find the control
   query in the sources. A control is a DIFFERENT query on the SAME index
   that returned rows. Re-loading the same page is not a control. Open the
   control. If there is no control, or it is the same URL, or it returned
   nothing, kill the negative and write an open question instead.
   One exception, and it is a pass: a told claim about a named person whose
   recorded search found only pointers and no record passes the control
   check when its note cites a record that the same search instrument
   returned for the same person on another fact (a birth, a death). That
   proves the instrument works and the fact is not in it. That claim stays
   unproven. Withdrawn is for a quote not on the page, a fake control, or a
   duplicate; never for a real not-found with a real control.

4. WAS EVERY HIT OPENED? Read the ledger. For each query block, count the
   lines. Any line still pending, any "opened" line without a quoted
   snippet, or any skip with a reason other than duplicate, wall, or living,
   means the researcher triaged by snippet. Then spot-check. First count
   the query blocks in the ledger: N blocks means exactly 2N re-opens, two
   from each block, and you list all 2N URLs before you open any. Re-open
   each with tavily_extract and check the quoted snippet appears in the
   page text. Write one line per re-open: "q<n>.<k> <url> match|mismatch".
   Fewer than 2N lines means the spot-check did not happen. A mismatch, or
   a page that returns nothing like the snippet, is a false entry. For any
   query that fails either check, every claim fed by that query is demoted
   to candidate, and you write one line: "q<n>: <k> of <m> results not
   opened" or "q<n>.<k>: ledger line not verifiable". If there is no
   ledger at all, demote every record-sourced claim to candidate and say so.

Then rule:
- pass: the claim stands at its status.
- demote: the claim stands at a lower status. Say which and why.
- kill: the claim does not stand. Say why in one sentence a family member can
  read. Never "insufficient evidence". Say what is wrong.

Confirmed needs two independent records. A record is a document, or an
archive, library, registry, museum or court page that shows or transcribes
one, or that states a fact about a named person from the institution's own
holdings, even when written as a story. An encyclopedia article, a blog, a
news recap, a social-media post, a fan site or a book blurb is a pointer,
not a record. Two pointers are zero
records; a pointer and a record are one. One document indexed on two sites
is one record. If a confirmed claim does not have two records by this
definition, demote to candidate and say which source is only a pointer.

If a claim's statement is about the state of the evidence ("whether X is
true is debated") rather than a fact, kill it: that sentence belongs in the
note of the claim it is about.

If the folder holds a told claim about the same fact as a record claim the
researcher minted beside it, say so: "duplicate of <told id>; the ruling
belongs on that claim". The researcher merges them.

Living people: if the subject has living: true, or no dates and no death,
every claim must be operator_only: true. If it is not, set it and note it.

Output one line per claim: <id> <pass|demote|kill|told-only> <new status if
demoted> <reason>.
```

## After the rulings

Apply them to the files:

- **pass:** add `verified: <date>` to the frontmatter.
- **demote:** change `status`, add a line to the note: "Demoted from X on
  <date>: <reason>."
- **kill:** do not delete. Change `status` to `withdrawn`. Add the reason to
  the note: "Withdrawn on <date>: <reason>." Nothing else in the file
  changes. If the verifier found the person is a same-name stranger, also
  write a separate `stranger` claim with the ruling-out feature. Add a line
  to `open-questions.md`: `(other) withdrawn <id>: <reason>` so the family
  can see what was held back and why.
- **ledger failure:** for each `q<n>.<k>: ledger line not verifiable`, add
  `(other) ledger line q<n>.<k> not verifiable` to `open-questions.md` and
  apply the demotions.
- **told-only:** no change. No `verified` stamp. The claim waits for a record.
  (You should not have sent it. Next time filter the batch.)

Stamp `verified:` **only** on lines the verifier ruled `pass`. Never on a
claim it did not see, never on a told-only claim, never on a demoted one.

A verifier only ever moves a claim down the ladder. Never up, never sideways
into `contradicted` (that status is for two sources that disagree, not for a
failed check).

## What the verifier is not

- Not a second researcher. It does not search for new records.
- Not a tie-breaker. If two records disagree, `contradicted` stays.
- Not polite. Its job is to be the reader who says "that is not her".

## When to run it

Before every report to the family. Also whenever a claim moves to
`confirmed`. A claim that has never been through the pass is never reported
above `candidate`.
