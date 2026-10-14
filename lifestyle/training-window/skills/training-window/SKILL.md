---
name: training-window
description: Finds the best hour(s) today or tomorrow to train/exercise outside, by scoring heat, humidity, UV, and air quality hour-by-hour, and flags the hours to avoid. Use whenever the user asks when to work out, run, cycle, walk, or go outside today, or asks about outdoor training conditions.
---

# Training Window Finder Agent

Given a location, pull hourly weather and air-quality data for today (and
tomorrow, on request), score each daylight hour for outdoor-training
suitability, and hand back the best window plus the hours to avoid — with
the real numbers behind each call.

## Tools & credentials

**No API keys or MCP servers needed** — Open-Meteo's geocoding, forecast, and
air-quality APIs are all public, free for non-commercial use, and need no
registration:

| Source | What it's for | Endpoint pattern |
|--------|----------------|-------------------|
| Open-Meteo Geocoding | resolve a place name to lat/lon | `GET https://geocoding-api.open-meteo.com/v1/search?name=<place>` |
| Open-Meteo Forecast | hourly temperature, apparent temperature, humidity, dew point, UV index | `GET https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,dew_point_2m,uv_index&forecast_days=2&timezone=auto` |
| Open-Meteo Air Quality | hourly US AQI, PM2.5, ozone | `GET https://air-quality-api.open-meteo.com/v1/air-quality?latitude=<lat>&longitude=<lon>&hourly=us_aqi,pm2_5,ozone&forecast_days=2&timezone=auto` |

Fetch these with the built-in `WebFetch` tool (or a direct HTTP call if the
runtime exposes one) — no `mcp__` tool declarations apply here. Full scoring
thresholds and response fields to read: `references/scoring.md`.

## Step 1: resolve the location

If given a place name, geocode it first. If the geocoder returns multiple
plausible matches (e.g. "Springfield"), ask a one-line clarifier rather than
guessing. If given coordinates directly, skip geocoding.

## Step 2: pull hourly data

Fetch the forecast and air-quality endpoints for the location, `timezone=auto`
so returned timestamps are already local, and `forecast_days=2` (today plus
tomorrow, so a "tomorrow" ask never needs a second round trip). Each fetch is
independent — if air-quality has no grid coverage for a remote location, note
that and continue with the forecast data alone.

## Step 3: score each hour

Read `references/scoring.md` for the exact thresholds. In short: score every
daylight hour (roughly local 5am-9pm) on heat/humidity, UV, and air quality,
then take the worst of the three as that hour's tier — **Great** / **OK** /
**Avoid**.

## Step 4: pick the window and report

Read `references/report-format.md`. Surface the best contiguous window for
each day the user asked about (today only, unless tomorrow was requested or
it's evening and today has nothing good left), plus the single worst window
to avoid — each with the real numbers and which factor drove the tier. Say
plainly when no window today clears "Great" rather than forcing a good-news
answer.

## Ground rules

- **Never guess conditions from general climate knowledge.** "It's usually
  cool there in the morning" is not a substitute for this session's fetch —
  conditions vary day to day and hour to hour.
- **A missing data point is not a good sign by default.** No air-quality grid
  coverage, a geocoding miss, a forecast gap — report each as "not
  available," never silently drop it.
- **The call is the user's.** This scores conditions; it doesn't know their
  fitness level, heat acclimation, or hydration status.

## Approvals

Runs automatically (no approval needed): all Open-Meteo fetches (geocoding,
forecast, air quality). This template has no credential-gated or destructive
actions at all.

## Output style

- **Result-first.** Lead with the best window, then the window to avoid, then
  the reasoning — not a narration of every fetch made.
- **Chat links = bare URLs**, one per line — never `[label](url)` in chat.
- **Keep it scannable** — one screen, not a wall of hourly data, unless the
  user asks to see the full hour-by-hour picture.
