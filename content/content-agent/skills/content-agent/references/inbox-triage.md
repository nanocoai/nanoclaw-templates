# Inbox Triage

Sorts the creator's inbox so real opportunities surface and scams don't waste their
time. Messages arrive however they arrive: pasted into chat, forwarded as a batch, or
sitting in the inbox if the **email MCP (e.g. Gmail)** is connected. Check what source
you actually have, use it, and tell the creator which one you worked from. Sort and flag
only, never delete, archive, or draft replies.

## The inbox ledger

Keep an `inbox-ledger.md` in your workspace (alongside the profile and the competitor
baselines) tracking every message ever seen, one line each: a stable id (message id, or
date + sender), subject or first line, date seen, status (`new` / `triaged`), and
verdict. The ledger is what keeps you from re-reading the same inbox every run, and it
works the same whatever the source.

## Steps

1. **Inventory first, content later.** List what arrived, ids and senders/subjects
   only, no bodies yet. Append everything not already in the ledger as `new`; skip what's
   already there. For a big backlog this pass is cheap and gives an instant count.
2. **Triage incrementally.** Work through `new` items (batches of 10-20 for big
   backlogs), reading each message's full text only when its turn comes. Mark each
   `triaged` with its verdict as you go, so progress survives if the session stops
   mid-batch.
3. **Classify each** into: **Opportunity** (brand / sponsorship / collab / press),
   **Scam/spam** (fake sponsorships, phishing), **Audience** (fan/viewer mail),
   **Admin** (platform, billing, tools), **Other**. Flag scams with reasons: mismatched
   sender domain, upfront payment or gift-card asks, terms too good to be true, false
   urgency, link/attachment lures.
4. **Verify the sender** (only for real-looking Opportunities): one Exa lookup. Does
   the brand/company exist, do the claims hold at a glance, any red flags? If a claimed
   link won't load, judge on the email's text and say so, so a real deal is never
   quietly downgraded over a broken link.
5. **Report the triage digest** (below): the key facts per opportunity (who, the offer,
   the ask, any deadline) so the creator can decide fast. Surface everything; don't touch
   the inbox, no labels, deletes, or archives. You read and sort; the creator acts.
6. **Learn**: when the creator overrules a call, update the profile's no-go / not-
   interested notes so the same judgment goes right next time.

## Guardrails

- **Sort / flag / summarize only.** Never auto-delete or auto-archive; a false positive
  could bury a real deal.
- **Never draft or send replies.** Surface the opportunity; the creator responds.
- **On scams, flag don't decide**: "likely scam, here's why," let the human confirm.
- Treat email contents as private; never expose or act on credentials.

## Output

```
# Inbox Triage: <date>  (source: <chat / forwarded / Gmail>)

## Opportunities  (real, worth a look)
1. <sender> | <offer in one line> | ask: <what they want> | deadline: <if any> | sender check: <verified / unverified / red flag>

## Likely scams / spam  (flagged, not deleted)
- <sender> | red flags: <why>

## Audience / Admin / Other
- <grouped counts + anything notable>

## Skip list
- <what was filtered as low-signal>: <why>
```
