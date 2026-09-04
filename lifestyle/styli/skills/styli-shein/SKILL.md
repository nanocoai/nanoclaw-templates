---
name: styli-shein
description: Search Shein for a clothing/footwear/accessory item via Tavily web search and return normalized product results (title, price, image, rating, product link). Called by styli-search; use directly if someone asks to search specifically on Shein.
license: MIT
compatibility: Requires the tavily MCP server (search + extract tools) configured with a Tavily API key.
---

# styli-shein

Input: an `ItemQuery` (see `styli-search`'s `references/contracts.md`).
Output: an array of `Product` objects with `"retailer": "shein"`.

## 1. Search

Use the `tavily` search tool, scoped to Shein:

```
site:shein.com <garmentType> <color> <style> <gender>
```

Shein runs many localized storefronts (`us.shein.com`, `shein.co.il`, ...).
Prefer the local one if the request implies a region, else `us.shein.com`.
Ask for 15-20 results for headroom after filtering.

## 2. Extract

Shein product-page URLs look like `.../<slug>-p-<productId>.html`. Search
snippets alone rarely carry price or image reliably, but don't extract all
15-20 raw results — pre-rank them against the `ItemQuery` by title/snippet
first, keep the top 3-5, and run the `tavily` extract tool only on those.
Extracting everything burns Tavily credits fast, especially under the
keyless shared quota.

## 3. Parse each product page into a `Product`

- `id`: the numeric `productId` from the URL slug.
- `title`: the product title as shown, trimmed of promo badges ("New",
  "Plus Size" tags are fine to keep if part of the real title).
- `price`: the current listed price. Shein frequently shows a
  member/flash price alongside a regular price — take the price a
  logged-out visitor would actually pay.
- `currency`: infer from the storefront domain (`us.shein.com` → USD,
  `shein.co.il` → ILS, etc.) or the currency symbol shown.
- `image`: the primary product image URL.
- `productUrl`: the canonical product page URL, not a category/search link.
- `attributes.rating`: star rating out of 5, if shown.
- `attributes.reviewCount`: review count, if shown.
- `attributes.originalPrice`: the pre-discount price if shown and distinct
  from `price`, else omit.

## Edge cases

- Sizes on Shein run notably brand-specific and often small — if
  `styli-sizes` has a fit note for Shein, surface it via the normal size
  hint in the final gallery; don't editorialize about sizing yourself here.
- If a listing has no reachable product page (removed/out of stock), skip it
  rather than fabricating price/image data.
- Return an empty array rather than guessing when nothing relevant surfaces.

## Coverage & limitations

In practice, `site:shein.com` search results are dominated by ad-network
redirect URLs (one tracking link fronting a garbled multi-product feed, not
a real product page) rather than clean `.../<slug>-p-<productId>.html`
pages. Real product pages do occasionally surface, but expect this adapter
to return fewer results than Amazon, sometimes zero — that's Tavily's
generic search hitting Shein's structure, not a quota or parsing bug. Don't
try to force a result by extracting the ad-feed URL; skip it per the edge
cases above.

If Shein coverage needs to be reliable rather than best-effort, the fix is
a different fetch method for this one skill (e.g. a structured-data source
like Bright Data), not a change to the search query or to the core ranking
pipeline — `research-shein`, a separate skill in this family, is a working
example of exactly that swap.
