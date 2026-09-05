---
schedule: "0 3 * * *"
---

Read retention_days from plugin-data/rese/company.md. Delete every candidate folder under plugin-data/rese/checks/ whose newest file is older than that many days, and remove the matching lines from plugin-data/rese/log.md. Report in one line how many checks were deleted, or that nothing was due.
