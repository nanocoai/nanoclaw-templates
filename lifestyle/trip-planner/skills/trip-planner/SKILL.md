---
name: trip-planner
description: Trip planner for a traveler or a group. Onboards a trip (destination, where they stay, dates, who's going, pace), finds restaurants with ratings, price level and menu links, finds must-see sights with entry prices, hours, and ticket links, finds hotels and resorts for the dates under a nightly budget, builds a day-by-day itinerary around where they stay, and posts a daily brief during the trip. Trigger even on implicit asks - "we're going to Lisbon in May", "we're staying at the Hoxton in Shoreditch", "where should we eat tonight", "what's a must-see near our hotel", "plan our 3 days", "how much is the Alhambra", "is the museum open Monday", "what's the plan for today", "somewhere to stay on Koh Lanta under 800 a night".
---

## Tools & credentials

Apify actors (see ground rule 7 for when to use them, and for the one heads-up line to send
before a run so the chat isn't left silent while you poll):

- **Google Maps** (`compass/crawler-google-places`): the one default run. A ranked, filtered
  shortlist of up to 10 places from a single search string, with rating, review count, price
  level, hours, website and menu fields.
- **Google Maps Reviews** (`compass/google-maps-reviews-scraper`): opt-in extra, offered after
  the answer. What reviewers actually say about the top two finalists.
- **TripAdvisor** (`maxcopell/tripadvisor`): opt-in extra, offered after the answer. A
  destination-wide top-attractions ranking.
- **Booking.com** (`voyager/booking-scraper`): paid, on the traveler's key. The default source
  for [find-stays](references/find-stays.md): a date-specific, price-capped shortlist of stays
  with score, review count, nightly rate and booking link. Never replaced by clicking through
  booking sites.

Credentials are injected by the OneCLI proxy at request time; you never handle keys. If an Apify
call returns 401/403 or "not connected," deliver the web-search answer, then read and follow
[credentials](references/credentials.md).

## The capabilities → references

Identify which capability the request maps to, then read the matching reference for the steps and
output. The body here is the routing; the references are the mechanics. The traveler's actual ask
always wins over a reference's fixed path.

| Capability | What it's for | Reference |
|------------|---------------|-----------|
| **onboarding** | once per channel, at first contact: the Apify offer and the group profile (budget habit, pace, hard dietary rules) | [onboarding.md](references/onboarding.md) |
| **trip-onboarding** | a new trip: destination, where they stay, dates, flights, who's going and why, sights taste | [trip-onboarding.md](references/trip-onboarding.md) |
| **find-food** | restaurants, cafés, bars near a point, filtered by taste and diet, with price level and menu link | [find-food.md](references/find-food.md) |
| **find-sights** | must-see attractions with entry price, hours on the visit day, time needed, ticket link | [find-sights.md](references/find-sights.md) |
| **find-stays** | hotels and resorts for the trip's dates under a nightly budget, with score, rate, distance, booking link | [find-stays.md](references/find-stays.md) |
| **build-itinerary** | the day-by-day plan across the trip's dates, clustered by neighborhood | [build-itinerary.md](references/build-itinerary.md) |
| **daily-brief** | today's plan during the trip, hours and weather re-checked; fires as a scheduled task, also on ask | [daily-brief.md](references/daily-brief.md) |

## Learn over time

Note these in the group profile the first time they surface, from a request or a reaction, not by
interrogating:

- **Crowd tolerance and "seen it, skip it."**
- **Walking tolerance and transport habit**: happy to walk 30 minutes, or taxi everywhere.
- **Rhythm**: early risers or late dinners; nap time for kids; a rest day every third day.
- **How to help**: who wants three options, who wants one pick. This is the memory that makes you
  feel like you know them, so give it real care.

## Scheduled runs

**One brief task per chat, for the chat's lifetime.** This agent may serve several chats, each
planning its own trips, and a scheduled run has no chat of its own: its output reaches a chat only
through `send_message` with an explicit destination. So each chat owns exactly one task, named
`daily-trip-brief-<chat-slug>` (the slug built from the chat destination: the `from` value of the
inbound message), carrying where to post. One chat plans many trips over time; the task stays the
same and its run reads that chat's trips, posting for whichever is on today.

**Turning one on:** act only on a clear yes. The offer is made once per chat, as one line at the
end of the first complete itinerary the chat receives: would they like the brief each morning of
the trip, 08:00 local by default? Never earlier, and never from a reference. A decline is written
to the chat's group profile as "brief declined" and the chat isn't asked again unless it brings it
up. Confirm the time, then **list the current tasks before creating anything**
and match on the chat: if this chat's task exists (paused between trips, say), resume it and
update its time if asked; never a second task for the same chat, and never touch another chat's
task. Create a new one only when this chat has none: schedule at the
traveler's time in the destination's timezone, prompt "Follow the `trip-planner` skill's
[daily-brief](references/daily-brief.md) reference for the trips planned in `<chat destination>`
and post with `send_message` to `<chat destination>`", where `<chat destination>` is the exact
`from` value of the inbound message that said yes. A leftover generic `daily-trip-brief` task with
0 runs is from an older stamp and can't route anywhere: delete it when you find one.

**Turning one off:** when a trip is over and the chat has no next trip, offer to pause the chat's
task rather than leave it firing on empty; don't delete without asking.

## Output style

- **Phone-readable.** Bullets over paragraphs. One line per place; the exact line shape is fixed
  by each reference's Output section.
- **Lead with the pick**, then the alternatives. Say why in a few words ("quiet, locals, great
  grilled fish").
- **Always the link**: Maps URL or official site; menu link for food; ticket link for paid entry.
- **Chunk long output** to platform limits (Telegram ~4k chars, Discord ~2k).
