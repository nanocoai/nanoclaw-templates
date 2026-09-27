# Known stores

Registry of retailers `styli-search` fans out to by default. Each row maps
to one skill under `skills/`. `styli-new-store` appends a row here when it
scaffolds a new retailer skill — this file is the single source of truth
for "which stores does Styli search."

| Store | Domain(s) | Skill |
|---|---|---|
| Amazon | amazon.com (+ local Amazon TLDs) | `styli-amazon` |
| Shein | shein.com (+ local storefronts) | `styli-shein` |
| AliExpress | aliexpress.com | `styli-aliexpress` |

To search only one store, name it in the request ("find it on Amazon").
With no store named, `styli-search` queries all rows above and merges the
results.
