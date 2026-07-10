# Reference: Research (Phase 1)

Crawl the **entire** competitor website before writing anything. Visit every area
below.

**Use the right tool for each job:**
- **Exa** — discover pages and search the web/news; pull highlights or page text.
- **`agent-browser`** — open and read a *full* page, especially JS-rendered ones
  (pricing with plan toggles, trust/security centers, help-center apps, dashboards).
  When a page looks incomplete via Exa, open it in the browser.
- **SerpAPI (real Google results)** — for **known-item lookups Exa's semantic
  search misses**. When you expect a specific page, doc, or feature to exist but Exa
  doesn't surface it, run a plain Google query and follow the result to their site:
  `GET https://serpapi.com/search.json?engine=google&q=Fine-Tuning+Platform+Kumo`.
  Use `engine=google_news` for exhaustive news (see `recent-news.md`). Auth
  (`api_key`) is injected by OneCLI — send none. If SerpAPI isn't configured, note
  it and fall back to Exa.
- **X API** — the competitor's own recent posts (see the Social section).

**When a fact or page seems missing, don't conclude it doesn't exist — try a plain
SerpAPI Google search first.** Exa missing something ≠ it isn't there (e.g. a
"Fine-Tuning Platform" page that Google finds immediately).

## Website — pages to cover

- **Homepage** — headline, tagline, positioning
- **Product / features** page
- **Use cases**, templates, or workflows gallery
- **Pricing** page
- **Integrations** page
- **Dedicated subpages** — check these before filling the matching doc sections;
  they are often more complete than embedded docs:
  - `/ai-model-providers`
  - `/subprocessors`
  - `/trust`
  - `/security`
- **FIND the most specific page — use a `site:` search.** Don't settle for the
  homepage or wherever a fact first turned up. For each section, run a **site-scoped
  Google query via SerpAPI** to surface the company's own dedicated page for that
  topic:
  ```
  https://serpapi.com/search.json?engine=google&q=site:{domain}+{topic}
  ```
  e.g. `site:town.com security` surfaces `town.com/features/security`. Also skim the
  site's **nav bar and footer**, and try **`{domain}/sitemap.xml`** for a full page
  list. Even if the info is also on the homepage, **prefer and link the most specific
  dedicated page** (e.g. `/features/security`) — that's the real source.
- **READ dedicated pages in FULL — don't skim a snippet.** Once you've found the
  dedicated page (security, integrations, model providers, pricing, a feature),
  **open it in `agent-browser` and read the entire page**, not just an Exa/SerpAPI
  excerpt. Snippets drop things — e.g. a security page's certifications are easy to
  grab, but a feature like "the AI inherits a real user identity, enforced
  deterministically" only shows up if you actually read the page. If a section feels
  thin, the page wasn't found or wasn't fully read: `site:` search for it, open it,
  and extract every distinct point.
- **Help center** (`/docs`, `help.[company].com`, `support.[company].com`,
  `[company].intercom.help`) — used for "What problem do they solve?"
- **About / team / careers**
- **Blog** and **press / news** pages

## Social — last 60–90 days

Check the company's **X** and **LinkedIn** feeds for the past 60–90 days. New
integrations and announcements often appear on social before the website is
updated — cross-reference these against the Integrations and Recent News sections.

- **X (Twitter):** use the **X API** for the competitor's recent posts — Exa
  cannot read x.com. Auth is injected by OneCLI (`Authorization: Bearer`), so call
  the API directly with a placeholder token. If the X credential isn't configured
  yet, skip this and note "X coverage pending" rather than guessing.
- **LinkedIn:** Exa handles LinkedIn well (`includeDomains: ["linkedin.com"]`).

