---
name: research-target
description: Gather cited evidence about one company against a thesis's research questions. Use when researching, investigating, enriching, or gathering evidence on a specific company or target, or when a screen needs facts before it can score.
---

# Research a target

Answer the thesis's research questions for one company, with a citation for
every claim. Read `../screen-target/references/evidence-policy.md` first —
it governs everything here.

## Fast mode — one subagent per candidate

When `research_settings.execution.mode` is `fast`, you do not research
candidates yourself. For each carried-forward candidate that has not firmly
failed, launch one subagent (the `Agent` tool, general-purpose), **at most
four in flight at once**: four in one message, wait for all four, then the
next four. More than four has not been measured against the keyless Tavily
rate cap; if any subagent reports a rate-limit error, drop to two.

Each subagent's brief carries everything it needs, so it reads nothing you
did not name:

- the candidate's row exactly as `set-universe --from` printed it — name,
  url, location, segment, source label, note — and the file path it printed
- the thesis path, and the paths of this skill,
  `../screen-target/references/evidence-policy.md` and
  `../screen-target/references/judgments-format.md`; it reads and follows
  them, including the depth profile and the length caps
- the exact file to write: `<candidates dir>/<slug>.json`, one candidate
  entry in the judgments shape, filters and scores included, written before
  it returns
- what to return to you, at most ten lines: each filter's outcome, each
  criterion's score with its confidence and `why`, and any open question.
  **Not the evidence.** The file holds the evidence; your context does not
  need it.

Delegation puts one thing at risk: `screen-target` says to score one
criterion across all companies, and a subagent sees one company. So every
subagent scores from the same anchors, and when all digests are in you do
the cross-company pass yourself before running the script — for each
criterion, read the scores down the column, and where two companies with
comparable evidence sit far apart, `Edit` the score in the file it belongs
to and say so in the brief. Ten lines per company; it is cheap, and it is
what keeps a fast run's ranking as trustworthy as a standard run's.

A subagent that returns without writing its file, or whose file the script
rejects, is re-run with the script's message. Never write the file for it
from the digest — the digest has no evidence in it.

In standard mode, everything below is yours to do directly.

## Fire the whole company's lookups in one go

**Issue every call for a company in a single batch, not one after another.**
You already know what you need before you start: the company's own site, the
registries the thesis names, procurement records, press. Nothing about the
second lookup depends on the first, so waiting for each in turn adds a full
round trip per source and is the single largest cost in a run.

One batch per company, then read the results together, then write the file.
A second batch only when the first genuinely left a question open — not as a
matter of routine.

## What to ask for

Cheapest and most authoritative first:

1. The company's own site — services, projects, about, careers, leadership.
2. Licensing and professional registries, corporate filings.
3. Public procurement, bid tabulations, contract awards.
4. Trade and local press.
5. Sector-specific sources named in `source_preferences.preferred`.

Use `tavily_search` to locate and `tavily_extract` to read — and note that
`tavily_extract` accepts **several URLs in one call**, so extract the whole
candidate set of pages together rather than one at a time. A search snippet
is a pointer, not a source: extract before concluding. Stop when the questions
are answered to `research_settings.evidence.minimum_confidence`, not when
sources are exhausted.

**Always pass `query` to `tavily_extract`** — the research questions you are
answering, in a sentence. With a query the extract returns the relevant
passages (about 5KB); without one it returns the whole page (20–35KB), and a
batch of those forces a context compaction that costs more time than the
research did. For the same reason, locating searches use `max_results: 5`
and never `include_raw_content` — the extract is where you read.

Two parameters do real work here:

- **`include_domains`** — when you are checking one specific claim against
  one known source ("is this company on that registry?"), scope the search to
  that domain. It turns a hopeful query into a direct lookup.
- **`exclude_domains`** — apply `source_preferences.domains.exclude` on every
  search, so excluded aggregators never become the evidence for a claim.

On the keyed tier, `tavily_crawl` over a single company's own site with
`instructions` naming what you need (project portfolio, certifications,
leadership) reads the whole site in one call instead of guessing URLs.

## Answer every question

Work through `research_questions.standard` and `.custom`. For each: the
answer, the evidence, the source URL, and a confidence. An unanswered
question is reported as unanswered — never skipped and never quietly
softened into a guess.

Honour each question's `evidence_guidance`. When it says not to infer from
absence, that instruction outranks your urge to give a clean answer.

## Resolve outstanding filters

Settle any hard filter the universe pass could not answer. Say plainly which
way it resolved, or that it could not be resolved and what would settle it.

## Depth

- `fast` — the company's own site plus one corroborating source.
- `standard` — the site, one registry or public record, and press.
- `deep` — all of the above, plus procurement history, hiring signals, and
  corroboration of every high-importance question from a second source.

## Write each candidate to disk before starting the next

**Finish a company, write its file, move on.** One JSON file per candidate,
into the `candidates/` directory that `winnow.mjs init-run` printed — never a
path you chose yourself:

```
${PLUGIN_DATA}/runs/<timestamp>/candidates/
  _run.json              # optional: run_at, universe { found, carried_forward, cap }
  acme-industrial.json   # one candidate, the shape below
  northgate-holdings.json
```

This is not tidiness. Evidence held in your context is lost when the context
compacts, and a long run compacts several times — carrying twenty companies'
research in your head is how a run silently forgets its own citations. Writing
as you go also means a run that dies halfway resumes from what is on disk
instead of starting over.

`screen-target` points the script at the directory; it merges the files.

## Output

Each file is one candidate entry — the format is
`../screen-target/references/judgments-format.md`. Keep this shape while you
work so nothing is lost in translation:

```
Company · URL
Filters resolved: <filter> → pass | fail | unresolved (why)
Findings:
  <question>: <answer>  [confidence: high|medium|low]
    fact: <what a source states>  — <url>
    inference: <what you concluded>  — from <what>
Unanswered: <question> — <what would settle it>
```

Never merge fact and inference into one line.
