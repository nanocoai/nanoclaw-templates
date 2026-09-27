---
name: flowsery
description: Answer web analytics questions and find what is broken on the user's websites through Flowsery Analytics. Covers visitors, sessions, bounce rate, pages, referrers, channels, UTM campaigns, countries, devices, browsers, goals, conversion rate and revenue, live visitors, single visitor journeys, and the bugs, broken flows and UX problems Flowsery's AI found in session recordings. Use this skill WHENEVER the user asks how their site is doing, where traffic comes from, what converts, how much revenue a source brought, how many people are on the site right now, what broke this week, why signups dropped, or wants to record a goal or payment or mark an issue fixed. Trigger it even for short asks like "traffic this week?", "top pages", "is checkout broken?", "how did the launch do" or "where do paying customers come from".
---

# Flowsery

You read the user's Flowsery workspace through the `flowsery` MCP server.
Its tools are named `mcp__flowsery__<tool>` and carry their own parameter
descriptions; read them. This skill is the operating logic on top.

If memory holds no site profile yet, run `references/onboarding.md` first.

| Question | Tools |
|----------|-------|
| Which sites? Timezone, currency | `list_websites`, `get_metadata` |
| Totals for a window | `get_overview` |
| Trend over time | `get_timeseries` |
| Split by one dimension | `get_pages`, `get_referrers`, `get_channels`, `get_campaigns`, `get_countries`, `get_regions`, `get_cities`, `get_devices`, `get_browsers`, `get_operating_systems`, `get_hostnames`, `get_goals`, `get_breakdown` |
| Right now | `get_realtime`, `get_realtime_map` |
| One person | `get_visitor` |
| What broke | `list_issues`, `get_issue`, `update_issue_status` |
| Record data | `track_goal`, `track_payment` |
| Erase data | `delete_goals`, `delete_payments` |

## Tools and credentials

The API key is injected by the credential gateway; you never see it. If the
`mcp__flowsery__*` tools are missing, or a call fails with 401 or "not
connected", read `references/credentials.md` and follow it. Never ask for a
raw key in chat.

## Every session starts the same way

1. `list_websites`. A workspace key reaches every site in the workspace, and
   every other tool needs `websiteId` or `domain` from this list. The key
   belongs to one workspace, so leave `workspaceId` out.
2. `get_metadata` for the site in question, to learn its timezone and
   currency. Pass that timezone to date-range tools.

## Answering a question

- **Pick the window on purpose.** Without dates the tools use the last 30
  days ending now. Turn "this month" or "last week" into real dates in the
  site's timezone, and say which window the numbers cover.
- **Compare like with like.** For "is it up or down", run the same tool on
  the previous window of the same length and give both numbers.
- **Filters narrow everything.** Every `filter_*` argument applies to the
  whole result, so `filter_country` plus `filter_device` answers "mobile
  visitors from Germany" in one call.
- **Use the named tool.** `get_pages`, `get_referrers` and the rest return
  the same rows as `get_breakdown` for their dimension. Use `get_breakdown`
  for dimensions with no named tool: `entry_page`, `exit_link`,
  `browser_version`, `os_version`, `utm_source`, `utm_medium`, `utm_term`,
  `utm_content`, `ref`, `source`, `via`, `all_params`.
- **Channels first, then sources.** `get_channels` gives the traffic mix;
  drill into `get_referrers` or `get_campaigns` from there.
- **Revenue** comes from connected payment providers (Stripe, LemonSqueezy,
  Polar and others) or from `track_payment`. If revenue is zero, say that no
  payments are recorded rather than that nothing sold.

`references/reports.md` has the report shapes and the weekly health report.

## What broke

Issues are problems Flowsery's AI found while watching session recordings,
deduplicated across sessions and ranked by severity.

1. `list_issues` for the open ones. Re-rank by `sessionsCount` when the
   user cares about impact over severity.
2. `get_issue` only for the few you report on: it returns occurrences, steps
   to replicate and linked tickets.
3. Suspended issues are hidden from the default list. An issue that seems to
   have vanished was probably suspended, not fixed.

`update_issue_status` is reversible, but the states mean different things:
**resolved** says the bug is fixed; **suspended** says it never mattered.
Ask which one the user means. On a free trial only the first ten issues are
listed, and any other issue returns "Upgrade to view this issue"; say so
plainly.

## Personal data

`get_visitor` returns a person's identity, email, location, full page
history and revenue. Call it only when the user asks about a specific
visitor and is entitled to see them, and show only what answers the
question. `get_realtime_map` leaves names, emails and revenue out; prefer it
for "who's on the site". Never paste a visitor's email or name into a
report.

## Writes

Read `references/writes.md` before any `track_*`, `delete_*` or issue status
change. In short: recording a goal or payment only records analytics and
never charges anyone; deleting goals or payments is permanent and needs a
restated, explicit "yes".

## Output style

- Answers: the number first, then one line of context (the window, the
  comparison, the likely cause).
- Breakdowns: a short table, top 10 unless asked for more.
- Reports: the headline and one recommendation first, then detail.
- Numbers are rounded for reading (12.4k visitors, 3.1% conversion) unless
  the user wants exact values.
