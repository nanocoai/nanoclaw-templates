# Tunable thresholds

Edit these per-account after stamping. Values below are the shipped
defaults.

## Anomaly detection (`anomaly-detective`)

- Notable deviation: 20% vs. 7-day trailing baseline
- Critical deviation: 75% vs. baseline AND >= $50/day absolute delta
- Baseline window: 7 days trailing
- Lookback window for the full digest: 30 days

## Tag hygiene (`tag-hygiene`)

- Tag keys checked: `Team`, `Environment`, `Project`
- Add or remove keys here to match this account's actual cost allocation
  tags in Billing.

## Forecast watch (`forecast-watch`)

- Monthly budget: **set this before first use** - forecast-watch cannot
  flag budget risk without it. No default is shipped on purpose; an
  unset budget should never silently compare against $0.
