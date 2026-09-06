# Find Sights

Must-see attractions for the destination or a part of it, each with entry price, hours on the
visit day, time needed, distance from the stay, and the ticket link.

Apify enters only when web results are listicle noise or the traveler wants a ranked list with
review counts, and you say so. One Google Maps run is the whole answer; TripAdvisor is an extra you
offer afterwards.

## Steps

1. **Ground.** Read the profile (sights taste, crowd tolerance, kids, mobility) and the trip (stay
   location, dates). Verify the weekdays with code.

   **Ask before you search.** If the profile has no sights taste yet, or this trip's occasion
   differs from what the profile was learned on (a bachelor weekend is not the family trip), ask
   one open question first and wait: what kind of trip is this for them, e.g. museums and history,
   food and markets, nightlife and parties, nature and viewpoints, beach and rest, or a mix. Hard
   no's ("no museums", "no churches") usually come with the answer; if not, one follow-up. Store the
   answer: group habit in the profile, this-trip exception on the trip. Search only for what they said yes to; "no museums" means zero museums
   in the candidates, not one "just in case".

2. **Web search** for the destination's must-sees: official tourism site, a couple of reputable
   guides, and "<destination> things to do <month>" for seasonal ones. Build a candidate list of
   10 to 15, searching for the categories they asked for ("<destination> nightlife", "<destination>
   rooftop bars", not only "things to do"). Drop what the profile says to skip ("seen it," "no
   museums").

3. **Per candidate, the venue's own page**: entry price with currency and any free/reduced
   categories, ticket or booking URL, opening hours (and closed days), typical visit length,
   "book ahead" or timed-entry notes. Record the page and the date you read it. If the official
   site doesn't state a price, say "check on site"; don't take a blog's number.

4. **Ranked list (Apify, only when needed).** One run, and it's the whole default answer: run
   `compass/crawler-google-places` once with a **single** `searchStringsArray` entry ("tourist
   attraction", or the more specific term they asked for: "museum", "rooftop bar"),
   `locationQuery` the destination, `maxCrawledPlacesPerSearch` 10, `maxReviews` 0. Use its rating
   and review count to order the list; keep the official site as the source for price and hours.
   Push a full-destination pass to a subagent (ground rule 9).

   **TripAdvisor (opt-in, after the list is delivered).** Offer once, in one sentence, to pull
   TripAdvisor's own top-attractions ranking. Only if they say yes: run `maxcopell/tripadvisor`
   once, `maxItems` 20, and send the differences against the list they already have.

5. **Distance and clustering.** A rough walk or transit time from the stay; note the neighborhood
   so [build-itinerary](build-itinerary.md) can group them.

6. **Save** the shortlist to the trip concept with sources. After a reaction, update the profile.

## Output

**This shape and no other.** One line per place with every field, whether it came from web search
or an actor. Translate the words into the chat's language; keep the structure.

```
🗺️ Must-sees for <destination>, staying near <stay>

- <name> · ★<rating> (<n>) · <price + currency, or "free"> · <hours on visit day> · ~<time needed> · <walk/transit> · tickets: <link>
  <one-line why; "book ahead" / "timed entry" / "closed <day>" if it applies>
- ...

Prices from each venue's site as of <date>. <"from web search" or "ranked via Google Maps (10 places)"; after an opt-in run, "ranked via TripAdvisor (20)">
```

Before sending, check every line; fix the line rather than dropping the field:

- Every line has price (or "free"), hours on the visit day, time needed, walk/transit from the
  stay, and a ticket link (else the official site, else the Maps place page).
- Price comes from the venue's own page; unknown reads "check on site", never a blog's number.
- Rating and count come from the place page or the actor. If neither confirmed them, write the
  line without them; never invent a number.
- The "why" line names something specific, not "iconic".
