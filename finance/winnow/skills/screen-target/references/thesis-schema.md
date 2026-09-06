# Thesis schema

A *thesis* is the configuration surface of this template. It is a YAML file.
The plugin contains no industry knowledge; everything specific to a search
lives here.

Theses ship read-only under `${PLUGIN_ROOT}/theses/`. The live, editable copy
lives under `${PLUGIN_DATA}/theses/<name>.yaml` — `define-thesis` writes it,
and every other skill reads it from there.

## Validating a thesis

```bash
node ${PLUGIN_ROOT}/scripts/winnow.mjs validate <thesis.yaml>
```

The script parses a deliberate **YAML subset** — the agent container has no
YAML library, so the parser is ours and small. Supported: nested maps at
two-space indentation, `- item` lists (scalars or maps), `>` folded and `|`
literal blocks, `#` comments, quoted strings, numbers, booleans, `~`/empty
for null, inline `[a, b]` lists, and numeric keys such as the `100:` anchors.
Not supported: anchors and aliases, multi-line flow mappings, tags,
multi-document files. Anything outside the subset fails with a line number.

## Three kinds of criteria

Every criterion a user offers belongs in exactly one of three places. The
distinction is the whole design:

| Question | Goes in |
|---|---|
| Does failing this take the company out of the funnel? | `hard_filters` |
| Does this make one acceptable company better than another? | `scored_preferences` |
| Do I want this determined and reported either way? | `research_questions` |

Putting a preference in `hard_filters` silently discards good candidates.
Putting a genuine disqualifier in `scored_preferences` lets a high score
outvote it. `define-thesis` asks the disqualification question explicitly for
every criterion so the user does not have to know this distinction in advance.

## Hard filters, and `revisitable`

A hard filter normally drops a company *before* research is spent on it.

Real screens have filters that are firm but negotiable — the user means them,
but would want to see what they cost. Mark those `revisitable: true`. A
company that fails **only** revisitable filters is not dropped; it is
quarantined into the NEAR MISS band, researched, scored, and reported
separately with the filter it failed and what would have to be true to
reconsider it.

```yaml
hard_filters:
  geography:
    include: [Illinois, Wisconsin, Arizona]
  other:
    - name: Business-customer orientation
      condition: Company must derive meaningful revenue from business customers.
      rationale: Consumer-only operators are outside the thesis.
      revisitable: true
```

Three bands result, and every run reports all three:

- **PASS** — cleared every hard filter. Researched, scored, ranked, briefed.
- **NEAR MISS** — failed only revisitable filters. Researched and scored, but
  ranked in its own band, each with the failed filter named.
- **FAIL** — failed at least one firm filter. Dropped cheaply, listed with
  the reason, not researched.

A firm filter beats a revisitable one: fail both and the company is FAIL.

Do not also score what a revisitable filter already tests. The filter decides
the band; a scored preference on the same fact double-counts it. Score the
*degree* of an adjacent quality instead (a revisitable "must be commercial"
filter pairs with a scored "commercial orientation strength", which only
ranks companies that already cleared the filter).

## Top-level shape

```yaml
acquisition_thesis:
  name:
  description:
  hard_filters:
    industry:      { include: [], exclude: [] }
    geography:     { include: [], exclude: [] }
    ownership:     { include: [], exclude: [] }
    size:
      revenue:   { min:, max: }
      ebitda:    { min:, max: }
      employees: { min:, max: }
      locations: { min:, max: }
    business_model:
      required_characteristics: []
      excluded_characteristics: []
    other:
      - name:
        condition:
        rationale:
        revisitable: false     # default
  scored_preferences:
    criteria:
      - name:
        weight:                # integers; normalised to 100 at scoring time
        desired_condition:
        scoring_guidance:      # anchors: 100 / 50 / 0
        evidence_required:
  research_questions:
    standard: []               # named built-ins, see below
    custom:
      - question:
        importance:            # high | medium | low
        evidence_guidance:

research_settings:
  research_depth: { mode: fast | standard | deep }   # also sets the judgment profile, see judgments-format.md
  execution:      { mode: fast | standard }          # fast farms research out to subagents; see below
  target_limits:
    initial_universe:
    deep_research_limit:
  evidence:
    minimum_confidence:
    require_citations: true
    allow_inference: true
    distinguish_fact_from_inference: true
  coverage:
    report_by: [geography]        # hard-filter dimensions to report coverage across
    single_source_threshold: 0.5  # flag a segment where one source exceeds this share
    flag_empty_segments: true     # a declared segment returning nothing is a finding
  source_preferences:
    preferred: []                 # prose guidance: what to favour and read
    excluded: []                  # prose guidance: what not to trust
    domains:
      include: []                 # -> search include_domains (targeted passes only)
      exclude: []                 # -> search exclude_domains (applied always)
    registries:                   # enumerable sources; needs an API key
      - name:
        url:
        covers:                   # which segment(s) this registry enumerates
        instructions:             # natural-language: which pages matter

scoring_settings:
  scale: { min: 0, max: 100 }
  normalization: weighted
  missing_data_policy:
    mode: neutral | penalize | exclude
    notes:
  minimum_score_for_priority:

output:
  ranked_table: true
  target_briefs: true
  show_filter_failures: true
  show_near_miss_band: true
  show_coverage_report: true
  show_score_breakdown: true
  show_confidence: true
  show_citations: true
  export: { formats: [csv, json] }
```

