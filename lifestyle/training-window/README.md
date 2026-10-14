# Training Window Finder Agent Template

A NanoClaw agent template that finds the best hour(s) today (and tomorrow, on
request) to train outside — not just the temperature, but heat and humidity,
UV exposure, and air quality combined into one score, hour by hour.

Who it's for: runners, cyclists, walkers — anyone who's stood at the door
wondering whether now is a good time to go outside, or guessed wrong and paid
for it with a miserable, high-heart-rate workout.

## What it does

- Resolves your location and pulls hourly forecast and air-quality data for
  today (and tomorrow, if asked) from Open-Meteo.
- Scores every daylight hour on heat/humidity (using apparent temperature and
  dew point — the numbers that actually predict how hard a workout will feel,
  not just the thermometer), UV index, and air quality (US AQI).
- Surfaces the single best contiguous window to train and the worst stretch
  to avoid, each with the real numbers and the factor that drove the call.
- Says plainly when a data point isn't available (e.g. no air-quality grid
  coverage for the location) instead of glossing over it, and says plainly
  when no window today is actually good rather than rounding up.

## What it deliberately doesn't do

- **Doesn't know you.** It scores conditions, not personal fitness level, heat
  acclimation, or hydration status — the call is yours.
- **Doesn't plan a route.** No shade, elevation, or wind-tunnel-street
  awareness — this is a conditions check, not a route planner.
- **Doesn't rely on stale general climate knowledge.** Every number in the
  report comes from a live fetch made during the session — "it's usually
  cool there in the mornings" isn't a substitute for today's actual forecast.
- **Doesn't require any account or API key** — see Credentials below.

## Layout

NanoClaw stamps an agent from the parts of this folder its plugin reader
loads (`skills/` and the `ai.nanoco.nanoclaw/` extension dir); `README.md` is
not one of them. This template ships no `mcp.json` — it needs none.

```
training-window/
├── plugin.json                       # Agent Plugins manifest
├── ai.nanoco.nanoclaw/
│   └── context/
│       └── instructions.md           # persona + operating principles
├── skills/
│   └── training-window/
│       ├── SKILL.md                  # entry: fetch + scoring + report flow
│       └── references/
│           ├── scoring.md            # heat/humidity/UV/AQI thresholds
│           └── report-format.md      # verdict + report structure
└── README.md                         # this file
```

## Credentials

**None required.** Every source this template uses is a public,
unauthenticated endpoint:

| Source | Host | Auth | Notes |
|--------|------|------|-------|
| Open-Meteo Geocoding | `geocoding-api.open-meteo.com` | none | resolves a place name to lat/lon |
| Open-Meteo Forecast | `api.open-meteo.com` | none | free for non-commercial use, no registration |
| Open-Meteo Air Quality | `air-quality-api.open-meteo.com` | none | free for non-commercial use, no registration |

Open-Meteo's free tier covers personal, non-commercial use with no signup and
no key; see [open-meteo.com/en/pricing](https://open-meteo.com/en/pricing) if
you ever need commercial-scale volume. Because nothing here needs
OneCLI-managed credentials, this template works immediately on stamp with
zero setup.

## Testing locally

```bash
mkdir -p <nanoclaw>/templates/lifestyle
cp -R lifestyle/training-window <nanoclaw>/templates/lifestyle/
ncl groups create --template lifestyle/training-window --name "Training Window Test"
```

Re-copy after every edit — the stamp reads the copy, not this clone.
