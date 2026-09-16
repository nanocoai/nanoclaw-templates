---
name: check-claim
description: Researches a nutrition claim live with Tavily, grades the evidence, and delivers a sourced verdict with a verdict card, receipt cards, and study screenshots. Trigger on any message containing a claim, headline, link, or "is it true that".
---

# Check a claim

Seven steps, in order, every time. Read `additional_context/evidence-rubric.md`, `source-tiers.md`, and the profile first; the profile's audience level sets how technical the chat message is.

## 1. Pin the claim

Write the claim as one testable sentence, in the words the person used, and note the population it is about. "Seed oils are toxic" becomes "Eating common seed oils (sunflower, canola, soybean) harms health in adults." If the message is a link, extract the page with Tavily and pin the claim from it. If it is two claims, split them and check the first; say you will do the second next.

Create `plugin-data/nutrition-claim-check/claims/<slug>/` (slug from the claim, for example `seed-oils-toxic`) and write `claim.md` with the pinned sentence and the date.

## 2. Search

Run the passes from `source-tiers.md` in order: guideline pass, review pass, recency pass. Stop when you have three to six sources that address the claim as stated and at least one from Tier 1 or a systematic review. Run the counter pass only if the first three found nothing. Six searches is the hard limit.

## 3. Read

Extract the three to six best URLs with `tavily_extract` (`extract_depth: advanced` for journal pages). For each, record in `sources.json`: title, authors or organisation, year, URL, study type, population and size, key finding in one sentence, effect size and whether absolute or relative, funding or conflicts if stated, and one direct quote of 40 words or fewer that carries the finding. Prefer the Europe PMC URL for anything with a PubMed ID; it renders for screenshots and PubMed does not.

If an extract fails or a page is paywalled, keep the abstract and say so. Six extracts is the hard limit.

## 4. Grade and decide

Apply the rubric. Write `verdict.md` with `references/verdict-format.md`: verdict, grade with its one-sentence reason, "what's true underneath", "what's exaggerated or missing", the sources, and the one-line takeaway. Check the three inflations and the red flags before you finalise.

## 5. Receipts

Follow `references/receipts.md` exactly. Three sub-steps, none optional:

5a. Verdict card: fill `references/card.html`, screenshot at 1080x1350.
5b. Receipt cards: one per key source, up to three, same template, same size.
5c. Source screenshots with the quote highlighted: for each key source, copy `references/highlight.js` to `highlight-N.js` in the claim folder with `QUOTE` replaced by that source's quote from `sources.json`, open the page, run `agent-browser eval --stdin < highlight-N.js`, and screenshot only after it printed "highlighted" (or "not found", in which case screenshot anyway and say so in the caption). A source screenshot without the highlight step is not finished; a page that blocks screenshots is skipped with a note.

Files land in the claim folder.

## 6. Deliver

Send the verdict message (the format's chat version), then the verdict card, then the receipt cards, then the raw screenshots, each with `send_file` and a one-line caption naming the source.

## 7. Log

Append one line to `plugin-data/nutrition-claim-check/log.md`: date, slug, verdict, grade, number of sources.

## Follow-ups

"Go deeper on source 2": extract more of that source, within the budget, and add to the verdict. "Any newer studies": one recency-pass search. "What did the guideline say exactly": quote up to 40 words from the guideline page. Never re-run the whole check for a follow-up.

## When it fails

| What happens | What Nina does |
| --- | --- |
| Tavily not reachable or key missing | Says so in one line, does not guess an answer, points to the README's setup step. No verdict without sources. |
| Nothing found in three passes | Counter pass; if still nothing, verdict "Not enough evidence" with what a proper test would look like. |
| Sources disagree | "It depends" or "Not enough evidence", with the disagreement stated. |
| Page will not render for a screenshot | Receipt card only for that source; the caption says the page blocked screenshots. |
| Claim is a personal medical question | `safety.md`: general evidence, then the referral line. |
| Budget exhausted | Verdict on what was read, with "not checked" listed. |
