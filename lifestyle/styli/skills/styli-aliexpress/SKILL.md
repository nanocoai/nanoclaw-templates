---
name: styli-aliexpress
description: Search AliExpress for a clothing/footwear/accessory item via Tavily web search and return normalized product results (title, price, image, rating, product link). Called by styli-search; use directly if someone asks to search specifically on AliExpress.
license: MIT
compatibility: Requires the tavily MCP server (search + extract tools) configured with a Tavily API key.
---

# styli-aliexpress

Input: an `ItemQuery` (see `styli-search`'s `references/contracts.md`).
Output: an array of `Product` objects with `"retailer": "aliexpress"`.

## 1. Search

Use the `tavily` search tool, scoped to AliExpress:

```
site:aliexpress.com <garmentType> <color> <style> <gender>
```

Ask for 15-20 results — AliExpress listings vary hugely in quality, so
expect to filter more aggressively than other stores.

## 2. Extract

Product-page URLs look like `.../item/<productId>.html`. Pre-rank the
15-20 raw results against the `ItemQuery` by title/snippet first, keep the
top 3-5, and run the `tavily` extract tool only on those — extracting
everything burns Tavily credits fast, especially under the keyless shared
quota. AliExpress listing pages often mix several variant prices
(color/size options) in the raw page text.

## 3. Parse each product page into a `Product`

- `id`: the numeric `productId` from the URL.
- `title`: the listing title as shown. Titles are often long and
  keyword-stuffed — keep it verbatim rather than trying to rewrite it, the
  ranking step handles matching.
- `price`: the base/lowest variant price shown for the item. If price is
  only shown as a range, use the low end and note nothing further — don't
  fabricate a single-variant price.
- `currency`: infer from the shown currency symbol/code; AliExpress often
  localizes to the visitor's likely region — default to USD if ambiguous.
- `image`: the primary listing image URL.
- `productUrl`: the canonical `.../item/<productId>.html` URL.
- `attributes.rating`: star rating out of 5, if shown.
- `attributes.reviewCount`: order/review count, if shown (AliExpress often
  shows "orders" instead of "reviews" — reviewCount can hold either, they
  serve the same popularity-signal purpose here).
- `attributes.originalPrice`: pre-discount price if shown and distinct from
  `price`, else omit.

## Edge cases

- Shipping cost and delivery time are not part of the `Product` contract —
  don't invent fields for them; if they're prominent on the page and
  clearly relevant, you may mention them in the rendered card's free text,
  not in structured `attributes`.
- Skip listings that require extract to log in or that return no usable
  content (common for regional-locked listings).
- Return an empty array rather than guessing when nothing relevant surfaces.

## Coverage & limitations

`site:aliexpress.com` search returns mostly wholesale/category pages
(`.../w/wholesale-....html`) rather than individual `.../item/<id>.html`
listings, and the few real item pages found are often JS-gated — `tavily`
extract can come back empty even on a genuine product URL. Expect this
adapter to return fewer results than Amazon, sometimes zero; that's a
structural limit of generic web search against AliExpress, not a bug to
work around with query tuning.

As with Shein, reliable AliExpress coverage would need a different fetch
method for this one skill (e.g. a structured-data source), swapped in
without touching `styli-search` or the ranking core — the adapter seam
this template is built around exists precisely for cases like this one.
