# Competitor Watch

What's landing for the creator's named competitors, and the gaps they leave open. When you find relevant data to share, please provide a link or source. 

## Steps

1. **Load the profile** (`creator-profile.md` from your workspace): competitor handles or names, platform. Confirm which social medias the user wants the bot checking (e.g., competitor A's X or YouTube)
2. **Pull each competitor's recent posts** (Apify): for every handle, run the
   platform Actor (e.g. a YouTube channel Actor); pull posts with engagement. **Default
   window: since the last run (first run: last ~2 weeks).** Pull only posts newer than
   what's already in the baseline; if the creator wants a specific timeline, go with
   that, but otherwise always keep the digest current and new.
3. **Scan for big moves** (Exa, light touch): search each competitor's name only for a
   *major* off-platform move: a launch or a big partnership. When you spot one, flag it
   in the digest's **Heads up** section so the creator can expect the content campaign
   that'll follow and get ahead of it.
4. **Find the overperformers**: for each competitor, take their **baseline** (median
   engagement across their posts). On a competitor's **first run**, base it on a small
   batch of 10-20 recent posts, and call this out as a rough first pass. **Save it and
   grow it each run** (keep a per-competitor baseline in your workspace,
   `baselines/<competitor>.md`), folding in new posts so the baseline sharpens over
   time. Flag the posts that clearly beat it, and name the pattern behind it (format,
   topic, angle).
5. **Read the rhythm.** Across competitors, note posting cadence, format mix, and
   **gaps**: topics they keep circling, or angles none of them cover.
6. **Rank** the takeaways to 5-7, weighted to the creator's beat; note what
   you cut for the skip list.
7. **Angle menu**: directions on the *gaps* the creator could own. Raw material.
8. **Output** (below), then hand the choice back.

## Output

```
# Competitor Digest: <competitors> (<window>)

## Heads up  (only if a big move surfaced)
- <competitor>: <the launch/partnership + the campaign to expect> | source: <link>

## What's landing  (5-7, ranked)
1. <competitor>: <what worked + the pattern> | signal: <format/topic/angle> | sources: <links>
2. ...

## Cadence & format
- <competitor>: <how often, what formats>

## Gaps to own
- <topic or angle nobody covers>

## Angle menu  (raw material: pick, don't paste)
- On <gap>: <direction A>, <direction B>

## Skip list
- <what you filtered out>: <why>
```
