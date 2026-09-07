# Output contract

Store each case under `cases/<case-slug>/`:

```text
case.json
source/E-###__original-name.ext
manifest.json
facts.jsonl
timeline.json
conflicts.json
missing.json
draft.json
CASE.md
TIMELINE.md
EXHIBITS.csv
CONFLICTS.md
MISSING.md
DRAFT-LETTER.md
PACK.html
```

The JSON and JSONL files are the structured source of truth. The Markdown, CSV,
and HTML files are deterministic rendered views. Regenerate them after changing
structured data.

## `case.json`

Required fields:

```json
{
  "schemaVersion": 1,
  "caseId": "denied-laptop-refund",
  "title": "Denied laptop refund",
  "requestedOutcome": "Refund the amount the merchant promised",
  "state": "OPEN",
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp"
}
```

Valid states: `NEW`, `OPEN`, `INGESTED`, `REVIEW_NEEDED`, `PACK_READY`,
`DRAFT_READY`, `CLOSED`.

## `facts.jsonl`

One JSON object per line. Each object has `factId`, `field`, `value`, `state`,
`citations`, and `confidence`. Supported facts require citations.

## `timeline.json`

A JSON array. Each event has `eventId`, `date`, `description`, `actor`, `state`,
`citations`, and optional `uncertainty`. Use an empty date for undated events.

## `conflicts.json`

A JSON array. Each conflict has `conflictId`, `field`, `whyItMatters`,
`resolutionNeeded`, and at least two `alternatives`. Every alternative has a
`value` and one or more citations.

## `missing.json`

A JSON array. Each item has `missingId`, `priority`, `item`, `whyItMatters`,
`whereToFind`, and `canProceed`.

## `draft.json`

An object with `subject`, `body`, and `factIds`. Material facts in the body must
resolve to supported fact IDs. The requested resolution may come from the
user-stated outcome in `case.json`.

