---
name: unknown-service-lookup
description: Looks up an unfamiliar AWS service or SKU name using Tavily web search so cost findings never report a guess.
---

# Unknown Service Lookup

## Purpose

Other skills call this one when a line item's service or SKU name isn't
recognizable, so the digest never reports a guess about what something is.

## Procedure

1. Use the `tavily_search` tool with a query like `"<service/SKU name>"
   AWS pricing what is`.
2. Prefer official AWS documentation and pricing pages in the results.
3. Summarize in one or two sentences: what the service is, and typical
   pricing model (per-request, per-GB, per-hour, etc.) if stated in the
   results.
4. If Tavily returns nothing useful, report the line item with its raw
   name and $ amount, and say explicitly that it could not be identified
   - never fabricate a description.

## Output

One or two sentence plain-English description of the service, or an
explicit "could not be identified" note.
