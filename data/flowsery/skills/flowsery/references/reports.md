# Report shapes

## The weekly health report

For each website in the site profile:

1. `get_overview` for last week and for the week before, both in the site's
   timezone. Read `visitors`, `sessions`, `bounceRate`, `conversionRate`
   and `revenue`.
2. `list_issues` with status open. Re-rank by `sessionsCount`,
   descending.
3. `get_issue` on the top three, for the steps to replicate.
4. `get_pages` and `get_channels` for last week, limit 10.

Write it in this shape, under 300 words:

**Headline.** One sentence: the single most costly thing happening now,
with its number.

**What moved.** Last week against the week before, only metrics that
changed by more than 10%. Give both numbers and the direction. Skip
anything flat.

**What broke.** The top three open issues by sessions affected: title,
sessions affected, the page it concentrates on, and the first step to
replicate.

**Fix first.** One item and why it beat the others, in sessions and revenue
exposure.

If nothing meaningful changed, say "quiet week" and list only the open
issues.

## "What broke this week?"

`list_issues` with status open and sort `recency`. Keep the ones whose
`lastSeenAt` falls in the last 7 days (the tool has no date filter), and
re-rank those by `sessionsCount`. For the top five, `get_issue`. For each: title,
sessions affected, whether it is getting worse (compare first and last
seen), the steps to replicate, and one line on what it likely costs based on
the page it sits on. Then say which one a developer should pick up first
and which ones look like the same underlying cause. If fewer than five are
open, say so rather than padding the list.

## "How did the launch do?"

Ask for the launch date if you don't have it. Then:

1. `get_timeseries` by day from a week before to a week after.
2. `get_channels` and `get_referrers` for the launch days.
3. `get_campaigns` if the launch used UTM tags.
4. `get_goals` for the launch days against the week before.

Lead with the peak day and how far above the baseline it was, then where the
traffic came from, then whether it converted.

## "Where do paying customers come from?"

`get_channels` and `get_referrers` with the revenue column, for a window of
at least 30 days. Rank by revenue, not visitors, and give revenue per visitor
for the top sources. Small numbers deserve a warning: three payments do not
make a trend.
