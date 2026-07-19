# Reference: Recent News Tab (Phase 3)

The **Recent News** tab is a separate Google Doc tab.

## Time range: default to year-to-date

Default to covering news from the beginning of the current calendar year to
today, so the user can redirect early. Honor any range they give (e.g. "last
12 months", "since a specific date").

## Gathering: be exhaustive

A single search misses coverage. Sweep in multiple passes:

- **Primary source: SerpAPI Google News**
  (`GET https://serpapi.com/search.json?engine=google_news&q={company}`).
  Google News indexes essentially every outlet, so it catches the long tail
  (the SiliconAngle-type pieces a semantic search drops). Make this your main
  news pass; use Exa as a secondary net.
- **A general pass:** recent news about the company over the time range.
- **A dedicated pass per major event** you know about: an acquisition, a
  funding round, a big launch, a leadership change. Major events get covered
  by many outlets, so search the event by name (e.g. `"{Company}"
  acquisition`) and pull the notable pieces, not just the top result.
- Request a generous number of results from Exa and run more than one query
  angle. When a big story is under-covered in your results, check the major
  tech/business outlets by name (see "What counts as news").

**Completeness check before you finish the tab:** for each major event, ask
"do I have the main outlets' coverage?" If a well-known outlet clearly
covered it and it's not in your list, search again for it specifically. A
missed acquisition headline is exactly the kind of gap to catch here.

## Format: one bullet per article

```
[date], "Title" (hyperlinked to URL), Publication, Journalist name
```

## What counts as news

**News = third-party press coverage**: any credible independent
trade/tech/business publication reporting on the company. Examples (a
starting point, not a whitelist): The New Stack, VentureBeat, TechCrunch,
SiliconAngle, The Information, Fortune, Forbes, Bloomberg, Reuters,
Washington Post, PYMNTS, Axios. Include reputable coverage from whatever
outlet you find.

**The company's own blog is NOT news by default**; it's self-published
marketing. Only include a blog post if it's a genuinely newsworthy
announcement (a feature/product launch, a new named customer, a funding
round, a research paper, a major partnership), and even then prefer
third-party coverage of the same event if it exists. Skip routine blog
content (how-tos, opinion, thought-leadership, marketing posts).

**Not news:** social media posts (X, LinkedIn) do not go here, even if they
announce something significant. (Social signals belong in the research pass /
Integrations cross-check.)

## Notes

- Order most-recent first.
- Hyperlink the article **title** to its URL (via `updateTextStyle`,
  `fields: 'link'`).
- Keep entries factual: headline + attribution, no commentary.
