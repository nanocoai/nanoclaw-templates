---
schedule: "0 8 * * MON"
---

Run anomaly-detective, service-breakdown, tag-hygiene, rightsizing-advisor,
and forecast-watch in that order over the trailing 30 days. Produce one
digest: anomalies first, then the top tag-hygiene gaps, then the top
rightsizing opportunities by savings, then the month-end forecast with
variance vs. last month. Keep it under 300 words. Do not place any phone
calls from this task - critical findings are handled by the separate
critical-spike-check task.
