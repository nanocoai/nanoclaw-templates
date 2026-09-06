---
name: tag-hygiene
description: Surfaces AWS spend that is missing cost allocation tags (Team, Environment, Project) so it can be attributed to an owner.
---

# Tag Hygiene

## Purpose

Cost that can't be attributed to a team or project is cost nobody is
accountable for. This skill finds it.

## Procedure

1. Call `get_cost_by_tag` for the trailing 30 days, once per configured
   tag key (default: `Team`, `Environment`, `Project` - see
   `additional_context/thresholds.md` to change these).
2. For each tag key, identify the "no tag value" / untagged bucket and its
   $ amount.
3. If a tag key returns no data at all, report that plainly as "not yet
   activated as a cost allocation tag in Billing" rather than treating it
   as zero untagged spend - these are different situations and should not
   be conflated.
4. Rank untagged $ amounts across the configured tag keys, largest first.

## Output

Per tag key: $ untagged, % of total spend untagged, or an explicit
"not activated" status. Never silently omit a tag key that returned no
data.
