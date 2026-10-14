---
schedule: "0 8 * * 1"
---

Weekly retry of open questions. Follow the historian skill.

1. Read `family-memory/open-questions.md`. Select only the unchecked lines
   whose blocker kind is `(not_indexed_yet)`. Touch no other line.
2. For each, re-run the original search and its control query. Open every
   hit with `tavily_extract` before it counts.
3. If the control now returns results and the search finds the record, write
   the claim with full provenance, run the verify pass on it, check the box on
   the open-questions line, and note the claim id next to it.
4. If the control still returns nothing, leave the line as it is. Do not
   report it.
5. If the search allowance cap is reached, add the cap line to
   `open-questions.md` and stop.

Report to the chat only if something changed: which lines closed and which
claim ids were written. If nothing changed, send nothing. Never include an
`operator_only` claim in the report.
