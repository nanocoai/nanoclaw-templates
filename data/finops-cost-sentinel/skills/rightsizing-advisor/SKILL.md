---
name: rightsizing-advisor
description: Lists EC2 rightsizing opportunities and estimated savings from AWS Cost Explorer's recommendations, when available.
---

# Rightsizing Advisor

## Purpose

Surface over-provisioned EC2 instances with estimated savings. This is an
enrichment skill, not a primary one - it depends on AWS features that
require account-level opt-in.

## Procedure

1. Call `get_rightsizing_recommendations`.
2. If the call errors or returns empty, report plainly: "Rightsizing
   recommendations require Cost Explorer opt-in and ~14 days of instance
   metrics - not yet available on this account." Do not treat this as a
   failure and do not block the rest of the digest on it.
3. If recommendations are present, rank by estimated monthly savings,
   largest first, and include the current vs. recommended instance type
   for each.

## Output

A ranked list of instance / estimated monthly savings / recommended
change, or the explicit "not available" status above.
