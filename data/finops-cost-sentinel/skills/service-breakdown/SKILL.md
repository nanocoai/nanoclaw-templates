---
name: service-breakdown
description: Ranks AWS spend by service over a trailing window and narrates the biggest drivers of change in plain English.
---

# Service Breakdown

## Purpose

Answer "what is actually costing money, and what changed" - the
foundational view the other skills build on.

## Procedure

1. Call `get_cost_by_service` for the trailing 30 days.
2. Call `get_cost_comparison` for this period vs. the prior period of equal
   length.
3. Rank services by absolute $ and separately by % change.
4. Narrate the top 5 by absolute spend and the top 3 movers by % change,
   in plain English (no jargon, always include a $ amount).
5. For any service name you don't recognize, hand off to the
   `unknown-service-lookup` skill before including it in the narrative.

## Output

A short ranked list: service, $ this period, $ last period, % change,
one-line plain-English explanation of what the service is if it was
looked up.
