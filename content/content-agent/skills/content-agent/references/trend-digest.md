# Trend Digest

What's rising in the creator's niche. Runs for any creator, no competitor list
needed. 

**Link everything you reference.** Every Reddit post, YouTube video, article, or claim
in the digest carries its own direct source link. No unlinked references, ever.

## Steps

1. **Load the profile** (`creator-profile.md` from your workspace; if it's missing,
   onboard first via `references/content-onboarding.md`).
2. **Check for big industry news first** (Exa): it leads the digest, so hunt for it up
   front: a platform or algorithm change, a new format push. Search both the open web
   and the platform itself, across every platform the creator named, and **especially
   the hero outlet**. Only surface a change if it's verified; a post from the
   platform's own account (e.g. on x.com) beats second-hand coverage. Nothing verified
   → skip it.
3. **Query Apify** (inside the platforms): run the Actor for each source named in the
   profile's **Where to scrape** list, filtered to the profile's **keywords**, over
   the window (default last 2 weeks).  
   - **Reddit Actor**: pull from the named subreddits filtered by keyword; sort by
     top/hot; grab posts with upvote and comment counts. *Only if the creator
     explicitly asks*, pull Reddit via the public JSON endpoint
     (`reddit.com/r/{sub}/top.json`) instead. No key needed, but there's no
     server-side keyword search (fetch top, filter yourself), and it's rate-limited.
     Apify stays the default.
   - **YouTube search Actor**: search the named channels/terms; pull recent videos
     with view/like counts.
   - **Instagram / X / TikTok Actors**: matching Actors exist for each, use whichever
     fits the creator's named sources and hero platform. Run the same research pattern.
     Each platform works differently, so stay flexible, adapt to whatever that Actor
     exposes; what matters is getting the signals.
   Some sources are small and may have nothing new this window (a tiny subreddit without
   much going into it). That's fine: skip them, and never pad the digest to fill space.
4. **Query Exa** (across the open web): search the niche's core terms for recent
   articles and blog posts over the same window. This catches what's rising
   *around* the platforms: coverage, discourse, and sub-topics the Actors miss.
   Prefer recent, on-beat sources.
5. **Read the signal.** Tag each hit as one of: *recurring question*, *emerging
   format*, *fresh pain point*, or *rising sub-topic*. For the strongest hits, also
   note the **pain point**, **who's feeling it** (audience insight), and **how urgent**
   it is; this is the raw material the angle menu draws on.
6. **Cluster & dedupe** the hits into themes; merge Apify and Exa hits on the same
   theme into one item, keeping the strongest source. **A theme showing up across
   several sources is the strongest signal it's real**, so flag those as cross-source.
7. **Rank** by momentum (engagement × recency) × fit to the beat,
   giving extra weight to cross-source themes. Drop off-beat and no-go themes, and note
   what you dropped for the skip list.
8. **Angle menu**: for the top themes, 1-2 directions on the creator's beat. 
9. **Output** (below), then hand the choice back.

## Output

```
# Trend Digest: <niche> (<window>)

## Industry watch  (top, only if verified; skip the section if nothing found)
- <platform/algorithm news + one line on what it means> | source: <link>
  Once you know the creator, you may offer a pivot here, as an option, never a directive.

## What's rising  (5-7, ranked)
1. <theme> | <why it's rising, one sentence> | signal: <type> | seen in: <sources, note if cross-source> | links: <links>
2. ...

## Questions people are asking
- <a straight-up question the posts keep raising> | <where it showed up>

## Angle menu  (raw material: pick, don't paste)
- On <theme>: <direction A>, <direction B>
  Directions on your beat. Make them yours.

## Skip list
- <what you filtered out>: <why>
```
