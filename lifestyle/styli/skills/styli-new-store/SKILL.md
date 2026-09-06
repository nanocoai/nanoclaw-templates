---
name: styli-new-store
description: Scaffold a new per-store fetch-adapter skill (e.g. Zara, Etsy, Asos) so styli-search can query an additional retailer, using whatever fetch method suits that store (Tavily search+extract by default, a different structured-data source if the store needs it) and the shared Product contract as the built-in stores. Use when someone asks to add, support, or search a store that isn't already configured.
license: MIT
---

# styli-new-store

Adds one retailer to Styli. Do this by generating a new sibling skill, not
by hard-coding logic into `styli-search` itself — every store stays an
independent, removable skill.

## 1. Gather what you need about the store

- Its domain(s), including any localized storefronts worth supporting.
- The shape of a product-page URL (so you can recognize and canonicalize
  `productUrl` and pull an `id` out of it).
- Anything genuinely unusual about how it shows price/rating (multi-tier
  pricing, "orders" instead of "reviews", region-based currency, etc.) —
  skim 2-3 real product pages via `tavily` search + extract to check,
  rather than guessing.
- Whether generic `tavily` search + extract actually works against this
  store: run a real `site:<domain>` search and extract on 2-3 results
  first. If search returns mostly ad-redirect/category pages instead of
  individual products, or extract comes back empty on real product URLs,
  that's a sign this store needs a different fetch method — say so in the
  new skill's Coverage & limitations section (see step 2) rather than
  shipping a skill that looks like it works but rarely returns anything.

## 2. Create the skill folder

`skills/styli-<store>/SKILL.md` where `<store>` is the lowercase store name
with hyphens (matches the `name:` frontmatter, agentskills.io requires the
two to be identical). Model the body directly on `styli-amazon`,
`styli-shein`, or `styli-aliexpress` — same three sections:

1. **Search** — the `site:<domain>` Tavily query built from `ItemQuery`
   fields (or the equivalent first step for whatever fetch method this
   store actually needs).
2. **Extract** — which URL pattern to run `tavily` extract on.
3. **Parse into `Product`** — field-by-field mapping into the shared
   contract in `styli-search`'s `references/contracts.md`, including any
   store-specific quirks found in step 1.
4. **Coverage & limitations** — one honest paragraph on how well generic
   Tavily search/extract actually works for this store, based on what you
   found in step 1. Model this on `styli-shein`'s or `styli-aliexpress`'s
   section if the store resists generic search.

Keep it self-contained — don't assume the new skill can read another
skill's files at runtime; restate the `Product` shape briefly rather than
only linking to it.

## 3. Register it

Append one row to
`ai.nanoco.nanoclaw/context/additional_context/known-stores.md`:
`| <Store name> | <domain(s)> | styli-<store> |`. This is the only place
`styli-search` looks to know which stores exist — without this row the new
skill is never fanned out to automatically (it can still be invoked by
explicit name).

## 4. Sanity-check

Run one real search through the new skill with a plausible `ItemQuery`
before considering it done — confirm it returns at least one well-formed
`Product` (real `productUrl`, non-null `price` or a clear reason it's
absent). Fix the parsing rules if the first real page doesn't fit the
pattern you wrote in step 2.

## What not to do

- Don't add affiliate links, referral codes, or tracking params to
  `productUrl` — link straight to the retailer's own canonical page.
- Don't bake in a store-specific API key or scraping credential; if a store
  genuinely requires authenticated access beyond what Tavily's public web
  search/extract can reach, say so instead of working around it.
