---
schedule: "0 3 * * *"
---

Read retention_days from plugin-data/reference-check/company.md. Delete every candidate folder under plugin-data/reference-check/checks/ whose newest file is older than that many days, and remove the matching lines from plugin-data/reference-check/log.md. Report in one line how many checks were deleted, or that nothing was due.
