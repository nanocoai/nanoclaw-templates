# Reference: Recent News Tab (Phase 3)

The **Recent News** tab is a **separate Google Doc tab** . 

## Time range — default to since the start of this year

Default to covering news **from the beginning of the current calendar year to today**
(see SKILL.md) so the user can redirect early; if they didn't specify, use
year-to-date. Honor any range they give (e.g. "last 12 months", "since a specific
date"). 

## Gathering — be exhaustive

A single search misses coverage. Sweep in **multiple passes**:

- **Primary source — SerpAPI Google News** (`GET https://serpapi.com/search.json?engine=google_news&q={company}`).
  Google News indexes essentially every outlet, so it catches the long tail (the
  SiliconAngle-type pieces a semantic search drops). Make this your main news pass;
  use Exa as a secondary net. If SerpAPI isn't set up,
  fall back to Exa but sweep harder.
- **A general pass:** recent news about the company over the time range.
- **A dedicated pass per major event** you know about — an acquisition, a funding
  round, a big launch, a leadership change. Major events get covered by **many**
  outlets, so search the event by name (e.g. `"{Company}" acquisition`) and pull
  the notable pieces, not just the top result.
- Request a generous number of results from Exa and run more than one query angle.
  When a big story is under-covered in your results, check the major tech/business
  outlets by name (see the list under "What counts as news").

**Completeness check before you finish the tab:** for each major event, ask "do I
have the main outlets' coverage?" If a well-known outlet clearly covered it and
it's not in your list, search again for it specifically. A missed acquisition
headline is exactly the kind of gap to catch here.

## Format — one bullet per article

```
[date], "Title" (hyperlinked to URL), Publication, Journalist name
```

## What counts as news

**News = third-party press coverage** — **any** credible independent trade/tech/business
publication reporting on the company. The names below are **just a starting point, not
a whitelist**: include reputable coverage from *whatever* outlet you find — industry Examples: The New Stack,
VentureBeat, TechCrunch, SiliconAngle, The Information, Fortune, Forbes, Bloomberg,
Reuters, Washington Post, PYMNTS, Axios, and many more. 

**The company's own blog is NOT news by default** — it's marketing/self-published.
Only include a company blog post if it's a genuinely **newsworthy announcement**: a
new feature/product launch, a new named customer, a funding round, a research paper,
a major partnership. Even then, **prefer third-party coverage** of that same event if
it exists; use the blog post only when no outlet covered it. Skip routine blog
content (how-tos, opinion, thought-leadership, marketing posts).

**Not news:** social media posts (X, LinkedIn) are **not** news items and do not go
here, even if they announce something significant. (Social signals belong in the
research pass / Integrations cross-check, not the Recent News log.)

## Notes

- Order most-recent first.
- Hyperlink the article **title** to its URL (via `updateTextStyle`,
  `fields: 'link'`).
- Keep entries factual — headline + attribution, no commentary.
