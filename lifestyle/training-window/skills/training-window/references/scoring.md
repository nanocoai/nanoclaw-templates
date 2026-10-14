# Scoring Thresholds

Score every daylight hour (roughly local 5am-9pm) on three axes, then combine
into one tier. Use Fahrenheit/Celsius consistent with whatever unit the
forecast response returns (Open-Meteo defaults to Celsius unless
`temperature_unit=fahrenheit` is passed — pick one and convert the thresholds
below consistently, don't mix units mid-report).

## Heat & humidity

Use **apparent** ("feels like") temperature plus **dew point**, not the plain
air temperature — dew point is what actually limits how well sweat
evaporates, and a "reasonable" thermometer reading with a high dew point can
be worse than a hotter, drier one.

- **Great**: apparent temp under 65°F (18°C), OR apparent temp under 75°F
  (24°C) AND dew point under 60°F (15°C)
- **OK**: apparent temp 75-89°F (24-32°C) with dew point under 65°F (18°C),
  or apparent temp under 65°F but dew point 60°F+ (muggy-but-cool)
- **Avoid**: apparent temp 90°F+ (32°C+), OR dew point 70°F+ (21°C+)
  regardless of temperature (this is the "feels fine but you can't cool off"
  case — call it out explicitly when it's the driver), OR apparent temp under
  20°F (-6°C) for cold-injury risk

## UV index

- **Great**: UV index under 3
- **OK**: UV index 3-7 (mention sunscreen/hat in the report)
- **Avoid**: UV index 8+ (peak exposure risk)

## Air quality (US AQI)

- **Great**: AQI under 50
- **OK**: AQI 51-100
- **Avoid**: AQI 101+ (unhealthy for sensitive groups or worse — materially
  reduces aerobic performance and irritates airways during heavy breathing,
  independent of how the weather looks)

## Combining into one hour tier

Take the **worst** of the three axes as the hour's tier — a single "Avoid"
signal (e.g. wildfire smoke on an otherwise perfect cool morning) should
dominate even if the other two are great. Record which axis drove the tier
so the report can say why, not just what.

## Picking the window

Prefer the longest contiguous run of "Great" hours. If none exists, prefer
the longest run that avoids "Avoid" entirely (i.e., all "OK" or better).
Report the specific start-end clock time ("6:00-8:30am"), never a vague
part-of-day label like "morning."
