# Receipts

Three kinds of file, all in the claim folder, all sized for a phone. The browser CLI in the sandbox is `agent-browser`; the commands below are the only ones needed.

## 1. Verdict card

Copy `references/card.html` to the claim folder as `verdict-card.html`, fill the placeholders, and screenshot it:

| Placeholder | Value |
| --- | --- |
| `{{LABEL}}` | `VERDICT` |
| `{{HEADLINE}}` | the pinned claim, then a line break, then the verdict in capitals, for example `Seed oils are toxic. → OVERSTATED` |
| `{{DETAIL}}` | the "what's true underneath" sentence |
| `{{GRADE}}` | `Evidence grade: B — two large cohorts and a Cochrane review` |
| `{{SOURCE}}` | `sources in the receipts` |

```
agent-browser set viewport 1080 1350 2
agent-browser open file:///workspace/agent/plugin-data/nutrition-claim-check/claims/<slug>/verdict-card.html
agent-browser screenshot /workspace/agent/plugin-data/nutrition-claim-check/claims/<slug>/verdict-card.png
```

## 2. Receipt cards, one per key source, up to three

Same template as `receipt-1.html`, `receipt-2.html`, …:

| Placeholder | Value |
| --- | --- |
| `{{LABEL}}` | `RECEIPT 1 OF 3` |
| `{{HEADLINE}}` | the quote, 40 words or fewer, in quotation marks |
| `{{DETAIL}}` | authors or organisation, journal or body, year, study type and size |
| `{{GRADE}}` | `Evidence grade: A` (the grade this source supports on its own) |
| `{{SOURCE}}` | the URL |

Screenshot each to `receipt-N.png` the same way.

## 3. Raw page screenshots, with the sentence that matters highlighted

For each key source, open its page, highlight the quoted sentence in yellow, scroll it into view, and screenshot. This is the picture an expert would send: the page as it is, with the line that carries the finding marked. Use the Europe PMC page for anything with a PubMed ID.

```
agent-browser set viewport 1280 1400 1
agent-browser open <url>
agent-browser wait 4000
agent-browser get title
agent-browser eval --stdin < /workspace/agent/plugin-data/nutrition-claim-check/claims/<slug>/highlight-N.js
agent-browser wait 800
agent-browser screenshot /workspace/agent/plugin-data/nutrition-claim-check/claims/<slug>/source-N.png
```

`highlight-N.js` is `references/highlight.js` with `QUOTE` replaced by the exact quote from `sources.json`. The script hides cookie banners and fixed overlays, tries the whole quote and then its first eight words, and prints "highlighted" or "not found". If it prints "not found", take the screenshot anyway and say in the caption that the sentence could not be marked on that page.

The page rendered if the title is not empty and does not contain "403", "Access Denied", "Just a moment", or "Attention Required". If it did not render, delete the file and note "page blocked screenshots" in the caption. Close the browser when done: `agent-browser close`.

## Rules

- Never screenshot full text behind a paywall; abstracts and guideline pages only.
- Every card carries the source URL or the words "sources in the receipts". The cards are quotations for commentary; the source is always named.
- If `agent-browser` is missing or fails twice, deliver the verdict without cards and say so. The verdict never waits on the pictures.
