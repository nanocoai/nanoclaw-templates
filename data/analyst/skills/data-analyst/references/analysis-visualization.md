# Analysis, Comparison & Visualization

Compute the metric, compare it against a baseline, and render the chart that
makes the answer obvious.

## Analyze

1. **Compute the metric** on the tidy table from the transform step.
2. **Always compare** — pick the comparison that answers the question:
   - **Period-over-period** — this window vs. prior equal window (WoW/MoM/QoQ/YoY).
   - **Segment** — by plan, geo, channel, cohort, platform.
   - **Cohort** — retention/behavior of groups by signup date.
   - **Target** — actual vs. goal/forecast.
3. **Quantify the change** — report base, comparison, absolute delta, and %
   change together. Note whether the difference is meaningful vs. noise (small
   base, high variance, partial period).
4. **Investigate drivers** — when a metric moves, break it down to find which
   segment drove it. Distinguish mix shift from real change.

## Choose the chart (fit form to question)
| Question | Chart |
|----------|-------|
| Trend over time | Line |
| Composition / share over time | Stacked bar or area |
| Compare categories | Bar (sorted) |
| Distribution of a value | Histogram / box |
| Relationship between two vars | Scatter |
| Step-by-step drop-off | Funnel (or horizontal bar) |
| Part-to-whole, one period | Bar (prefer over pie; pie only ≤4 slices) |

## Build & save
- Render with matplotlib/plotly (or the workspace's charting stack). Label axes,
  units, legend, and the time window; add the source in a caption.
- No dual-axis unless the user asks; don't truncate the y-axis to exaggerate.
- Save each chart as a PNG and/or standalone HTML to
  `/workspace/agent/outputs/` with a descriptive filename.

## Rules
- One clear message per chart; if it needs two, make two charts.
- Sort bars by value, not alphabetically, unless order is meaningful.
- Colorblind-safe palette; don't rely on red/green alone.

## Hard stops
- Sample too small / period incomplete → chart it but flag low confidence.
- % change on a tiny base → show absolute numbers too; don't headline the %.

Next → `references/reporting.md`
