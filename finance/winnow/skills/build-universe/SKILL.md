---
name: build-universe
description: Build a candidate list from a screening thesis using web search. Use when the user asks to find or source targets, build a target universe, generate a candidate list, or start a screen from a thesis that has no candidates yet.
---

# Build the universe

Turn a thesis into a deduplicated list of candidate companies. Broad and
cheap — qualification happens later. Missing a real candidate here cannot be
recovered downstream, so favour recall over precision.

## Two capability tiers

The `tavily` MCP server works with or without an API key, and the difference
decides your strategy:

| Tier | Tools | What it can do |
|---|---|---|
| **Keyless** (no key configured) | `tavily_search`, `tavily_extract` | Search and read. Recall is whatever the index surfaces. |
| **Keyed** (key in the credentials proxy) | adds `tavily_map`, `tavily_crawl`, `tavily_research` | **Enumerate** a known source rather than searching it. |

Build the base universe with search so an unconfigured install still works.
Then, if `tavily_map` or `tavily_crawl` are available, enumerate the
registries the thesis names — that is how coverage gaps get closed, and it is
not something search can do.

Say which tier you ran in. A keyless run has systematically weaker recall,
and the coverage report should not imply otherwise.

## Search

**The plan is small and fixed: one query per declared segment, plus two
adjacency queries, and nothing else.** For each segment in
`hard_filters.geography.include`, one search of the form
`<first industry term> <segment>`. Then two adjacency queries across the
whole region using the trade's neighbouring names — the capability under
another name, as the thesis's industry terms suggest. A five-segment thesis
is seven searches. Do not add sub-region, directory, registry, procurement
or press passes; a run is minutes, not an afternoon, and the coverage report
will say what the seven did not reach.

Every search: `search_depth: "advanced"` (the default `basic` returns
glossary pages for generic terms), `max_results: 8`, no
`include_raw_content`, and the thesis's `source_preferences.domains.exclude`
as `exclude_domains`. `domains.include` is for a targeted pass at one known
source only — on a sweep it silently collapses recall.

### The sweep writes `universe.json`; the script does the rest

Whoever runs the sweep — you in standard mode, a subagent in fast mode —
writes its findings to **`<run dir>/universe.json`** and nothing else goes
in your context:

```json
{ "tier": "keyless", "queries": ["<every query actually run>"],
  "candidates": [
    { "name": "Acme Co", "url": "https://acme.example", "location": "City, ST",
      "segment": "<one of the declared segments, spelled exactly>",
      "source": "<stable source label>", "note": "<one line, ≤200 chars>",
      "fail": { "filter": "geography", "evidence": "HQ in Texas" } } ] }
```

`fail` is optional and only for a **firm** filter the search result already
settles — an out-of-region headquarters, an explicit "private-equity backed"
line. Never for a revisitable filter, never on a guess.

Then one command does everything that used to be judgment-adjacent
arithmetic — dedup on domain then name, segment validation, the firm-filter
drops, the `initial_universe` cap taken round-robin across declared segments
so every segment is represented, `deep_research_limit`, the stub files for
candidates that will not be researched, and the universe block:

```bash
node ${PLUGIN_ROOT}/scripts/winnow.mjs set-universe <candidates-dir> --from <run dir>/universe.json
```

It prints the rows to research and the exact file each one must be written
to. **Do not curate the table yourself, do not write stub files yourself,
and do not read earlier runs** — the caps are enforced by the script and
cannot be exceeded from your side.

### Fast mode — delegate the sweep

When `research_settings.execution.mode` is `fast`, do not run the searches
yourself. Open the run, plan the queries as above, then hand the sweep to
one subagent (the `Agent` tool, general-purpose) whose brief carries:

- the run directory and the `universe.json` shape above, verbatim
- the full query list, numbered, with `search_depth: "advanced"`,
  `max_results: 8`, and the thesis's `exclude_domains` spelled out — **one
  search per query, then stop**; it re-derives nothing and adds nothing
