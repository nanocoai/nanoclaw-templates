---
name: forecast-watch
description: Projects month-end AWS spend with a confidence interval and flags budget risk against a configured monthly budget.
---

# Forecast Watch

## Purpose

Answer "where is this month heading" before the bill arrives.

## Procedure

1. Call `get_cost_forecast` for the remainder of the current calendar
   month.
2. Compare the forecast's point estimate and its upper confidence bound
   against the configured monthly budget in
   `additional_context/thresholds.md`.
3. Flag budget risk only when the forecast's point estimate (not just the
   upper bound) exceeds the budget - the upper bound alone is expected to
   vary and should be reported as context, not treated as the trigger.

## Output

Forecast point estimate, confidence interval, configured budget, and a
plain-English risk statement (on track / at risk / over).
