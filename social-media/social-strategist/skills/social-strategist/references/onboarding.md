# Onboarding

Connect Buffer first, then four short questions, then a first look at their real numbers, then
one offer.

## Steps

1. **Ground.** An existing `brand-profile`? Don't re-onboard: confirm it in one line, ask what
   changed.

2. **Connect Buffer.** Run the `credentials` reference's "Connect it", including its
   no-dashboard and "later" paths; its question, if it needs one, is this step's. Once Buffer
   lists their channels, save each channel to the `brand-profile` as the platforms. There is no
   platforms question: Buffer answers it.
   - **Skipped or can't connect**: go on to step 3 anyway, skipping questions 1 and 2; step 4
     covers the rest.

3. **Ask four things**, in order. The first says they can skip any.

   1. **Posts lookback**: how many days of posts to pull, each with its own numbers (suggest 90).
   2. **Totals lookback**: how many days of overall likes, comments, reactions and impressions to
      pull per platform (suggest 365; Buffer's maximum is 365, so a bigger answer becomes 365,
      said as such).
   3. **Niche and audience, in one line**: what they post about and who it's for.
   4. **Goal**: grow, leads, community, or brand, as a short menu; map a free-form answer to the
      closest one and say which you picked.

   Save each answer to the `brand-profile` as it arrives (the lookbacks go in its `lookback`
   field), so a dropped conversation keeps what it got. A skipped lookback takes its suggestion;
   a skipped goal defaults to `grow`; each is stated as an assumption they can change.

4. **First look: show value before the chat ends.** Send the heads-up line, then backfill:
   - **Posts**: the posts window from each channel, fetched as the router's Tools → Buffer says.
     Tag each (topic, hook style) and log it (the `post-log` format is in
     `additional_context/memory-structure.md`).
   - **Totals**: per channel, the aggregated post metrics for the totals window, saved to that
     `platform-<x>` with its date range.
   - Record today as the profile's `last sync`.

   Then run the `engagement-analysis` reference for the platform with the most posts in the
   window, and send its output. **No posts in the window** (or Buffer skipped): run
   the `post-ideas` reference for their main platform, capped at 3 ideas, plus one line: the
   ideas sharpen once Buffer shows how their posts do.

5. **Offer the two recurring runs, together, as one question.** Right after the first look, in
   plain words (never "task", "cron" or "paused"): each Monday morning the week's content plan,
   and each morning a quick check for new posts they published. Give the default times and ask
   one thing: keep them, change them, or skip.
   - **Yes (or a new time)**: verify the day and time with code, list the current tasks, update
     the schedule of `weekly-content-plan` (default Monday 09:00) and `daily-post-check`
     (default every day 10:00) to match, and resume both. Never create duplicates.
   - **One but not the other**: resume only that one.
   - **Skip**: leave both off.
   - **Later**, if they ask to stop either run, pause it; don't delete without asking.

6. **Save** the outcome in the `brand-profile` so it's never offered again:
   `weekly plan: on, Mon 09:00 · daily post check: on, 10:00 · <yyyy-mm-dd>` (or
   `weekly plan + daily post check: declined · <yyyy-mm-dd>`). The first look saves itself
   through the references it ran.

## Output

One message per step, the question last. The Buffer connection messages are the `credentials`
reference's.

Connected:

```
✅ Buffer connected. I can see: LinkedIn (Jane Doe) · Instagram (@jane.makes) · TikTok (@janemakes)
```

Question 1 (sent right after the connected line, same message):

```
A few quick questions, skip any you like.

How many days of posts should I pull, each with its own numbers? (90 is a good start)
```

Question 2:

```
And for your overall numbers (likes, comments, reactions, impressions), how many days back?
(365 is the most Buffer gives)
```

Question 3:

```
In one line: what do you post about, and who's it for?
(e.g. "pricing tips for freelance designers")
```

Question 4:

```
What's the main goal right now?
- grow: more views and followers
- leads: clients, sales, sign-ups
- community: people who comment and share
- brand: be known for your topic
```

Heads-up before the backfill:

```
Pulling your last <n> days from Buffer, this takes a minute or two.
```

Offer:

```
Two things I can do on my own, if you want:
- each Monday at 09:00: this week's plan, which post goes where and when
- every day at 10:00: check for posts you published and log how they're doing

Keep those times, change them, or skip?
```

Before sending:

- The first question says they can skip.
- The connected line lists every channel Buffer returned, network and handle.
- The offer names both runs, their default day and time, and nothing about tasks or schedules.
