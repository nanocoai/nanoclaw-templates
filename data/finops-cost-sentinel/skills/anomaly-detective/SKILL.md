---
name: anomaly-detective
description: Detects unexpected AWS spend spikes by comparing recent daily cost against a rolling baseline, and classifies each finding as notable or critical.
---

# Anomaly Detective

## Purpose

Find spend that doesn't match the recent pattern, using raw cost data that
works on any AWS account with billing history - no opt-in or enablement
required. This is the primary detection path; AWS's own anomaly detection
is used only as optional corroboration.

## Procedure

1. Call `get_aws_cost_and_usage` for the last 30 days, daily granularity.
2. Call `get_cost_by_service` for the same window to see which services
   moved.
3. Compute a 7-day trailing baseline per service. Compare each of the last
   3 days against it.
4. Classify:
   - **Notable**: day-over-baseline deviation >= 20%.
   - **Critical**: deviation >= 75% AND absolute delta >= $50/day (tune
     both numbers in `additional_context/thresholds.md` for the account
     being watched).
5. If AWS Cost Anomaly Detection is enabled on the account, also call
   `get_cost_anomalies` and cross-reference. Treat this as corroboration
   only - never fail or block a finding if this call errors or returns
   empty (it requires monitors to be configured first).
6. For any service name you don't recognize, hand off to the
   `unknown-service-lookup` skill before reporting the finding - never
   guess what a line item is.
7. For any finding classified **critical**, hand off to the
   `critical-spike-alert` skill. Do this only for critical findings -
   never for notable ones.

## Output

One finding per anomaly: service name, $ delta, % deviation, notable/
critical classification, and (if available) AWS's own anomaly root-cause
text.
