# Extraction (deep retrieval)

Firecrawl mechanics: get the actual content, structured when it matters.
Escalate depth deliberately — most questions never need a crawl.

## The ladder — use the lowest rung that answers

1. **One page, rendered** — `firecrawl_scrape` (markdown format). Use when the
   page is JS-heavy, `web_fetch_exa` came back thin, or you will quote it.
2. **One PDF / filing / paper** — `firecrawl_parse` (or `firecrawl_scrape` on
   the PDF URL), and `firecrawl_research_read_paper` for academic papers.
   Investor decks, annual reports, and docs-as-PDF live here.
3. **A site section** — `firecrawl_map` first (lists URLs, no content), pick
   the handful that matter, scrape those. Map-then-pick beats blind crawling
   nine times out of ten.
4. **A bounded crawl** — `firecrawl_crawl` only when you truly need a whole
   section (a docs tree, a changelog archive). Set a page limit (≤50 without
   an explicit "yes" — see the standing brief), then poll
   `firecrawl_check_crawl_status`.
5. **Structured pull** — `firecrawl_extract` with a JSON schema when the
   deliverable needs fields, not prose: pricing tiers, plan limits, changelog
   entries, team rosters, integration lists. Define the schema from the
   sub-question first, then extract; comparisons built from schemas stay
   comparable.

## Discipline

- **Cost awareness.** Scrapes and crawls consume the user's Firecrawl quota;
  a mapped shortlist of 5 scrapes beats a 200-page crawl.
- **Provenance.** Keep the URL and retrieval date attached to every extracted
  fact; the vetting play and the source library need them.
- **Extraction is retrieval, not truth.** A cleanly scraped claim is still just
  a claim — it goes through `references/source-vetting.md` like everything
  else.
- **Failures.** A blocked or empty scrape is a finding ("site blocks
  scraping"), not a license to substitute memory. Say what you couldn't get.

Next → `references/source-vetting.md`
