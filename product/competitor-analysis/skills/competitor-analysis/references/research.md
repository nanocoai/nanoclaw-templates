# Reference: Research (Phase 1)

Crawl the competitor's **entire** website before writing anything, and cover every
area below. Capture the source URL for every fact as you go — you'll need them for the
required hyperlinks.

## Tools

- **Exa** (MCP) — discover pages and search the web/news, and pull page content.
  `web_search_exa` for quick semantic search, `web_search_advanced_exa` when you need
  filters (`includeDomains`, `category`, crawl-date range), `web_fetch_exa` to pull a
  known URL.
- **`agent-browser`** — open and read a *full* page, especially JS-rendered ones
  (pricing with plan toggles, trust/security centers, help-center apps, dashboards).
  Reach for it whenever a page looks incomplete via Exa.
- **SerpAPI (real Google results)** — for **known-item lookups Exa's semantic search
  misses**. Exa missing something doesn't mean it isn't there — a specific page, doc,
  or feature you'd expect to exist often turns up instantly on a plain Google query.
  Follow the result to the company's own site — e.g. `q=Fine-Tuning+Platform+Kumo`
  (full URL form in the Website section below).
  Use `engine=google_news` for exhaustive news (see `recent-news.md`).
  If SerpAPI isn't configured, note it and fall back to Exa.
- **X API** — the competitor's own recent posts (see Social, below).

## Website — pages to cover (if exists)

- **Homepage** — headline, tagline, positioning
- **Product / features**
- **Use cases**, templates, or workflows gallery
- **Pricing**
- **Integrations**
- **Dedicated subpages** (often more complete than embedded docs): `/ai-model-providers`,
  `/subprocessors`, `/trust`, `/security`
- **Help center** (`/docs`, `help.[company].com`, `support.[company].com`,
  `[company].intercom.help`) — for "What problem do they solve?"
- **About / team / careers**
- **Blog** and **press / news**

For each section, surface the company's own dedicated page (more specific = the real
source, so link it) with a site-scoped query, and check the nav, footer, and
`{domain}/sitemap.xml`:

```
https://serpapi.com/search.json?engine=google&q=site:{domain}+{topic}
```

e.g. `site:town.com security` → `town.com/features/security`. Open it in `agent-browser`
and read it **in full** — snippets drop details (a security page's certs are easy to grab,
but "the AI inherits a real user identity, enforced deterministically" only shows up on a
full read). A thin section usually means the page wasn't found or wasn't fully read.

## Social — last 60–90 days

Check the company's **X** and **LinkedIn** feeds for the past 60–90 days. New
integrations and announcements often land on social before the website updates —
cross-reference against the Integrations and Recent News sections.

- **X (Twitter):** Exa can't read x.com, so use the **X API** (below).
- **LinkedIn:** Exa handles it well — `web_search_advanced_exa` with `category: "people"`
  or `includeDomains: ["linkedin.com"]`.

**Verify the X account is really theirs** — handles get squatted or confused, and not
every company has an obvious official one. Open the candidate profile and confirm its
bio and recent posts match this company (same product, domain link, on-topic). If you're
not fully sure, give your best-guess handle and append **"Needs human confirmation"**
rather than presenting it as fact.


1. Resolve the handle: `GET https://api.x.com/2/users/by/username/{handle}`
2. Fetch posts: `GET https://api.x.com/2/users/{id}/tweets?max_results=100&tweet.fields=created_at,public_metrics&exclude=retweets,replies`

Then filter to the last 60–90 days by `created_at`, look for launches / integrations /
funding / partnerships, and cite each post as `https://x.com/{handle}/status/{tweet_id}`.
On a `401` the credential is missing/invalid; on `403`/`453` the account lacks the API
tier — either way note "X coverage pending" and move on, don't fabricate. (Social posts
aren't news — they feed the research/Integrations cross-check, not the Recent News tab;
see `recent-news.md`.)

## Funding & firmographics — targeted search

The metadata block is the hardest thing to get right from a general crawl, so run it as
its own dedicated search rather than relying on the site crawl.

**Fields to nail:** founded date · HQ (city, country) · employee count · total funding ·
each round (type, amount, announced date, lead + other investors, valuation if disclosed)
· any acquisitions.

**Employee count — ask SerpAPI directly**, don't guess (a wrong "3 employees" is worse
than "Unknown"): `q=how+many+employees+at+{Company}`, then read the answer box / LinkedIn /
Crunchbase. Prefer the LinkedIn or Crunchbase count; if sources disagree, give a range or
cite the most authoritative; if genuinely not findable, write "Unknown."

**Search recipe (`web_search_advanced_exa`, one query per call):** run several angles with
explicit funding keywords — `"{Company}" raises funding round led by`, `Series A OR seed $
million`, `total funding investors valuation`, `founded headquarters employees`,
`acquires OR "acquired by"` — each aimed at an authoritative source via `includeDomains`:
`crunchbase.com`, `techcrunch.com` + general press, `dealroom.co` / `tracxn.com`, the
company's own `/press` or "Announcing our Series X" posts, `linkedin.com`. If a profile
returns only a snippet, open it in `agent-browser` for the full funding table.

**Check the last few days for a brand-new round** before finalizing — funding moves fast,
and a company may have raised this week. Run a recency pass (`engine=google_news`,
`"{Company}" raises funding`) and check dates so you don't report a stale "latest round."

**Verification (required):**
- Every funding figure needs a **cited source URL** — prefer the primary announcement
  (company or lead investor) over secondary coverage; these become the metadata hyperlinks.
- Cross-check amount + date across **at least two** sources; if they conflict, note the
  discrepancy rather than silently picking one.
- If a fact can't be sourced, write "Undisclosed" / "Unknown" — never estimate. Missing
  Crunchbase/Dealroom data (some rounds sit behind login) is "not publicly listed," not zero.

## Research notes

- Prefer primary sources (the company's own pages, official press releases) over aggregators.
- If a standard page is missing (e.g. no public pricing), say so explicitly — that absence
  is itself a finding ("No public pricing page").
