# Reference: About Doc Structure (Phase 2) + formatting

> **How you actually write this:** compose each section as **Markdown** and render
> it with the formatter (`references/doc-writing.md`) — bullets (`- `), sub-bullets
> (2-space indent), bold (`**`), and links (`[label](url)`) all become real Google
> Docs formatting. This file defines *what* goes in each section and the intended
> structure; the formatter handles *how* it's applied. Do NOT hand-write Docs API
> calls.
>
> The **13 section titles are always bold** (Founders, About / Mission, What problem
> do they solve?, Core Use Case, Target Users, Named Customers, Products / Features,
> Model Providers, Security, Pricing, Key Differentiators, Integrations, Socials /
> Extra Links). Put each on its own line — the formatter bolds them automatically.

Build the **About tab** in this exact order. The consistency of this structure
across every competitor doc is the whole point — match it precisely.

## Metadata block (top of doc — one-liners, each separated by a blank line)

- `Competitor Name: [Name]` — hyperlink the company name to their website URL
- `Founded: [date]`
- `Based In: [city, country]`
- `Team Size: [N] employees`
- `Funding: Total: $[X]M` — followed by bullet sub-items for each round; hyperlink
  each round's descriptor (e.g. "Seed ($12M, raised May 2026)") to the relevant
  press article

**Metadata bold rule:** bold **only** the label — everything up to and including
the first colon (e.g. `**Competitor Name:**`). The value after the colon is plain
(unbold) text.

## Sections (in order)

**1. Founders** (before About / Mission)
- Each founder as a level-1 bullet, name hyperlinked to their LinkedIn profile
- Everything describing that founder (title, prior company/role, background) goes as
  **indented sub-bullets under their name** — NOT more level-1 bullets. Nesting keeps
  it readable instead of one flat wall of bullets. In markdown, indent sub-bullets by
  2 spaces:
  ```
  - [Bob Jones](https://linkedin.com/in/...) — Co-founder & CEO
    - Previously co-founded Acme (acquired by BigCo, 2022)
    - Ex-Google, led the ranking team
    - MSc Computer Science, Technion
  ```

**2. About / Mission**
- Homepage headline + one founder quote (from press or about page)
- Plain-text paragraphs (no bullets, no indent)
- Strip marketing language; keep positioning facts

**3. What problem do they solve?**
- Go to the help center; browse "Getting Started," "Features," and "Using
  [Product]" sections
