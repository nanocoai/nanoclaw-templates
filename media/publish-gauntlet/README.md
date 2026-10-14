# Publish Gauntlet

## What it does
Paste a draft and one audience/channel line. The agent runs four fixed lenses in order: errors, understandability, AI-tells, and register. You get ranked findings (max 12) in a fixed format. Then you get a cleaned draft that applies every BLOCKER and SHOULD fix without changing facts, numbers, names, or claims. It ends with a one-line scoreboard for em dashes, banned terms, hedges, and register. It never publishes or sends anything.

## Who it is for
Anyone who ships customer-facing copy: cold emails, landing sections, social posts, proposals, deck notes. Solo operators and small studios that want the same gauntlet on every draft before a human hits send.

## Why this gauntlet is different
Four lenses run in a fixed order, each one a skill with its own checklist, so the agent behaves the same way twice. Every finding quotes the span of the draft it flags. Findings are ranked BLOCKER, then SHOULD, then NIT, and capped at 12. The rewrite step is required: the cleaned draft applies every BLOCKER and SHOULD, keeps every fact, number, name, and claim, and marks gaps with `[NEEDS FACT: …]` instead of inventing. Register covers tone only, so a missing fact is a marker, never a register fail. The rubrics come from a working two-person AI studio's daily publish gauntlet; the worked examples are fictional businesses with no client names.

## Credentials
None. No external services, no API keys, no MCP servers. Stamp the template and paste a draft.

## How to run
1. Stamp this template into a NanoClaw agent (`publish-gauntlet`).
2. Paste a draft plus one line: audience and channel (example: `roofing contractors, cold email`). Standing audience rules live in `additional_context/audience.md`.
3. Read FINDINGS, then take the CLEANED DRAFT and the scoreboard line.
4. Edit `additional_context/register.md`, `audience.md`, and `banned-terms.md` when your house voice or default reader changes.

Tasks arrive paused. Resume `weekly-tells-report` only if you want the Monday summary.

## Three worked examples
Illustrative only; fictional businesses; no client names.
- Cold email to a contractor: `additional_context/examples/01-cold-email-contractor.md`
- Pricing page section: `additional_context/examples/02-pricing-page-section.md`
- Social post: `additional_context/examples/03-social-post.md`

## The demo
Live stamped-install run (2026-09-04): see [`PROOF.md`](PROOF.md). It carries the reply verbatim, the same findings re-rendered in the current line format, and a note on where that run differs from worked example 01.

## What happens when it fails
- No audience given: asks once, then uses the default in `additional_context/audience.md` ("a busy customer reading on a phone").
- Draft over 2,000 words: reviews in sections with the same output shape each time.
- A lens finds nothing: that lens contributes zero lines; other lenses still run.
- Operator disagrees with the register: edit `additional_context/register.md` and re-run; do not argue the old file.

## What it deliberately does not do
Never publishes or sends. Never invents facts. Never changes numbers, names, or claims. Does not grade grammar for its own sake. Does not replace your judgment on whether the offer should ship.

## How this was built
Forge on Fable 5.1 planned and gated the entry. Themis on a cloud VM built the template tree and checked it with the registry's own `check-templates.mjs`. Grok 4.6 ran first-pass reviews of the draft files. Opus 5 gates held the acceptance rows before the PR opened.

## Credit
Built by LegacyForge AI (legacyforgeai.com) for the NanoClaw Templates Hackathon, September 2026. MIT.
