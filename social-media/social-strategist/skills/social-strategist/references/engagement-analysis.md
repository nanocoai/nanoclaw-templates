# Engagement Analysis

Reads what the creator's posts actually did and says what's working for **their goal**: a
baseline, the winners and losers by topic, format, hook, length and day/time, and the top and
bottom posts. Two modes: **(a) platform analysis** ("what's working on TikTok?", "why did my last
video flop?"), and **(b) topic scoreboard**, when they ask which of their topics land. Both read the
`post-log`, filled from Buffer. Engagement rate, headline metric, sample sizes, settled and
collecting follow the router's Definitions.

## Steps: (a) platform analysis

1. **Ground.** Read the `brand-profile` (goal, `topics`, `lookback`), `platform-<x>`, and that
   platform's `post-log` rows and `content-log` scripts. No Buffer connection (Core Memory)? The
   `credentials` reference's "later" case applies; stop there.

2. **Freshen.** `last sync` before today? Sync that platform first (router → Definitions → Last
   sync), writing its `post-log` lines in the format of `additional_context/memory-structure.md`.

3. **Pick the rows** with code: that platform's `post-log` posts inside the `lookback posts`
   window. **Settled** posts feed the stats; **collecting** ones are listed apart as "still
   collecting".

4. **Tag what's untagged**: a post without a topic tag gets one from its text; still none (no
   text)? Leave it untagged and ask one question after the output.

   Length bucket (video with a duration): under 15 s · 15–30 s · 30–60 s · 1–3 min · 3–10 min
   · 10+ min. Time slot: the 2-hour block the post went out in (00–02h … 22–24h), from its
   `post-log` time.

5. **Compute with code**, one script over the rows:
   - Baseline: median exposure, median engagement rate, median headline metric, n, date range.
   - Top 3 and bottom 3 posts by the headline metric (engagement rate when it's missing).
   - Splits by topic, format, hook style, length bucket, weekday and time slot: n, median
     headline metric, median rate, lift = group median ÷ overall median.
   - What works: up to 3 groups at lift ≥ 1.2; what doesn't: up to 2 at ≤ 0.8; best days and
     best time slots (up to 2 each, highest lift).

6. **Compare to the previous period** (the previous history line in `platform-<x>`): baseline
   medians now vs then, % change (rate as points). Add the account totals saved in
   `platform-<x>` as one line.

7. **Close the loop**: of the posts linked to a `content-log` script, count how many beat the
   platform median on the headline metric.

8. **Save** to `platform-<x>` (its fields are in `additional_context/memory-structure.md`), with
   the history line `<yyyy-mm-dd> · buffer · n=<n> · <date range> · <headline finding>`.

## Steps: (b) topic scoreboard

1. **Ground.** Read `brand-profile` (goal, `topics`), freshen as in (a) step 2, and read the
   `post-log`: the platform they named, else one block per platform with posts.
2. **Compute with code** over settled posts, per topic: n, median rate, median headline metric.
   Rank topics by the headline metric when each has it for 3+ posts, else by rate; say which.
3. **Save** only a changed finding, to `platform-<x>` → what works / what doesn't, with n.

## Output

Two shapes, one per mode:

```
📊 TikTok · Jun 28 – Sep 19, 2026 · 24 posts
Goal: grow · headline: views (+ follows)

Baseline
- 1,850 median views · 4.2% median engagement · n=24
- vs Mar 30 – Jun 27: views ↑ 18% · engagement ↓ 0.3 pts
- last 365 days: 212K views · 8.9K reactions · 1.1K comments (Buffer totals)

Working
- number hooks: 2.1x your median views (n=7, directional)
Not working
- talking-head intros over 60 s: 0.6x (n=5, directional)
Best days: Thu (n=5) · Sun (n=4)
Best times: 14–16h: 1.6x (n=6, directional) · 18–20h: 1.3x (n=4, directional)

Top 3 by views
- Sep 12 · "3 pricing mistakes" · 9,800 views · 6.1%
Bottom 3
- Sep 3 · "my desk setup" · 410 views · 1.2%

Still collecting: 2 posts from the last 7 days
Our scripts: 2 of 3 beat your median views
Counted: reactions + comments + shares + saves ÷ views
Source: Buffer, synced 2026-09-26 · saved to your TikTok notes
```

```
🏆 Topics · LinkedIn · Jan 4 – Sep 24, 2026 · 22 posts
Ranked by median engagement rate

1. client stories · 3.8% · n=6
2. pricing · 2.9% · n=5
Not yet rated: hiring (2) · ai (1)

(directional: every topic is under 10 posts)
Source: Buffer, synced 2026-09-26
```

Before sending:

- Header: platform, the date range the posts cover, n of settled posts; dates from code.
- Baseline still building: drop Working, Not working, Best days, Best times.
- Times are in the Buffer account's timezone; say which when it differs from the creator's.
- Headline metric not returned by Buffer for this network: `headline: <metric> not available
  from Buffer`, lead with rate.
- Comparison, totals, "Still collecting" and "Our scripts" lines only when there's something to
  show; top/bottom lines are date · first line (~40 chars) · headline metric · rate.
- "Counted" names exactly the metrics summed.
- At most one question, last (an untagged-posts question, or "want ideas built on this?").
