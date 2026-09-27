---
name: styli-search
description: Find a clothing or footwear item across configured retailers (Amazon, Shein, AliExpress, or whichever this template has been extended to) from a text request or a photo, size it to the requesting person, and return a shareable HTML results page. Use when someone asks to find/search for/look up an item to buy, or shares a photo of clothing/shoes/an accessory asking for something similar.
license: MIT
---

# styli-search

Full pipeline: understand the ask → search every known store → rank →
render → publish → reply with the link. See `references/contracts.md` for
the exact `ItemQuery`/`Product` shapes every step below uses.

## 1. Understand the ask

Build an `ItemQuery` yourself from the message (and the photo, if one was
attached — look at it directly: garment type, color, material, pattern,
notable style details). Figure out `person` per the "for whom" rule in
`instructions.md` (parent context file).

## 2. Load known sizes

Call `styli-sizes` to read the size profile for `person`. On a first-ever
search there will be nothing on file — that's fine, proceed size-agnostic
and still return full results; don't gate or delay the search on missing
sizes, and don't fabricate one. Once results are shown, if nothing was on
file, offer once to remember sizes for next time rather than demanding them
up front. The sizing payoff (a "your usual size" hint on cards) is meant to
show up starting on the *second* search for someone, not block the first.

## 3. Search each store

Read `additional_context/known-stores.md` for the configured stores. If the
request named a specific store, search only that one; otherwise fan out to
all of them. Invoke each store's skill (`styli-amazon`, `styli-shein`,
`styli-aliexpress`, ...) with the `ItemQuery`; each returns `Product[]`.

Treat each store's call as fully isolated: a timeout, a rate-limit, an
extract failure, or an empty result from one store must never abort the
others or the search as a whole. Keep going with whichever stores succeeded
and present degraded-but-real results ("found 8 from Amazon and Shein;
AliExpress timed out") rather than erroring out — a partial result is always
better than none.

## 4. Rank

Merge every store's results into one list and apply
`references/contracts.md`'s ranking rules. Drop obvious near-duplicates
(same retailer + same title + same price). Cap at a reasonable gallery size
(around 12-20 items) — favor the top of the ranking, not one item per
store.

## 5. Render

Build one self-contained HTML page (inline `<style>`, no external assets
except the product images themselves) with a card per product: image,
title, price + currency, rating if known, a size hint line when this
person has a known size for that retailer + garment type ("your usual
size: M" — not "recommended size", you don't actually know availability),
and the badges from `references/contracts.md`. Link each card straight to
`productUrl`. Match the requester's language (Hebrew/Arabic/English) for
all page copy, right-to-left layout for Hebrew/Arabic.

Footer, plainly, every time: prices and stock shown may have changed —
confirm on the product page before buying. Do not add commission,
affiliate, or "earns Styli a fee" language — this template carries none of
that.

Privacy guard: this page is published to a public, unauthenticated URL.
Never include raw body measurements or a full brand-size table on it — a
size hint stays a short phrase ("your usual size: M"), nothing that reveals
the person's actual measurements.

## 6. Publish

Send the HTML to the `htmlpage` MCP tool (`publish_html`) and get back a URL.

## 7. Reply

Send the link plus a one-line summary (how many results, which stores came
back empty if any, and whether sizes shown are known or unavailable). Don't
paste the HTML into the chat.

## 8. Size feedback

If the message itself states or corrects a size ("I'm actually a size 8
there", "that brand runs small on me"), hand it to `styli-sizes` to save —
don't let it just pass through unrecorded.