- For each article, ask: *what pain caused someone to need this?*
- Synthesize into 4–6 core problems (not features)
- **Format each problem as a title line + one bullet underneath:**
  - The problem statement on its own line, **plain text — not bold** (e.g. "Manual
    feature engineering blocks ML adoption at scale") — a plain line, not a bullet
  - Directly beneath it, a **single** native Google Docs bullet with the 1–2
    sentence explanation
  - Do **not** put the explanation as indented continuation lines under the title —
    it's one clean bullet per problem, nothing more. Structure:

```
Manual feature engineering blocks ML adoption at scale
  • Teams spend weeks hand-building features before any model ships, so ML stays
    bottlenecked on data engineering instead of shipping predictions.
```

**4. Core Use Case**
- **Format: native Google Docs bullets** — each use-case point as its own bullet

**5. Target Users**
- Named user personas / segments from website and press

**6. Named Customers**
- From case studies, press, testimonials; "None publicly listed." as a one-liner if absent
- **Every named customer, quote, or notable mention MUST be hyperlinked to its source**
  — the tweet, article, case study, video or text source it came from. An unsourced quote or
  endorsement is worthless and reads as fabricated; either link it or leave it out.
- **Do NOT assume a logo means a customer.** Companies over-market — a wall of logos does **not** mean they're customers unless the
  page explicitly says so. Label each name by how strong the evidence is:
  - **Explicitly a customer** — a case study *titled* with their name, a testimonial,
    or "we serve X" / "customer" language → name them plainly (linked to that proof).
  - **Logo only** (appears on the site with no explicit statement) → still list it, but
    tag it **"(listed on website — not confirmed)"**. Never state it as a customer.
  - **Ambiguous case study** (a case study exists but doesn't clearly name them, or it's
    inferred) → write **"potentially {Company}"** and link it — don't assert it.
- **Add a discretion note** at the top of this section, e.g. *"Customer claims below
  reflect what's publicly displayed; anything not explicitly confirmed is marked —
  verify before relying on it."* When in doubt, mark it and let the reader judge.
- **Extraordinary claims get extra scrutiny.** A surprising endorsement — a famous
  person, a government/official, a well-known researcher — must trace to a real
  **primary source you actually opened and verified** (their own post, a reputable
  article, an official record). If you can't verify it against a primary source, **do
  NOT include it** — never repeat a claim just because it appeared somewhere. When in
  doubt, leave it out. (A minister or Karpathy "quote" with no link is a red flag.)

**7. Products / Features**
- Most detailed section
- Check all dedicated subpages before writing
- Categories as level-1 bullets; specific features as **indented level-2 sub-bullets**
  under their category (2-space indent in markdown) — same nesting as Founders, not a
  flat list
- **Link every product/feature to its source page — this is what makes this section
  rich with links.** Hyperlink each feature's name (markdown `[Feature](url)`) to the
  page that documents it, choosing the best available:
  - **Default: its docs or dedicated product/feature page** on the company site.
    Almost every real feature has one — find it with a **SerpAPI Google query** like
    `{Feature} {Company}`.
    So **most features should end up linked**, not just a couple.
  - **Flagship launches** (a headline product): prefer the **launch
    announcement** (X/social thread → blog → press) over the docs page — it's more
    newsworthy.
- Only link a real page you actually found. A genuinely
  undocumented minor feature can stay unlinked, but that should be the exception, not
  the norm. If Products/Features has almost no links, you didn't look hard enough —
  run SerpAPI per feature.

**8. Redundancy check** (always)
- After writing Products / Features, cross-examine against Core Use Case
- If they overlap significantly, strip Core Use Case to bare bones

**9. Model Providers**
- From website + dedicated `/ai-model-providers` page
- Source-link it — see "Section sourcing links"

**10. Security**
- From website + `/subprocessors` / `/trust` pages
- Source-link it — see "Section sourcing links"

**11. Pricing**
- Individual plans + Team plans as category sub-bullets; each tier as a sub-sub-bullet
- Never cram multiple tiers onto one line with arrows or semicolons
- Source-link it — see "Section sourcing links"

**12. Key Differentiators**
- What they emphasize that competitors don't
- Link a point to its source **only when it's a bold/strong claim** — see "Section sourcing links"

**13. Integrations**
- From website + cross-check X/LinkedIn for anything announced but not yet on the site
- **Cap at 10.** If there are more than 10, list the 10 most notable and add a line
  saying you capped it — e.g. "Showing 10 of many; full list on their integrations page."
- Source-link it — see "Section sourcing links"

**14. Socials / Extra Links**
- Title this section **"Socials / Extra Links"** (not just "Socials").
- One markdown link per bullet: `- X: [@handle](https://x.com/handle)`.
- **Do NOT include the company's own website** here — it's already linked at the top
  of the doc. This section is for social profiles + extra links only.
- **Keep GitHub** and other genuinely useful links (docs, community, changelog).

## Hyperlinks (required in every doc)

Apply via the Google Docs API (`updateTextStyle` with `fields: 'link'`):
- Competitor name in the first line → company website URL
- Each funding round descriptor → the press article announcing that round
- Each founder name → their LinkedIn profile URL
- Social URLs → themselves (self-hyperlink)

### Section sourcing links — Model Providers, Security, Pricing, Integrations

For each of these four sections, link the source using this rule:
- **If the company has a dedicated page for that topic** (e.g. `/ai-model-providers`,
  `/security` or `/trust`, `/pricing`, `/integrations`) → hyperlink the **section
  title** to that page.
- **If there is no dedicated page** → hyperlink **each point/bullet** to wherever you
  actually sourced it — the specific website page, an X/social post, or the SERP
  (Google) result — the same way product/feature launches are linked. Do this at the
  end of the section once you know which facts came from where.

**Key Differentiators:** link a point **only when it's a bold/strong claim** that
warrants a source (a "first/only/fastest/most" type claim, a named benchmark, a
pointed comparison). Skip links on soft or generic statements.

**A link must actually SUBSTANTIATE what it's next to.** Don't link a section title
to a page and call it done if the specific items you named aren't on that page — e.g.
if you list "Snowflake" as an integration, the linked page must actually list
Snowflake. If a named item isn't on the section's dedicated page, link that item to
where it *is* documented, or don't assert it. A link that doesn't back the claim is
worse than no link.

**Every section must have at least ONE source hyperlink.** No section (Model
Providers, Security, Pricing, Integrations, etc.) should end up with zero links back
to a real source. If you can't find a single source for a whole section, that's a
signal you under-researched it — go read the dedicated page (below).

Every link must be a real source you found — never fabricate or guess a URL. If a
point has no findable source, leave it unlinked rather than inventing one.

## Key-terms scrub (Phase 4 — always, before done)

Scan the entire About tab for business-specific jargon — any term that means
something specific to *this company* that a reader might not understand out of
context. Add plain-language definitions for those terms in the About / Mission
section.

## Formatting rules

**Prose / indented sections**
- No dash or bullet characters — plain text only
- Section label: bold, 0pt indent
- First-level items: 36pt indentStart
- Second-level items: 72pt indentStart
- Short one-liner content goes on the same line as the label — e.g. "Named
  Customers: None publicly listed."

**Native bullet lists** (Products, Integrations, Model Providers, Security,
Pricing, What problem do they solve?, Core Use Case)
- Google Docs native bullets (disc/circle/square preset)
- No blank lines between bullet items — consecutive paragraphs only
- Sub-bullets: indentFirstLine 54pt, indentStart 72pt

**General**
- No decorative formatting, no extra headers