## Source preferences

Four fields, two kinds. `preferred` and `excluded` are **prose** — they guide
how the agent frames queries and which results are worth reading. The rest are
**mechanical**, compiled onto the search API:

- **`domains.exclude`** is applied to every search. Use it to permanently
  silence aggregators that restate other sources without attribution.
- **`domains.include`** is a *hard restriction* and is applied only on
  targeted passes. A broad sweep with it set returns nothing but those
  domains and silently collapses recall.
- **`registries`** name sources that are **complete by construction** for
  some population — a licensing database, a membership roster, an award list.
  With an API key the agent enumerates them by crawling rather than sampling
  them by searching. This is the main lever on coverage: a declared registry
  that could not be enumerated is reported as a gap.

`covers` ties a registry to the segments it can complete, so an empty segment
in the coverage report can be traced to a registry that was missing, not
consulted, or unreachable.

## Target limits are a cost dial, not a screening criterion

`research_settings.target_limits` exists for one reason: **to bound runtime
and API spend.** It is a knob for how long a run takes, and nothing else.

- `initial_universe` — how many candidates universe-building carries forward.
- `deep_research_limit` — how many of those get deep research.

Neither expresses anything about the thesis. A company dropped by a cap was
not judged and did not fail; it was simply past the line when the budget ran
out. **The discarded remainder is not a random sample** — it is whatever the
search happened to order last, which correlates with web presence rather than
with fit.

So a cap that bites is a **coverage event**, and is reported as one. Record
what was found alongside what was carried, and the brief states the gap above
the results:

```json
"universe": { "found": 30, "carried_forward": 12, "cap": 12 }
```

Set the caps low for a fast trial run and raise them for a real screen. Never
reach for them to make a shortlist shorter — that is what `hard_filters` and
`minimum_score_for_priority` are for, and unlike a cap they leave a reason
behind.

## Execution mode

`research_settings.execution.mode` is about wall-clock, not evidence. It
does not change what is researched, how it is judged, or what the brief
contains — `research_depth` does that.

- **`standard`** (default) — one agent does the whole pipeline in sequence.
  Cheapest in tokens; a quickstart-sized run takes ten to fifteen minutes,
  most of it the agent's context filling with search results and being
  compacted.
- **`fast`** — the agent delegates the search sweep to one subagent and each
  candidate's research to its own subagent, a few at a time. Raw search
  results never enter the main agent's context, so it never compacts, and
  the candidates are researched concurrently. Several times faster; several
  times the token spend, because every subagent carries its own baseline.

Pick `fast` when you are waiting on the result and `standard` when the run
is unattended or the spend matters more than the clock.

## Coverage

`research_settings.coverage` makes the shape of the *search* reportable
alongside the shape of the *results*.

A screen's funnel reflects which sources are indexed and reachable. One
well-structured public roster can supply most of a segment, and the funnel
will look authoritative anyway because a lot of arithmetic sits on top of it.
Coverage reporting is what stops a search artifact being read as a market
finding — the universe-level counterpart to "never infer from absence".

- `report_by` — which hard-filter dimensions to segment by. Geography is the
  usual one; any enumerable dimension works.
- `single_source_threshold` — flag a segment where one source supplies more
  than this share of candidates.
- `flag_empty_segments` — a declared segment that returns nothing is
  reported as a gap, not omitted.

Keep a declared-but-empty segment in the thesis rather than deleting it.
Removing it converts a coverage gap into a silent absence.

## `research_questions.standard`

Named built-ins, answered for every researched company unless removed:
`company_overview`, `ownership`, `management`, `geography`,
`products_services`, `customer_markets`, `size_indicators`, `growth_signals`,
`acquisition_signals`.

## Weights

`weight` values are integers in any range; scoring normalises them to sum to
100. Writing weights that already sum to 100 makes the brief easier to read,
but nothing enforces it.

## Missing data

`missing_data_policy` governs a **scored criterion** with no evidence.

A **hard filter** with no evidence either way is different, and never
silently passes. It resolves to NEAR MISS, with the unresolved filter named
and the evidence that would settle it stated — the same band and the same
treatment as a revisitable failure, because the user's next action is
identical: decide one open question about an otherwise-viable company.
`missing_data_policy.mode: exclude` is the one override, sending unresolved
filters to FAIL instead.

This keeps the output at three bands. Absence of evidence is never
inference: a screen that cannot find evidence of a certification reports
"unresolved", not "uncertified".
