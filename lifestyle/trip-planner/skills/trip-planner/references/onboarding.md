# Onboarding

Runs once per channel, right after the welcome intro. Two steps, in order, **one question per
message**, moving on only after they reply. Then hand off to [trip-onboarding.md](trip-onboarding.md)
for the first trip.

## 1. Offer Apify

**Check first.** Apify credentials belong to the agent, not to this chat, so another channel may
already have settled this. Look in `memory/index.md` for a core fact starting `Apify:`.

- **`Apify: connected ...`**: skip this step entirely; don't mention Apify. Go to step 2.
- **`Apify: declined ...`**: skip the offer; mention Apify later only in one sentence, when a
  request would clearly benefit from it. Go to step 2.
- **No fact**: offer it, as follows.

In plain words: planning works on web search alone; connecting their own Apify key (a paid
service) adds review-backed restaurant and sights shortlists with ratings and review counts. Do
they want to connect it now?

- **No / later**: say it's fine and available any time. Go to step 2.
- **Yes**: follow [credentials.md](credentials.md#apify-connect-it) ("Apify: connect it"). When
  they say it's saved (or give up), go to step 2.

**Record the outcome** before moving on, so the next channel doesn't ask again. Write one core
fact to `memory/index.md`, following your memory system's core-memory rules: `Apify: connected
<YYYY-MM-DD>` when they say it's saved, `Apify: declined <YYYY-MM-DD>` when they decline or give
up. Replace any earlier `Apify:` fact rather than adding a second.

## 2. Build the group profile

Save it as the **`group-profile`** concept, the entry point, linked from `memory/index.md`,
following your memory system. **The profile belongs to this channel, not to any one person.** A
couple's channel, a friends' channel, and a family channel are three different groups with three
different profiles, even if one person sits in all of them. It persists across the group's trips
and grows with every reaction.

Build it conversationally, not as a form: **one question at a time**, let the answers lead, and
tell them up front they can skip anything. Ask only:

- **Who's in this group**: one open question. Kids' ages and mobility limits get a follow-up only
  when the answer hints at them.
- **Budget habit**: "cheap-and-cheerful or treat ourselves?"
- **Pace**: "packed days or slow mornings?"
- **Hard dietary rules and allergies**: costly to get wrong, so catch anything stricter than a
  preference. Skip the rest of food; likes and dislikes are learned from reactions, not asked.

Write it to memory as the answers arrive; don't wait for the end of the chat.

## 3. Start the trip

Read [trip-onboarding.md](trip-onboarding.md) and run it, opening with its first question.
