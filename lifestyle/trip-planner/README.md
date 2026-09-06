# Trip Planner Template

A NanoClaw agent template for planning trips. Tell it where you're staying, when, and what you
like; it finds restaurants backed by real reviews (with price level and menu links), the sights
worth the trip (with entry prices, hours, and ticket links), builds a day-by-day itinerary around
your base, and posts a short brief each morning of the trip.

It plans from **web search by default**. Apify (a paid service, your own key) is an optional
extra for review-backed shortlists; see the cost note below.

## Layout

```
trip-planner/
├── plugin.json                     # Agent Plugins manifest (marks the folder as a plugin)
├── mcp.json                        # MCP server (Apify: Google Maps, Reviews, TripAdvisor): placeholder env value, no secrets
├── ai.nanoco.nanoclaw/
│   └── context/
│       └── instructions.md         # the agent's standing brief (NanoClaw extension dir)
├── skills/
│   ├── welcome/
│   │   └── SKILL.md                # first contact: intro, optional explanation, then onboarding.md
│   └── trip-planner/               # one skill: routes each ask to a capability below
│       ├── SKILL.md
│       └── references/
│           ├── onboarding.md       #   once per channel: optional Apify, group profile, then the first trip
│           ├── trip-onboarding.md  #   one concept per trip: stay, dates, flights, party, occasion
│           ├── find-food.md        #   restaurants near a point: reviews, price level, menu link
│           ├── find-sights.md      #   must-sees: entry price, hours, time needed, ticket link
│           ├── build-itinerary.md  #   day-by-day plan clustered by neighborhood
│           ├── daily-brief.md      #   today's plan, hours and weather re-checked
│           └── credentials.md      #   connecting the Apify key via OneCLI (read on auth errors)
└── README.md                       # this file
```

## Stamp an agent from this template

```bash
ncl groups create --template lifestyle/trip-planner --name "Trip Planner"
```

Then wire it to a channel as usual (`/manage-channels`). On first use the agent gets to know you
in a short chat: destination, where you're staying (a specific address is best), dates, who's
going and the occasion, budget and pace, hard dietary rules, the morning brief time, what kind of
trip it is. It stores one profile per connected
group (a different channel is a different group with its own tastes) that persists across that
group's trips, and one record per trip with its own party, occasion, stay and dates; likes and
dislikes are learned from your reactions, not a questionnaire.

## What it does

| Capability | Ask it |
|------------|--------|
| Onboard a trip | "We're in Lisbon 12–16 May, staying at the Hoxton in Baixa" |
| Find food | "Where should we eat tonight, walking distance, no seafood" |
| Find sights | "What's a must-see near us? How much is the Alhambra, and is it open Monday?" |
| Build the itinerary | "Plan our three days, slow mornings" |
| Daily brief | Fires each morning of the trip; or "what's the plan today" |

Every recommendation carries a link (Google Maps or the official site), a menu link for food, and
a ticket link plus price for anything with an entry fee. Prices are read from the venue's own page
and dated; unknown means "check on site," never a guess.

## The daily brief (scheduled task)

The template ships no task: stamping never starts background work without consent. Instead the
agent creates **one task per chat** the first time that chat says yes (offered once, after the
first complete itinerary), named `daily-trip-brief-<chat-slug>`, scheduled at your time in the
destination's timezone, and pinned to the chat that asked. That matters because one agent can
serve several chats, each planning its own trips: a scheduled run has no chat of its own, so each
task carries where to post. The chat keeps that one task for all its trips and is asked only once;
a decline is remembered on the chat too. Each run posts today's plan for whichever of the chat's trips is
on, and nothing when none is. See what's running and pause a chat's brief between trips with:

```bash
ncl tasks list --group <agent-group-id>
ncl tasks pause <task-id>
```

Or just ask the agent; it offers to pause on a trip's last day when no next trip is planned.

## Credentials: via OneCLI

**No API keys live in this template.** The OneCLI gateway holds credentials in its vault and
injects them into outbound HTTPS calls at the proxy boundary. [mcp.json](mcp.json) carries `command` +
`args` and never a real key.

**Exception: Apify's placeholder env (leave it as-is).** `@apify/actors-mcp-server` needs
`APIFY_TOKEN` to be *present* to boot, so `mcp.json` sets it to the dummy value `"placeholder"`.
It is not the credential: once you connect Apify, the real token is injected automatically for
`api.apify.com` at request time. Never replace it with a real token.

Register the secret in the OneCLI web UI (usually **http://127.0.0.1:10254**). Or say yes when the
agent offers Apify at first contact: it asks for your OneCLI URL and hands you a prefilled connect
link; it does the same the first time a call fails:

| Service | API host to match | Auth style*             | Where to get the key                              |
|---------|-------------------|-------------------------|---------------------------------------------------|
| Apify   | `api.apify.com`   | `Authorization: Bearer` | console.apify.com → Settings → API & Integrations |

\* Confirm the exact header against the provider's current API docs when you configure the vault
entry.

### Apify cost note

[Apify](https://apify.com) is a **paid service**; you bring your own key. The agent treats it as
an escalation, not the default: it plans from web search and calls an actor only for a ranked
shortlist of many places, saying why each time. A normal question triggers at most one actor run
(a Google Maps search); the review digest and the TripAdvisor ranking are offered afterwards and
run only if you say yes. Runs are capped (≤ 10 places per Google Maps search, one search string
per run, ≤ 15 reviews per place on at most 2 places, ≤ 20 TripAdvisor items) and the scheduled
brief never calls an actor.

- **Google Maps Scraper** (`compass/crawler-google-places`) runs on Apify's **free tier** at
  these caps.
- **Google Maps Reviews Scraper** (`compass/google-maps-reviews-scraper`) and **TripAdvisor
  Scraper** (`maxcopell/tripadvisor`) are **pay-per-result**; on the free plan the token
  authenticates but the actor may decline to run, so expect to need a **paid Apify plan**.

Without Apify connected at all, every capability still works on web search; you lose only the
review-count rankings. Run one shortlist, check the run cost in the Apify console, then decide.
