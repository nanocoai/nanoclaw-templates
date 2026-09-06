# Find Stays

Hotels, resorts, and apartments for a destination or an area of it, for the traveler's actual
dates and budget, each with rating, price per night, distance to the place they care about, and a
booking link.

Apify is the default here, not the escalation: a date-specific, price-capped, ranked shortlist is
something web search cannot return, and it is the only source that gives a nightly rate without
opening booking calendars. One Booking.com run is the whole answer.

**Hard boundary: never drive a booking flow.** Selecting dates in a calendar, clicking "show
prices", retrying: that is slow, brittle, and has already cost this agent its container ceiling.
Reading a rates or listing page you found via search is fine. Without the actor, the answer is
still a price range per stay, from web search, marked unconfirmed; never "send me the number".

## Steps

1. **Ground.** Read the group profile (budget habit, anything about stay preferences: pool,
   kitchen, quiet, walkable) and the trip (destination, party, occasion). You need all of these
   before a run; ask for a missing one, **one question per message**, and store the answer on the
   trip:
   - the destination or area (an island, a neighborhood, "near <landmark>")
   - check-in and check-out dates; verify the weekdays with code
   - budget per night, with currency
   - who's sleeping there (adults, children, rooms)

2. **Shortlist (Apify).** Send the one heads-up line (ground rule 7), then run
   `voyager/booking-scraper` **once** with:
   - `search`: the destination or area as the traveler named it
   - `checkIn` / `checkOut`: `YYYY-MM-DD`
   - `adults`, `children`, `rooms`: from the party
   - `minMaxPrice`: `"0-<cap>"` in the traveler's currency, and `currency` set to that currency's
     code (ILS, EUR, USD)
   - `maxItems`: 20, `sortBy`: review score, `minScore`: `"8.0"` (relax when the area is thin)
   - `language`: the traveler's
   - never `startUrls` and never `extractAdditionalHotelData`
   Filter by the profile's stay preferences, drop anything with under 50 reviews when there is
   enough left, and rank by score × log(reviews), then by proximity to the area or landmark they
   named. Keep 5 to 8. Push the run to a subagent (ground rule 9).

3. **Distance.** A rough drive, walk or boat time from the area or landmark they care about (the
   actor's address and coordinates, else one web search). Nudge-level, not an ETA.

4. **Fallback when there is no actor** (not connected, declined, plan blocks it): web search
   "<area> hotels <month>" and the traveler's own candidates, then per stay search
   "<hotel> price per night <month> <year>": aggregator snippets, the hotel's own rates page,
   listing pages. One fetch of a page the search found to read the number is fine. **Every stay
   gets a range**, converted to the traveler's currency when they asked in one, e.g. "about
   180-240 EUR/night (~600-800 ILS), from web search, unconfirmed", plus its Booking.com or
   official-site link. A range marked unconfirmed is the floor; never a line without a price,
   and never "send me the number".

5. **Save** the shortlist to the trip with the source and date of each price. When they pick,
   record it as the trip's stay (it feeds every other capability) and note any stated preference
   in the profile.

## Output

**This shape and no other.** One line per stay with every field. Translate the words into the
chat's language; keep the structure.

```
🏨 Stays in <area>, <check-in> → <check-out> (<n> nights), under <cap + currency>/night

Pick
- <name> · ★<score> (<n>) · <price + currency>/night as of <date> · <type> · <distance to <landmark>> · book: <link>
  <one-line why, and any warning: breakfast not included / free cancellation until <date> / no pool>

Also good
- <name> · ★<score> (<n>) · <price + currency>/night as of <date> · <type> · <distance to <landmark>> · book: <link>
- ...

<one line: "rates via Booking.com (<n> properties) on <date>" or "ranges from web search on <date>, unconfirmed; the live rate is on each link">
```

Before sending, check every line; fix the line rather than dropping the field:

- Every line has a price per night in the traveler's currency. From the actor it is the run's
  price for their dates, dated; from web search it is a range marked "unconfirmed". No line
  ships without one, and no number you didn't see.
- `book:` is the Booking.com property page from the actor, else the property's official site.
- Score and count come from the actor. If they came from nowhere, write the line without them.
- Distance to the area or landmark they named is on every line.
- Nothing over the cap unless you say so on the line ("just over, worth it for X").
- The "why" line names something specific (the beach, the room, the breakfast), not "great
  resort".