- the declared segments, spelled exactly, and the firm filter names
- what to return: the count of candidates written, and one line naming the
  Tavily tier — **keyless unless a `tavily_map` or `tavily_crawl` call
  actually succeeded**; those tools being listed proves nothing, the server
  gates them at call time. Nothing else — no table, no excerpts.

Then run `set-universe --from` as above and hand its rows to
`research-target`.

When the sweep is done, record what it found — this is what makes
completeness checkable later:

```bash
node ${PLUGIN_ROOT}/scripts/winnow.mjs set-universe <candidates-dir> \
  --found <total found> --carried <carried forward> [--cap <limit>]
```

`screen` refuses to run if fewer judgment files exist than `--carried`, so a
run cannot be silently screened half-finished.

## Track coverage as you go

Record, for every candidate, **which source produced it** and **which
declared segment it belongs to**. You cannot reconstruct this afterwards,
and the whole coverage report depends on it.

These land in `judgments.json` as each candidate's `sources` and `segments`
(see `../screen-target/references/judgments-format.md`). Use one stable
label per source across the whole run — "state licensing registry" every
time, not a fresh phrasing — because the tally groups on the string. The
script computes the coverage table; you do not tally it by hand.

## Record

For each candidate capture only: name, website, headquarters location, and
where you found it. Nothing else — deeper facts are `research-target`'s job
and cost real money here.

Deduplicate on domain, then on name. Keep DBAs and subsidiaries as separate
rows flagged as possible duplicates; let `screen-target` resolve them.

## Cheap filtering

Apply hard filters that the universe data already answers — geography and
obvious industry mismatches. Drop those to FAIL now, with the reason, before
research spends anything on them.

Do not guess at filters the universe data cannot answer. An unresolved
filter goes forward and is settled during research.

## Limits — a runtime dial, reported as a coverage event

`research_settings.target_limits.initial_universe` bounds runtime and API
spend. It says nothing about the thesis: a candidate dropped by the cap was
not judged and did not fail, it was merely past the line when the budget ran
out.

Stop at the cap, then **record both numbers** in the judgments file:

```json
"universe": { "found": 30, "carried_forward": 12, "cap": 12 }
```

The script states the gap above the results. Say the same in your report, and
ask whether to raise the cap.

Never silently truncate. The discarded remainder is not a random sample — it
is whatever the search ordered last, which tracks web presence rather than
fit, so a bitten cap distorts the funnel in exactly the direction the coverage
report exists to expose.

## Coverage — report it, always

**Not finding candidates in a segment is not evidence that the segment is
empty.** It is equally likely that nothing there is indexed the way you
searched. This is the universe-level form of the rule in
`evidence-policy.md`, and it is the easiest way for a screen to be
confidently wrong: one well-indexed source quietly redefines the market, and
the funnel looks authoritative because a lot of arithmetic sits on top of it.

The script renders this table at the top of the brief, from the `sources`
and `segments` you recorded:

```
Coverage · 9 declared segments
  segment     candidates   sources (top contributor)
  Segment A           26   association member roster (25)   ⚠ single source 96%
  Segment B            6   4 sources
  Segment C            0   no source answered               ⚠ no coverage
```

Raise two flags:

- **Single-source dominance** — one source supplies more than
  `coverage.single_source_threshold` of a segment. The segment maps that
  source's reach, not the market.
- **Empty segment** — a declared segment returned nothing, and
  `coverage.flag_empty_segments` is true. Say which sources were tried.

State plainly what a flag means for the result: *"the geographic spread of
this funnel is unproven; it largely reflects which bodies publish member
rosters."* Never present a concentrated funnel as a market finding.

## Report

State the count found, the count dropped by cheap filters, and the count
carried forward, then the coverage table. List the queries you ran so the
user can see what was and was not covered.
