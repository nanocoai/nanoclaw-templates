# Daily Brief

Today's plan during the trip: the day's stops with hours re-checked, weather, and anything to
book for tomorrow. Fires each morning as the chat's scheduled task; runs on ask any time ("what's
the plan today"). It re-checks what's already planned and never runs an Apify actor.

**One chat, its trips.** On a scheduled run, the chat is the destination the task prompt names;
on ask, it's the chat asking. Read only that chat's group profile and the trips linked from it,
and post only to that chat.

## Steps

1. **Is one of this chat's trips on today?** Read the trips linked from the chat's group profile;
   verify today's date with code. Pick the trip whose dates contain today. If none does, post
   nothing and stop.

2. **Today's slots** from the saved itinerary. If none is saved, offer to build one instead of
   improvising a day.

3. **Re-check hours** for today's sights and restaurants (one web search each, the venue's own
   page): a surprise closure or a changed opening time is the brief's most useful line.

4. **Weather**: one web search for today's forecast at the destination; one line, plus a nudge only
   if it changes the plan (rain moves the viewpoint to tomorrow).

5. **Tomorrow's "book by"**: any timed-entry or book-ahead item on tomorrow's plan.

## Output

**This shape and no other.** A header plus one line per slot, never a paragraph narrating the day.
Translate the words into the chat's language; keep the structure.

```
Good morning! <weekday>, <date> in <destination>, day <n> of <total>.

☀️ <one-line weather>

Today · <neighborhood>
- Morning: <sight> · <price> · <hours today> · tickets: <link>
- Lunch: <restaurant> · menu: <link> · <walk from previous stop>
- Afternoon: <sight> · ...
- Dinner: <restaurant> · menu: <link>

⚠️ Heads up  (only if something changed)
- <closed today / hours changed / rain → swap>

Tomorrow
- book: <timed-entry item> by <time> · <link>
```

Before sending, check every line; fix the line rather than dropping the field:

- Each slot is its own line starting with the slot name. Two stops in one slot become two lines.
- Every sight line has today's hours (re-checked in step 3), price or "free", and a ticket or
  place-page link (`/maps/place/...`, never a search URL).
- Every restaurant line has a menu link (else "menu: check on site") and the walk from the
  previous stop (the brief is a route, so unlike the other capabilities it is not measured from
  the stay).
- A closure or changed hours goes in Heads up *and* the slot line reads the new state; don't leave
  the stale plan standing above the warning.
- Unknown values read "check on site", never a blank or a guess.

Drop any empty section. On the trip's last day, close with a one-line "safe travels".
