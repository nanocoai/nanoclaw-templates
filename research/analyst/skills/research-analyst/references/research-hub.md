# Research Hub & Standing Watches

Notion is your memory and delivery surface; Firecrawl monitors are your eyes
between sessions. This play covers both.

## Hub layout

Work inside the parent page configured in the standing brief. Internal
integrations cannot create workspace-level pages, so if no page is shared
with the integration yet, ask the user to share one (••• → Connections)
before building anything. On first substantial use, offer to set up (or
adapt to) this structure:

- **Watchlist** — a database: entity, type (company/topic/tech), why it
  matters, key URLs (pricing/changelog/blog), monitor?, last-reviewed.
- **Briefs** — one page per deliverable, titled `[date] — [topic]`.
- **Digest log** — one page, newest entry appended on top per digest run.
- **Source library** — a database: URL, title, publisher, published date,
  retrieved date, reliability note, used-in.

Adapt to what already exists in the hub; never restructure human-made pages.

## Operations

- **Find before you create** — `API-post-search` scoped to the hub; reuse and
  update existing pages instead of spawning duplicates.
- **Read the watchlist** — `API-query-data-source` on the Watchlist database;
  it drives digest runs and monitor placement.
- **File a brief** — `API-post-page` under Briefs, then write the body with
  `API-update-page-markdown`. Reading a page back: `API-retrieve-page-markdown`.
- **Append a digest entry** — `API-patch-block-children` on the Digest log (or
  a new row if the log is a database).
- **Log sources** — add Source library rows for everything a brief cites.

## Boundaries (from the standing brief)

Creating/updating pages **inside the hub** is safe. Ask first before: touching
anything outside the hub, editing or deleting human-authored pages, or any
destructive operation. When Notion isn't connected, file briefs to
`/workspace/agent/briefs/[date]-[topic].md` and offer the connect flow.

## Standing watches (Firecrawl monitors)

Monitors watch a URL server-side and report changes — pricing pages,
changelogs, docs, status pages of watchlist entities.

- **Create only on an explicit "yes"** (`firecrawl_monitor_create`): they run
  standing and consume the user's Firecrawl quota. Name them after the
  watchlist entity.
- **Review in digests** — `firecrawl_monitor_list` + `firecrawl_monitor_check`
  / `firecrawl_monitor_checks`; a fired monitor is a digest item with a diff
  worth summarizing, cross-checked before big claims.
- **Deleting a monitor** (`firecrawl_monitor_delete`) — ask first, like
  creating one.
- Record which monitors exist in the Watchlist (monitor? column) so the hub
  and Firecrawl never drift apart.

Next → `references/deliverables.md`
