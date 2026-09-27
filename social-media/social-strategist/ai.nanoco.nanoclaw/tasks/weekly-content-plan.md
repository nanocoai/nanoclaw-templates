---
schedule: "0 9 * * 1"
---

# Weekly Content Plan

If there is no `brand-profile` in memory yet, don't plan: post a short invitation to set up
first ("say hi and I'll ask you a few quick things so I can plan your week", the
`social-strategist` skill's `onboarding` reference) and stop.

Otherwise, build this week's plan and post it to the creator's chat: which idea goes on which
platform on which day, using the best days from their analyses, the cadence they set, and the
ideas they've already accepted. **It's a plan they post from themselves.** The words below
(last sync, stale, `directional`, `test`) mean what the `social-strategist` skill's Definitions
and `post-ideas` reference say.

## Steps

1. **Ground.** Read the `brand-profile`: platforms, cadence per platform, goal, `topics`,
   off-limits topics. Read each `platform-<x>` for best days, best time slots and the date of
   its latest analysis, the `post-log` for topic scores and its latest post per platform, and
   the `content-log` for ideas marked `accepted` that haven't been scripted or posted yet.

   **No cadence or accepted ideas saved?** Plan anyway: use 2 posts a week per platform and say
   it's a default (the Cadence line in the output). Don't ask about it; the script offer is the
   message's question.

2. **Verify the week with code.** Get this week's Monday–Sunday dates and weekdays from a quick
   node script. Check the last sync against today the same way.

3. **Fill the slots.**
   - Days: use each platform's best days from `platform-<x>`. With no timing data, spread posts
     through the week and avoid putting two on the same platform on back-to-back days.
   - Times: the start of the platform's best time slot from `platform-<x>`. None yet: leave the
     time out of the line.
   - Content: use accepted ideas first. Fill the rest with the `social-strategist` skill's
     `post-ideas` reference's logic (proven topics for the goal, no repeats).
   - Balance: don't put the same topic twice on one platform in a week unless it's their
     top-ranked topic.
   - Exactly one slot in the week is a `test`.

4. **Save.** Add each new idea to the `content-log` (the `post-ideas` line format) with the status
   `planned <yyyy-mm-dd>`, and set accepted ideas you used to `planned <yyyy-mm-dd>` too. If they
   move or drop a slot, update its line. A lasting preference ("never post on weekends") goes
   into the `brand-profile`.

## Output

One line per post, in date order:

```
🗓️ Your week · Mon 28 Sep – Sun 4 Oct

Mon 28 Sep · 08:00 · LinkedIn · text post · "You're undercharging, here's proof." · pricing
   why then: your Mon/Tue posts: 3.0% median vs 2.1% other days (n=14); 08–10h: 1.4x (n=11)
Wed 30 Sep · TikTok · video · "I tried 3 invoicing apps." · tools · test
   why then: no timing data yet
Thu 1 Oct · 18:00 · Instagram · carousel · "5 signs a client will ghost you." · client work
   why then: your Thursday posts led on reach (n=7, directional); 18–20h: 1.3x (n=5, directional)
...

⚠️ Last Buffer sync was 12 days ago (2026-09-16), so these picks may be behind.
Cadence: 2/week per platform (a default, tell me yours)

Want a script for any of these? Reply with the day.
```

Before sending:

- Post count per platform matches the cadence from the `brand-profile` or the stated default.
- Each hook is an opening line the creator could post as is. Exactly one slot is `test`.
- "why then" cites `platform-<x>` or `post-log` for the day and, when given, the time, or says
  "no timing data yet".
- Freshness: one line when the last sync is stale or Buffer isn't connected ("⚠️ Buffer isn't
  connected, so this plan runs on your profile, not your numbers"). Drop the line otherwise.
- Cadence line only when a default was used.
- The script offer closes the message, and nothing else is asked.
