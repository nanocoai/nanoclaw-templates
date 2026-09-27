---
schedule: "0 9 * * 1"
---

Send the weekly social review, using the adaptlypost skill and the brand
profile in memory. If memory holds no brand profile yet, skip the review
and offer the short onboarding chat instead.

1. `get_analytics_overview` for the last 7 days (it compares against the 7
   days before).
2. `list_post_analytics` for the same window, sorted by `VIEWS`, limit 3.
3. `list_posts` with statuses `FAILED` and `PARTIAL_FAILURE` from the last
   7 days.
4. `list_posts` with status `SCHEDULED` for the next 7 days, sorted
   `OLDEST`.

Write one short message:

- The headline: the one number that moved most, with both values.
- The top post and one sentence on why it probably worked.
- Every failed network, with its error and what to do.
- What's queued this week, one line per post (day, time, networks). If
  nothing is queued, say so and offer to draft the week.

Under 200 words. Read only: do not publish, schedule, retry or delete
anything from this task.
