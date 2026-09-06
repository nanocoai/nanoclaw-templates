# Judgments format

The boundary between judgment and arithmetic. The model writes **one JSON
document** of judgments; `${PLUGIN_ROOT}/scripts/winnow.mjs screen` does
everything after — bands, weighted scores, ranking, coverage, priority flags,
tables and exports. The model never computes a total, assigns a band, or
tallies coverage itself.

**Write one file per candidate as research completes**, into
`${PLUGIN_DATA}/runs/<timestamp>/candidates/`, with an optional `_run.json`
carrying the top-level fields. The script merges the directory. Evidence held
in context is lost to compaction on any run of real size; evidence on disk is
not.

Then run:

```bash
node ${PLUGIN_ROOT}/scripts/winnow.mjs screen \
  ${PLUGIN_DATA}/theses/<thesis>.yaml \
  ${PLUGIN_DATA}/runs/<timestamp>/candidates/ \
  --out ${PLUGIN_DATA}/runs/<timestamp>
```

The shape below is the whole document. A per-candidate file is just one entry
from `candidates[]`, written on its own; `_run.json` holds `run_at` and
`universe`.

It writes `brief.md`, `screen.csv`, `screen.json` and prints the counts line.
A non-zero exit means the judgments are malformed — the message names the
company and field. Fix the judgment; never hand-compute around the script.

## Shape

```json
{
  "run_at": "2026-01-01T12:00:00Z",

  "universe": {
    "found": 30,             // how many candidates universe-building surfaced
    "carried_forward": 12,   // how many are in this file
    "cap": 12,               // the initial_universe limit that bit, if any
    "note": ""               // optional, e.g. which sweep was cut short
  },

  "candidates": [
    {
      "name": "Example Co",
      "url": "https://example.com",
      "location": "City, ST",
      "segments": { "geography": "<one of hard_filters.geography.include>" },
      "sources": ["<where this candidate was found>", "..."],

      "filters": {
        "<filter name>": {
          "outcome": "pass | fail | unresolved",
          "evidence": "one line of what the source states",
          "url": "https://...",
          "what_would_settle_it": "required when fail or unresolved"
        }
      },

      "scores": {
        "<criterion name>": {
          "score": 0-100 or null,
          "confidence": "high | medium | low",
          "why": "one clause naming the evidence",
          "url": "https://..."
        }
      },

      "findings": [
        {
          "question": "<a research question>",
          "answer": "the answer, or null if unanswered",
          "confidence": "high | medium | low",
          "facts":      [{ "claim": "what a source states", "url": "https://..." }],
          "inferences": [{ "claim": "what you concluded", "basis": "what it rests on" }]
        }
      ],
      "open_questions": [
        { "question": "...", "what_would_settle_it": "..." }
      ]
    }
  ]
}
```

## Names must match the thesis exactly

- `filters` keys: `industry`, `geography`, `ownership`, `business_model`,
  `size.revenue` / `size.ebitda` / `size.employees` / `size.locations` (only
  those present in the thesis), and each `hard_filters.other[].name`
  verbatim. **Every filter needs an outcome** — a missing one is an error,
  not a pass.
- `scores` keys: each `scored_preferences.criteria[].name` verbatim. A
  criterion with no evidence is `"score": null` — the missing-data policy
  decides what that means. Never invent a number to fill the slot.
- `segments` keys: each dimension in `research_settings.coverage.report_by`;
  the value must be one of that filter's `include` entries, spelled the same.
- `sources`: at least one. Use a stable label for the same source across
  candidates ("state licensing registry", not a different phrasing each
  time) — the coverage tally groups on this string.

## The universe block

Optional, but include it whenever a cap bit. `found` minus `carried_forward`
is reported above the results as a coverage event, because a cap discards
whatever the search ordered last rather than a random sample. Omit the block
entirely when nothing was truncated.

## Profile: what `research_depth.mode` changes about the file

- **`fast`** — `findings` only for `research_questions.custom`. The standard
  questions are still researched (they are what the filter and score
  judgments rest on) but are not written up one by one: eight standard
  write-ups were ~60% of a candidate file's bytes, and every byte the model
  writes is time. `inferences` may be omitted when there are none.
- **`standard` / `deep`** — the full shape above, every question answered.

## Length caps

One clause is one clause. The script refuses a file whose prose fields run
past these, naming every field at once so one edit fixes the file. It never
trims — a fix is yours, so nothing is ever cut mid-sentence.

| Field | Cap (chars) |
|---|---|
| `scores.*.why` | 160 |
| `filters.*.evidence`, `filters.*.what_would_settle_it` | 240 |
| `findings[].facts[].claim`, `inferences[].claim`, `inferences[].basis` | 240 |
| `open_questions[].question`, `open_questions[].what_would_settle_it` | 240 |
| `findings[].answer` | 300 |

The commonest way to blow a cap is restating the same sentence in three
places — filter evidence, score `why`, and a finding. Say it once, in the
field that decides something, and let the others point at it.

## Rules the script enforces

- outcome ∈ {pass, fail, unresolved}; score ∈ [0, 100] or null;
  confidence ∈ {high, medium, low}
- every filter has an outcome; no duplicate candidate names
- FAIL candidates need no `scores` (they are never scored), but they still
  need `segments` and `sources` — they count toward coverage
- the length caps and the depth profile above

## Rules the script cannot enforce — yours

- **Never infer from absence.** No evidence → `unresolved` for a filter,
  `null` for a score, `null` answer for a finding. Not `fail`, not `0`, not
  a guess.
- `what_would_settle_it` is a concrete fact to verify or a judgement the user
  must make — not "more research".
- `why` names evidence, not the score: "four offices and a 40-truck fleet",
  not "strong scale".
- Facts and inferences never share a line.
