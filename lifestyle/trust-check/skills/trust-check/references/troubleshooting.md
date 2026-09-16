# Troubleshooting

## Tavily connection

- A real search result, or a well-formed empty result set, means connected.
- A 401/403, or an error mentioning an invalid/missing API key, means the
  Tavily credential isn't wired yet. Tell the user their agent needs a
  Tavily API key connected (see this template's README) — don't ask them to
  paste a key into chat.

## Sparse or no results

Some checks (a brand-new listing, a small local landlord, an unlisted
freelance gig) will turn up little either way. That's expected — report it
as "no public record found" per `report-format.md`, not as a failure of the
tool. Don't keep re-searching with minor query variations past a reasonable
handful of attempts; diminishing returns past that point usually mean the
information genuinely isn't public.

## Ambiguous names

A common name (a person, a small business) can return results for the wrong
entity entirely. Use whatever qualifiers are available (location, exact
domain, price range, the platform) to filter, and say plainly in the report
when a search likely returned results for a different, similarly-named
entity rather than presenting them as confirmed.