**Verify the X account is really theirs.** Not every company has a verified or
obvious official account, and handles get squatted or confused. When you find a
candidate account, **open the profile and check that its bio and recent tweets
actually match this company** (same product, domain link, topics that line up with
what's in the doc). Only list it as their X if it clearly matches. If you're not
sure, write your best guess for the handle and append **"Needs human confirmation"**
right after it — don't present an unverified account as fact.

### How to pull a competitor's X posts (X API v2)

Two calls, both app-only Bearer. **Do not include a real token** — pass any
placeholder in the `Authorization` header; the OneCLI proxy swaps in the real
credential for `api.x.com`.

1. Resolve the handle to a numeric user ID:
   ```
   GET https://api.x.com/2/users/by/username/{handle}
   ```
2. Fetch their recent posts:
   ```
   GET https://api.x.com/2/users/{id}/tweets?max_results=100&tweet.fields=created_at,public_metrics&exclude=retweets,replies
   ```

Example (the proxy injects auth):
```bash
curl -sS "https://api.x.com/2/users/by/username/{handle}" \
  -H "Authorization: Bearer placeholder"
```

Then:
- Filter to the **last 60–90 days** using each post's `created_at`.
- Look for signals: product launches, new integrations, funding/hiring
  announcements, notable partnerships.
- Cite each relevant post by its URL: `https://x.com/{handle}/status/{tweet_id}`.
- On a `401` the credential is missing/invalid; on a `403`/`453` the account lacks
  the required API access tier — in either case note "X coverage pending" and move
  on, don't fabricate.

These posts feed the **Integrations** cross-check and the general "what's new"
read. Per `recent-news.md`, social posts are **not** news items — they do not go in
the Recent News tab.

## Funding & firmographics — targeted search

The metadata block (founded, HQ, team size, funding rounds + investors) is the
hardest thing to get right from a general crawl. Run it as its own **dedicated,
targeted search** — don't rely on the site crawl to surface these.

**Fields to nail:** founded date · HQ (city, country) · employee count · total
funding · each round (type, amount, announced date, lead investor, other
investors, valuation if disclosed) · any acquisitions.

**Employee count — ask SerpAPI directly.** Don't guess or use a placeholder (a
wrong "3 employees" is worse than "Unknown"). Run a plain-language Google query and
read the answer box / LinkedIn / Crunchbase result:
```
GET https://serpapi.com/search.json?engine=google&q=how+many+employees+at+{Company}
```
Prefer the LinkedIn company-page count or Crunchbase; if sources disagree, give a
range or cite the most authoritative. If genuinely not findable, write "Unknown" —
never invent a number.

**Search recipe (Exa):**
- Use `type: "deep"` and, where supported, `additionalQueries` to force several
  angles in one pass.
- Run targeted queries with explicit funding keywords, e.g.:
  - `"{Company}" raises funding round led by`
  - `"{Company}" Series A OR Series B OR seed $ million`
  - `"{Company}" total funding investors valuation`
  - `"{Company}" founded headquarters employees`
  - `"{Company}" acquires OR "acquired by"`
- Aim each pass at an authoritative source with `includeDomains`:
  - `crunchbase.com` — public org page: rounds, investors, founded, HQ, employee range
  - `techcrunch.com` + general press — the round announcements
  - `dealroom.co`, `tracxn.com` — structured funding profiles
  - the company's own `/press`, `/news`, or "Announcing our Series X" blog posts
  - `linkedin.com` — company page for employee count, founded, HQ
- If a profile page is found but Exa returns only a snippet, open it with
  **`agent-browser`** to read the full funding table.

**Check the LAST FEW DAYS for a brand-new round.** Funding changes fast — a company
may have raised *this week*. Always run a recency-sorted news pass before finalizing
funding: SerpAPI `engine=google_news` (which surfaces the newest coverage) and a
query like `"{Company}" raises funding` — and check dates. Don't report a stale
"latest round" when a newer one was announced days ago.

**Verification (required):**
- Every funding figure needs a **cited source URL** — prefer the primary
  announcement (company press release or the lead investor's post) over secondary
  coverage. These citations become the metadata hyperlinks.
- Cross-check amount + date across **at least two** sources; if they conflict, note
  the discrepancy rather than silently picking one.
- If a fact can't be sourced, write "Undisclosed" / "Unknown" — never estimate.
- Public Crunchbase/Dealroom pages may hide some rounds behind login; treat missing
  data as "not publicly listed," not as zero.

## Research notes

- Prefer primary sources (the company's own pages, official press releases) over
  aggregators.
- Capture the **source URL** for every fact as you go — you'll need them for the
  required hyperlinks (funding rounds → press articles, founders → LinkedIn, etc.).
- If a standard page is missing (e.g. no public pricing), note it explicitly —
  that absence is itself a finding ("No public pricing page").
