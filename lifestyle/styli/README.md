# Styli — personal shopping stylist

The core — ranking, size-fit matching, HTML rendering — is store-agnostic.
Each store plugs into it through one thing: a fetch adapter (skill) that
turns an `ItemQuery` into normalized `Product` results. Adding a retailer
never touches the core, only adds a sibling skill.

Today's built-in adapters all fetch via Tavily web search + page extract,
because that's what works for crawlable, server-rendered stores — Amazon
being the clean case. Stores that resist generic web search (ad-redirect
URLs, JS-gated pages — Shein and AliExpress hit both) are exactly the case
the adapter seam exists for: swapping in a different fetch method (e.g. a
structured-data source) for one store is a one-skill change, never a core
rewrite. `research-shein` (a separate Bright Data-based skill in this same
family) is a real example of that swap already existing for one hard case.

Describe an item ("black cropped jacket under $60") or send a photo of one,
optionally naming who it's for. Styli fans out to every configured store's
adapter, ranks the results against what was actually asked for and against
that person's known sizes, and hands back a shareable HTML results page —
degrading gracefully (reporting what each store did and didn't return)
rather than failing outright when one adapter comes up empty.

## What it does

1. Reads the request text and/or the attached photo directly — no
   keyword-extraction script, the model does the parsing.
2. Looks up the target person's saved clothing sizes and body measurements
   (`styli-sizes`), if any are on file.
3. Fans out to every configured store's adapter skill (`styli-amazon`,
   `styli-shein`, `styli-aliexpress`), each of which fetches that store's
   own way (Tavily search + extract today) and returns normalized product
   results — see each skill's Coverage & limitations note for what to
   expect from it.
4. Merges, filters by price ceiling, and ranks by keyword match / rating /
   size fit.
5. Renders a self-contained HTML gallery, publishes it via
   [html.page](https://html.page), and replies with the link.
6. Remembers any size or fit feedback mentioned along the way.

Add a fourth store any time with `styli-new-store` — it scaffolds a new
adapter skill and registers it, no core changes required, whatever fetch
method that store actually needs.

## External services

| Service | What it's used for | Auth | Where to get a key |
|---|---|---|---|
| [Tavily](https://tavily.com) | Web search + page extraction — the only way this template reaches any store's live listings | Keyless by default (see below) | Optional — only if you switch to your own key |
| [html.page](https://html.page) | Publishes the results gallery as a shareable link | None — public, unauthenticated API | N/A |

### Tavily: two auth modes

`mcp.json` ships **keyless by default** — no signup, works immediately after
install (via `mcp-remote` against `https://mcp.tavily.com/mcp/` with
`X-Tavily-Access-Mode: keyless`). This is a shared, IP-based quota, so under
heavy concurrent use it can run dry.

If you hit that wall (or want a dedicated quota), swap the `tavily` entry in
`mcp.json` for your own key:

```json
"tavily": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "tavily-mcp@latest"],
  "env": { "TAVILY_API_KEY": "your-key-here" }
}
```

Free tier keys are available at [tavily.com](https://tavily.com). No
credentials of any kind are bundled with this template either way.

**Credit cost per search:** each store search does one `tavily_search` call,
then `tavily_extract` on only its top 3-5 pre-ranked candidates (not every
result) — so a 3-store fan-out costs roughly 3 searches + 9-15 extracts. Store
skills pre-rank on search snippets before extracting, specifically to keep
this bounded under the keyless shared quota.

### Smoke test

Ask: *"find a black cotton t-shirt under $20"*. Expect a published html.page
link within a few seconds, with real Amazon results (image/title/price/link
per card) — the reliable, hero path. Shein and AliExpress are best-effort
(see their skills' Coverage & limitations notes); the gallery still renders
correctly if one comes back empty.

## Data this template stores

Per-person size profiles (`memory/styli/sizes-<person>.md`): clothing/shoe
sizes per brand and body measurements the person has shared. This is
runtime data created by the agent as people use it — nothing ships
pre-populated.

## What this is not

- No affiliate, referral, or commission links — every product link is the
  retailer's own canonical page.
- No purchasing on anyone's behalf — this only finds and presents options.
- No scraping pipeline or store-specific credentials — the built-in
  adapters all reach their store through Tavily's public web search and
  extract; a future adapter is free to fetch a different way without
  touching the core.
- Not affiliated with Amazon, Shein, or AliExpress.

## Extending

To support another store, ask Styli to add it (or read
`skills/styli-new-store/SKILL.md` directly) — it scaffolds a new adapter
skill (fetch → extract → normalize into the shared `Product` contract,
using whatever fetch method suits that store) and registers it in
`ai.nanoco.nanoclaw/context/additional_context/known-stores.md`.
