# Search Strategy (find)

Systematic finding: sweep broad, then hand the load-bearing URLs to the
extraction play.

## Tools

- `web_search_exa` — semantic web search, the default. Prefix the query with a
  category hint when one fits: `category:news`, `category:company`,
  `category:research paper`, `category:people`, `category:personal site`
  (e.g. `category:news Acme Series B`). Raise `numResults` on broad sweeps.
- `web_fetch_exa` — quick read of one (static) page. For JS-heavy pages, PDFs,
  or anything you'll quote heavily, use the extraction play instead.
- `firecrawl_search` — second opinion when Exa's angle runs dry; different
  index, different blind spots.
- `firecrawl_research_search_papers` / `firecrawl_research_read_paper` — when
  the claim is scientific or technical, go to the literature, not blog posts
  about it.
- `firecrawl_research_search_github` — adoption signals: real usage in code,
  issues, stars-over-time beat marketing pages.

## Sequence

1. **Broad sweep** — 3–5 searches on the same sub-question from different
   angles: entity-led (`Acme pricing model`), event-led (`category:news Acme
   funding OR layoffs OR launch`), problem-led (`Acme alternatives migration`),
   critic-led (`Acme reviews complaints churn`).
2. **Shortlist** — pick the 2–3 most load-bearing results per sub-question.
   Search snippets are bait, not evidence; nothing gets cited from a snippet.
3. **Read or extract** — quick static reads here (`web_fetch_exa`); anything
   deeper goes to `references/extraction.md`.
4. **Gap check** — list which sub-questions are still thin and run targeted
   follow-ups only for those.

## Source ladder (aim high first)

1. **Primary**: filings, official docs and changelogs, company announcements,
   papers, transcripts, the company's own site (extract it, don't paraphrase
   coverage of it).
2. **Quality secondary**: major outlets, established analysts and researchers.
3. **Tertiary**: blogs, forums, social posts — leads to verify, quotable only
   as "chatter", never as fact.

## Stop rule

Stop when new searches return sources you have already seen (saturation) or
the depth tier's budget is spent. Note anything left uncovered; the brief's
scope-honesty line comes from here.

Next → `references/extraction.md`
