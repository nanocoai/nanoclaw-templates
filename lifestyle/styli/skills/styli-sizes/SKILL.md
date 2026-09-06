---
name: styli-sizes
description: Read or record a person's clothing/shoe sizes per brand and their body measurements from a soft tape measure. Use when styli-search needs a person's known sizes before ranking results, or when someone states/corrects a size, shares measurements, or asks "what size should I get in <brand>".
license: MIT
---

# styli-sizes

Durable, per-person size memory — the single most useful fact this
template can hold, since sizing isn't universal across brands. Store one
file per person, under this agent's own memory system (not inside the
template — this is runtime data specific to the household using it):

```
memory/styli/sizes-<person>.md
```

(lowercase, e.g. `sizes-alex.md`, `sizes-sam.md`). Follow whatever memory
convention this agent already uses (frontmatter, indexing) if one exists;
otherwise plain Markdown is fine.

## File shape

```markdown
---
type: size-profile
person: alex
---

# Alex — sizes

## Body measurements (soft tape)
| Measurement | cm | Measured |
|---|---|---|
| Chest/bust | 95 | 2026-01-15 |
| Waist | 80 | 2026-01-15 |
| Hips | 98 | 2026-01-15 |
| Inseam | 78 | — |
| Shoe length | 26.0 | 2026-01-15 |

## Brand sizes
| Retailer | Category | Size | Fit note |
|---|---|---|---|
| Amazon (Nike) | Shoes | US 9 | true to size |
| Shein | Tops | L | runs small — order up |
```

## Reading (called from `styli-search`)

Look up `memory/styli/sizes-<person>.md`. Return, for the relevant
`garmentType`: the brand-size row for the retailer being searched if one
exists, else the closest body measurement, else nothing — don't guess a
size from a different category.

## Writing

- **Explicit size for a store**: upsert a row in "Brand sizes" (retailer +
  category → size + fit note). Update in place rather than appending
  duplicate rows for the same retailer + category.
- **New/updated measurement**: upsert the "Body measurements" row with
  today's date. A new soft-tape measurement replaces the old value — this
  is "what's true now," not a history log.
- **Fit feedback** ("too small", "runs big"): fold it into the fit-note
  column of the relevant brand-size row rather than creating a separate
  log — keep the file small and current, not an event stream.

If `person` has no file yet, create one with just the fields you actually
have — don't fabricate placeholder rows.
