# Reading analytics

## Which tool

| Question | Tool |
|----------|------|
| How did we do this month? Follower count? | `get_analytics_overview` |
| Is it going up or down? When did it jump? | `get_analytics_timeseries` |
| Which network works best? | `get_platform_breakdown` |
| Top posts, or how one post did | `list_post_analytics` (sort by `VIEWS`, small `limit`) |
| Numbers look stale or empty | `get_analytics_sync_status` |
| The user just published and wants numbers | `trigger_analytics_sync`, then poll the status |

## Rules that change the answer

- **Window.** `from` and `to` select posts published inside the window. The
  comparison is the window of the same length just before it. Say which
  dates you used.
- **Coverage.** The last 180 days only. Dates before `historyHorizonAt` have
  no data, which is not the same as zero activity.
- **Freshness.** Metrics refresh every few hours; `lastSyncedAt` says when.
  `trigger_analytics_sync` is allowed once per workspace every 10 minutes.
  Inside the cooldown it returns `queued: false`; do not retry in a loop.
- **Networks.** X and Mastodon report no analytics. A network missing from
  `get_platform_breakdown` has no data for the window.
- **Partial metrics.** `partialMetrics` names metrics some selected network
  cannot report. Compare networks only on metrics both list in
  `supportedMetrics`.
- **Reconnect.** When `needsAnalyticsReconnect` is true for an account, it was
  connected before analytics permissions existed and returns nothing until
  the user reconnects it in AdaptlyPost. Tell them once; do not keep
  querying.
- **Discovered posts.** `list_post_analytics` also lists posts made outside
  AdaptlyPost on the connected accounts. Those have `postId: null`.

## Reporting

Lead with the number that changed most and what probably caused it, using
`list_post_analytics` to name the posts behind a spike. Give both values and
the direction for anything that moved more than 10%. Skip flat metrics.
