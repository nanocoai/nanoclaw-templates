---
schedule: "0 9 * * 1"
---

# Reference: Weekly Watchlist Recheck

Runs unattended, with no chat attached, so deliver the summary to the user's
channel — never take any action beyond research and reporting.

Read `/workspace/agent/watchlist.md`. If it doesn't exist or is empty, skip
silently (no message) — nothing to recheck.

For each saved item:

1. **Re-run the same category checklist** used at save time (listing,
   seller/business, rental, or job offer — recorded in the watchlist entry),
   focused on what could plausibly have changed: new scam reports, new
   reviews, a changed price, the listing/account disappearing entirely
   (itself sometimes a signal, sometimes just a sold item — say which if you
   can tell).
2. **Compare to the saved verdict.** Only report items whose verdict changed
   or where a new, concrete finding appeared. Skip silently past items with
   nothing new — don't repeat last week's findings.

## Report

One message: a line per item **with a change**, in `report-format.md` style
(new verdict, the new finding, its source). If nothing changed for anyone
this week, send nothing at all — a re-check with no news isn't worth a
message.

## Housekeeping

If a listing is confirmed gone (sold, delisted) with no new red flags, ask
in the same message whether to remove it from the watchlist; don't remove it
unilaterally.
