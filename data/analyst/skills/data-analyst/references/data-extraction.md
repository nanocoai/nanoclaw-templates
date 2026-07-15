# Scope & Data Extraction

Turn the question into a measurable one, then pull only the data you need from
the right source. The first play — everything downstream depends on it.

## Scope first (before any query)
Nail these down; ask the user if unclear:
- **Metric** — exact definition (e.g., "active user = did event X in the window").
- **Grain** — per user / per account / per day / per event.
- **Window** — start/end dates, and the comparison window.
- **Filters** — geo, plan, platform, exclude internal/bot traffic.
- **Segments** — the breakdowns that make the answer actionable.

## Pick the source (one authoritative per metric)
- **Mixpanel** → behavioral events, funnels, retention, cohorts, active users.
- **HubSpot** → contacts, companies, deals, pipeline stage, owner, campaign data.
- **BigQuery** → anything requiring joins across sources, modeled tables, large
  scans, or a reconciled "source of truth".

## Extract
1. **Mixpanel** — query events/funnels with an explicit date range and the
   event/property names from the metric definition. Note Mixpanel's project
   timezone.
2. **HubSpot** — pull the relevant objects with only the properties you need;
   respect pagination and rate limits; capture `lastmodifieddate` for freshness.
3. **BigQuery** — write explicit SQL. **Estimate bytes scanned / dry-run first**;
   `SELECT` only needed columns, filter on partition/date columns, avoid
   `SELECT *` on large tables. Large/expensive scans need user approval.

## Rules
- Pull the minimum needed — narrow columns, filtered rows, bounded dates.
- Save every query (Mixpanel spec, HubSpot params, SQL) to the workspace for
  reproducibility.
- Record row counts and the exact window pulled — you'll validate against these.

## Hard stops
- Query returns empty / source unavailable → report it, don't estimate.
- BigQuery scan looks large/costly → estimate and confirm before running.

Next → `references/transform-modeling.md`
