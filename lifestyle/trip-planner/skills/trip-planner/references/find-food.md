# Find Food

Restaurants, cafés, and bars near a point, filtered by the traveler's tastes and diet, with the
price level and a menu link. The point defaults to where they stay; a named landmark or
neighborhood overrides it ("lunch near the Alhambra").

Apify enters only for a shortlist across a neighborhood, and you say so in one line. One Maps run
is the whole answer; the reviews actor is an extra you offer afterwards.

## Steps

1. **Ground.** Read the group profile (diet, dislikes, budget, cuisines) and the trip (stay
   location, who's going this time, the occasion, the day and meal in question). Verify the weekday
   with code.

   **Ask before you search.** If the profile has no food taste yet (cuisines, sit-down vs. street,
   local-only vs. anything good), ask one open question first and wait, then store the answer in
   the profile. A single-meal ask from a group with a known taste skips this.

2. **Web search** for candidates: "best <cuisine> <neighborhood>", local food blogs and papers,
   the venues' own sites. Then **one lookup per candidate** to fill the output line: the venue's
   own Google Maps page (search "<name> <city> google maps") for rating, review count, price
   level, hours and address. Drop anything that hits a dislike or dietary rule. For a single
   pick, skip steps 3 and 4.

3. **Shortlist sweep (Apify, only when asked for a shortlist or a ranked list).** This one run is
   the whole default answer. Run `compass/crawler-google-places` **once** with:
   - `searchStringsArray`: exactly **one** broad string from profile + ask ("seafood restaurant");
     each entry is a separate crawl, so never several
   - `locationQuery`: the stay address, or "<landmark>, <city>"
   - `maxCrawledPlacesPerSearch`: 10, `maxReviews`: 0, `maxImages`: 0
   - `language`: the traveler's
   Filter: rating ≥ 4.3 and `reviewsCount` ≥ 100 (relax both when the area is thin), drop
   dislikes, check `openingHours` against the target day. Rank by rating × log(reviews), then
   proximity. Keep the top 5 to 8. Push the sweep to a subagent (ground rule 9).

4. **Review digest (Apify, opt-in, after the shortlist is delivered).** Once the shortlist is
   sent, offer in one sentence to dig into what reviewers say about the top two. Only if they say
   yes: run `compass/google-maps-reviews-scraper` on at most 2 places with `maxReviews` 15, newest
   first. Distill to one line each: what reviewers praise, what they complain about, any "book
   ahead" or "cash only" warnings.

5. **Menu and price link.** Web search "<name> menu" and prefer the venue's own menu page; the
   actor's `menu` field, then `website`, are fallbacks. Note the price level (`$`–`$$$$` or the
   actor's `price`) and, when a menu shows it, a typical main's price with currency.

6. **Distance.** A rough walk or transit time from the stay location (one web search or the
   actor's coordinates). Nudge-level, not an ETA.

7. **Save** the shortlist to the trip concept with the source of each entry. After they pick or
   react, update the profile (a new liked cuisine, a dislike confirmed).

## Output

**This shape and no other.** One line per place with every field, whether the place came from
web search or an actor. Translate the words into the chat's language; keep the structure.

```
🍽️ <meal>, <weekday> <date>, near <stay / landmark>

Pick
- <name> · ★<rating> (<n>) · <price level> · <cuisine> · <walk/transit> · menu: <link> · <maps link>
  <one-line why, and any warning: book ahead / cash only / closes 15:00>

Also good
- <name> · ★<rating> (<n>) · <price level> · <cuisine> · <walk/transit> · menu: <link> · <maps link>
- ...

<one line: "from web search" or "shortlist via Google Maps (10 places)"; after an opt-in digest, "reviews for the top 2 via Google Maps">
```

Before sending, check every line; fix the line rather than dropping the field:

- `<maps link>` is a Google Maps link for the venue, else its website with a note on the line.
- `menu:` is the venue's menu page, else its website, else "menu: check on site".
- Rating and count come from the place page or the actor. If neither confirmed them, write the
  line without them; never invent a number.
- Price level and walk/transit from the stay are on every line; unknown price reads "check on site".
- The "why" line names something specific (a dish, the room, the crowd), not "great food".
