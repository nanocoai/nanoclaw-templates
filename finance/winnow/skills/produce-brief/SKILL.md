---
name: produce-brief
description: Produce the ranked table, per-target briefs, and CSV/JSON export from a completed screen. Use when the user asks for screen results, a shortlist, a ranked table, target briefs, a summary of findings, or an export.
---

# Produce the brief

The deliverable. Someone must be able to read it and see why every company
landed where it did.

**The brief is generated, not written.** `winnow.mjs screen --out <dir>`
produces `brief.md`, `screen.csv` and `screen.json` from the judgments file.
Your job is to present `brief.md` faithfully and add the one-paragraph
reading of it — what the counts, the coverage flags and the near-miss band
mean for the user's decision. Never retype a number; quote the file. If a
number looks wrong, the fix is in `judgments.json`, re-run the script.

The sections below describe what the generated brief contains and why, so
you can explain it. The thesis's `output` block controls which sections
appear.

## Counts first

Open with one line, before anything else:

```
14 pass · 6 near miss · 20 fail    —  <thesis name>
```

## Coverage, before the results

When `output.show_coverage_report` is true, the coverage table comes second,
immediately after the counts and before the ranked table. It qualifies
everything below it, so it cannot be an appendix.

```
Coverage · 9 declared segments
  Segment A   26 candidates · association member roster (25)   ⚠ single source 96%
  Segment C    0 candidates · no source answered               ⚠ no coverage
```

Where a flag is raised, say in one line what it means for the result — for
example that the geographic spread is unproven and largely reflects which
bodies publish member rosters. A reader who takes a concentrated funnel for a
market map will draw the wrong conclusion, and the table alone will not stop
them.

## Ranked table (PASS)

| # | Company | Score | Confidence | Location | Scale | Why |
|---|---|---|---|---|---|---|

`Why` is one clause naming the strongest evidence — not a restatement of the
score. Mark priority entries.

## Near miss band

Separate, below PASS, never merged into it. Each row names the filter it
failed or could not resolve, and what would settle it:

| Company | Score | Filter | Status | What would settle it |
|---|---|---|---|---|

This band is the point of the format. It is where a firm-but-negotiable
criterion shows the user what it costs — three companies that failed only on
a rule the user said they would revisit is a decision they now get to make
with the evidence in front of them, rather than one made silently by a
filter.

## Fail list

Compact — company, the filter it failed, one line of evidence. It exists so
the user can audit the filter, so a wrongly-excluded company is visible.

## Per-target briefs

For each PASS and NEAR MISS:

```
## <Company>  ·  <score>/100  ·  <band>
<url> · <location>

Score breakdown
  <criterion>  <score>  (weight <n>)  <one line of reasoning>  [confidence]

Findings
  <question>: <answer>  [confidence]
    fact: <claim> — <url>
    inference: <claim> — from <basis>

Open questions
  <question> — <what would settle it>
```

Never merge fact and inference. Never drop the open questions section — an
empty one says the screen was thorough; a missing one says nothing.

## Export

`--out` writes `screen.csv` (one row per company: rank, band, priority,
score, confidence, every criterion score, band reasons) and `screen.json`
(the full evidence tree with citations) alongside `brief.md`. Both carry the
thesis name and run timestamp — a shortlist without the thesis that produced
it cannot be interpreted six weeks later. Tell the user where they are.

## Tone

Report, do not sell. The user is deciding where to spend real time and
money; overstated confidence costs them more than a hedge does. Where the
evidence is thin, say so in the brief rather than in a footnote.
