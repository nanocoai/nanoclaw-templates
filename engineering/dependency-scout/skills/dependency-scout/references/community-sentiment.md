# Community Sentiment

Structured data (registry + GitHub + OSV) tells you the facts; search tells
you how people who've actually used it talk about it — the part that
catches "technically maintained but everyone's quietly migrating off it."

## What to search for

- `"<package>" production` — real-world adoption accounts
- `"<package>" alternative` / `"<package>" vs` — comparison discussions,
  which double as input to `alternatives.md`
- `"<package>" issues` / `"<package>" problems` — recurring pain points
- `"is <package> still maintained"` — directly catches the "looks abandoned"
  question when it's been asked publicly
- If the registry lookup showed a recent major-version bump: `"<package>
  migration"` or `"<package> v<N> breaking changes"` — a rocky migration is
  worth surfacing even for an otherwise healthy package

## Weighing what you find

- Prefer specific, recent, first-hand accounts ("we hit X in production
  under Y load") over generic praise or complaints with no detail.
- A handful of old complaints about a since-fixed issue is not the same
  finding as recent, recurring complaints about the same thing — check
  dates.
- Silence isn't necessarily bad — a niche but solid utility package may
  simply not generate much discussion. Say that explicitly rather than
  treating "found nothing" as a negative signal.
