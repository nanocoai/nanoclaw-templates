# Shared contracts

Every store skill (`styli-amazon`, `styli-shein`, `styli-aliexpress`, and
any store `styli-new-store` scaffolds) speaks these two shapes. `styli-search`
never needs to know a store's page layout — only this contract.

## ItemQuery — what's being asked for

Produce this by reading the request yourself (and the photo, if one was
sent) — you're the parser here; there's no separate extraction script, and
your read of a photo or a sentence is richer than any keyword heuristic
would be. Fields, all optional except `raw`/`source`:

```json
{
  "raw": "the original request text, or a short caption of the photo",
  "source": "text | photo",
  "garmentType": "e.g. dress, jeans, sneakers",
  "color": "e.g. black",
  "style": "e.g. cropped, floral, lace",
  "occasion": "e.g. wedding, everyday",
  "gender": "women | men | unisex",
  "priceCeiling": 60,
  "size": "explicit size if the person stated one for this request",
  "person": "who this is for — defaults to the requester, see instructions.md"
}
```

## Product — one normalized result

Every store skill returns an array of these, regardless of source store:

```json
{
  "retailer": "amazon",
  "id": "store's own product id",
  "title": "string",
  "price": 39.9,
  "currency": "USD",
  "image": "https://... or null",
  "productUrl": "https://... — the retailer's own product page, never a redirect",
  "attributes": { "rating": 4.3, "reviewCount": 812, "originalPrice": 54.9 }
}
```

`price`/`image`/`attributes` fields may be `null` or omitted when a result
genuinely doesn't have them — don't invent values.

## Currency normalization

Products arrive in whatever currency their store/domain uses (USD, GBP,
ILS, ...). Before applying the price ceiling or comparing prices across
stores, convert every `price` to one reference currency — use the
requester's evident local currency if clear from context, else USD — using
the static approximate rate table below. This is an approximation for
ranking purposes only, deliberately not a live rate lookup (keeps behavior
deterministic): never silently apply a price ceiling across mismatched
currencies, and never re-label the displayed price in the rendered card —
always show the store's own original price and currency to the person, only
the *comparison* is normalized internally.

Approximate rates to USD (update occasionally; precision doesn't matter for
ranking purposes):

| Currency | ≈ per 1 USD |
|---|---|
| USD | 1.00 |
| GBP | 0.79 |
| EUR | 0.92 |
| ILS | 3.70 |
| CNY | 7.20 |
| AED | 3.67 |

Currency not in this table: use your own general knowledge of its
approximate rate rather than blocking the comparison.

## Ranking

Score each candidate and sort best-first:

- **Price ceiling is a hard filter**: drop anything over `priceCeiling` when
  one was given, in normalized-currency terms (unless `price` is unknown —
  don't drop for missing data).
- **Keyword match** (`garmentType`, `color`, `style` against the title) —
  the dominant signal. Weight roughly 0.5.
- **Rating** (`attributes.rating` / 5, treat missing as neutral 0.5) —
  roughly 0.15.
- **Size match** — soft signal, roughly 0.1. An explicit `query.size` wins;
  otherwise use this person's known size on file for this retailer +
  garment type (from `styli-sizes`) as the same soft signal. Reward a title
  match; never punish an unknown size by dropping the item.
- **Value** (price relative to `attributes.originalPrice` if a discount is
  shown, and relative to other candidates' normalized prices) — roughly
  0.25. Treat "no discount shown, price in line with similar candidates" as
  neutral, not penalized.
- Mark the top result "closest to what you asked for" and the
  highest-rated one "most popular" (skip badges if there's only one result,
  or if it would badge the same item twice).

Weights are approximate and should sum to roughly 1.0 — this mirrors the
scoring the earlier internal prototype used; see it as a starting point, not
a rigid formula, and use judgment when signals conflict.
