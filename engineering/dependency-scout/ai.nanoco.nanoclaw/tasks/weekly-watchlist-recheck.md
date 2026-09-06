---
schedule: "0 9 * * 3"
---

# Reference: Weekly Watchlist Recheck

Runs unattended, with no chat attached, so deliver the summary to the user's
channel — never take any action beyond research and reporting.

Read `/workspace/agent/watchlist.md`. If it doesn't exist or is empty, skip
silently (no message) — nothing to recheck.

For each saved package:

1. **Re-query OSV.dev** (`references/security-advisories.md`) — this is the
   highest-value recheck, since a new advisory can appear at any time for a
   package whose maintenance status hasn't changed at all.
2. **Re-check registry latest version and GitHub `pushed_at`** — only worth
   a full re-report if something materially changed (a new release, a
   deprecation notice appearing, a repo going archived).

## Report

One message: a line per package **with a change** (new advisory, new
release, deprecation, archived status), in `report-format.md` style. If
nothing changed for anyone this week, send nothing at all.

## Housekeeping

Never remove anything from the watchlist unilaterally — if a package looks
safe to stop tracking, ask in the same message.
