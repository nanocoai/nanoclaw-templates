---
name: styli-amazon
description: Search Amazon for a clothing/footwear/accessory item via Tavily web search and return normalized product results (title, price, image, rating, product link). Called by styli-search; use directly if someone asks to search specifically on Amazon.
license: MIT
compatibility: Requires the tavily MCP server (search + extract tools) configured with a Tavily API key.
---

# styli-amazon

Input: an `ItemQuery` (see `styli-search`'s `references/contracts.md`).
Output: an array of `Product` objects with `"retailer": "amazon"`.

## 1. Search

Use the `tavily` search tool. Build the query from the `ItemQuery` fields
that are set, scoped to Amazon:

```
site:amazon.com <garmentType> <color> <style> <gender>
```

Use the local Amazon domain if the request implies a region (e.g.
`amazon.co.uk`, `amazon.ae`) instead of `.com`. Ask for enough results to
have headroom after filtering (15-20).

## 2. Extract

Amazon search-result snippets are usually too thin for price/image. Before
extracting, quickly pre-rank the 15-20 raw results against the `ItemQuery`
using just the title/snippet text, and keep only the top 3-5 candidates —
then run the `tavily` extract tool on only those product-page URLs (pattern
`amazon.<tld>/.../dp/<ASIN>` or `/gp/product/<ASIN>`). Extracting every raw
result burns Tavily credits fast, especially under the keyless shared
quota — don't do it.

## 3. Parse each product page into a `Product`

- `id`: the ASIN from the URL.
- `title`: the product title, trimmed of marketing suffixes.
- `price`: the numeric current price; if multiple prices appear (list vs.
  deal), take the one Amazon shows as the current buy price. `null` if
  genuinely absent (e.g. "see options").
- `currency`: infer from the domain/price symbol (`$` on `.com` → USD,
  `£` on `.co.uk` → GBP, etc.).
- `image`: the primary product image URL, at full resolution — Amazon's
  page markup often carries small thumbnail variants too (URLs with a size
  modifier like `._AC_SR38,50_.jpg`), including in carousels of other
  products. Use the full-size variant (`._AC_SL1500_.jpg`, or strip the
  modifier entirely down to `.../I/<id>.jpg`) rather than whichever `<img>`
  tag happens to be nearest the title in the extracted text.
- `productUrl`: the canonical `.../dp/<ASIN>` URL — not a search or
  redirect link.
- `attributes.rating`: the star rating out of 5, if shown.
- `attributes.reviewCount`: the review count, if shown.
- `attributes.originalPrice`: list/strikethrough price if a discount is
  shown and it's a real number, else omit.

## Edge cases

- Sponsored/ad placements mixed into search results are fine to include —
  don't try to filter them out, they're still real products.
- If a page fails to extract cleanly (CAPTCHA wall, region block, removed
  listing), skip that one item rather than failing the whole search.
- Skip Amazon entirely (return an empty array) rather than guessing when
  Tavily returns nothing relevant — `styli-search` will note the gap.
