# Monitor the Beat & Build the Digest

Surface story-worthy items from the beat, on demand or as the scheduled
morning digest.

## Steps

1. **Load**: the beat profile and the two most recent files in
   `/workspace/agent/digests/`. Compare against them so the digest carries
   only new items; a story already surfaced returns only if it materially
   developed.

2. **Web sweep first (it's cheap)**: news search per watchlist entry
   and beat keyword, plus one broader search per "specific angle".
   Both MUST be from the last 24–48h; anything older is out, no
   exceptions, and a result with no visible date is treated as old.
   When a watchlist entry is a site, scope the search to that
   domain to catch its new publications. Search the journalist's market
   and language first: favor the outlets the profile lists as their
   regular reads before generic international coverage. Pull full content
   only for top candidates.

3. **X sweep (capped: ≤5 queries, ≤100 results each)**: search recent posts
   for watchlist people/topics. Prefer high-engagement original posts over
   retweets. If the sweep is unavailable (not connected, or the Apify plan
   blocks the actor), deliver the web-only digest and note the gap in one
   line; never fail the digest over it.

4. **Rank** each candidate:
   - Beat fit: a miss here kills the item regardless of buzz
   - Freshness / development since last digest
   - Momentum: engagement, multiple independent voices, who's driving it
   - Story potential: an angle this journalist could own; prefer
     underreported over crowded

5. **Output** (max 10 items, best story first). Each item follows this
   skeleton, filled with the item's own content:

   ```
   <Headline, in your words, not the source's>
   Why it matters: <1–2 sentences tied to this beat>
   Source: <link(s)>
   Angle: <suggested angle> · <coverage: already widely covered, or underreported>
   ```

   Plain news language throughout: headlines state the fact, and nothing
   in an item uses jargon or invented shorthand the journalist would have
   to decipher.

   Close with anything notable you filtered out, and give each filtered
   item its source link too. If a sweep returns nothing new, say so; never
   pad to reach a count.

6. **Persist** to `/workspace/agent/digests/YYYY-MM-DD.md`.

Next, if an item becomes a story → `references/find-sources.md`
