# Shared Scam-Signal Library

Cross-category red flags. Every checklist ends by running the relevant ones
here against what you found — don't skip this even if the category checklist
turned up nothing bad on its own.

## Universal signals (check on every category)

- **Price/offer too good.** Meaningfully below comparable listings/market
  rate with no explanation (distress sale, moving, etc. is a real reason;
  no reason given is not).
- **Urgency / pressure.** "Today only," "someone else is interested,"
  pushing to skip normal steps (viewing, interview, inspection).
- **Off-platform push.** Asked to move from the marketplace/site's messaging
  to WhatsApp, Telegram, personal email, or text before any deal is final —
  a near-universal tactic to escape the platform's own fraud protections.
- **Payment method mismatch.** Wire transfer, gift cards, cryptocurrency, or
  payment apps' "friends and family" option requested for a
  should-be-buyer-protected transaction.
- **Reused or stock photos.** Search a distinctive photo (via
  `tavily_search` with descriptive terms, or `tavily_extract` on suspected
  source pages) for it appearing elsewhere attached to a different
  name/price/location.
- **New or thin identity.** Account, domain, or business with no history
  findable anywhere, paired with high-value ask.
- **Inconsistent details.** Name, address, or story that shifts between
  messages, or doesn't match what's found publicly.

## Where to search for reports

- `"<name/domain/phone/email>" scam` / `"<name>" review` / `"<name>" complaint`
- Site-specific scam-report boards and subreddits relevant to the category
  (renters', job-seekers', marketplace-specific communities) — use
  `tavily_search` with the platform name plus "scam reports"
- Regulatory/consumer-protection sources where relevant (better-business or
  local-equivalent listings, tenant-rights sites for rentals)
- Reverse-image-style search of any provided photo via descriptive text
  search when no direct reverse-image tool is available

## Weighing what you find

- One old, resolved, or single-source complaint ≠ a pattern. Multiple
  independent sources describing the same behavior = a real signal.
- **No results found is not the same as "clean."** Say so explicitly in the
  report; a brand-new listing/account/business has thin history by default.
- A single universal signal alone (e.g. urgency) is a caution, not
  automatically a red flag — but two or more compounding is.
