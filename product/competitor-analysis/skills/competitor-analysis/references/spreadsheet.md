# Reference: Update the tracker spreadsheet (Phase 5 — always last)

After every competitor doc is complete, add a **new row** to the competitor
tracking Google Sheet for that company. This is a **required** final step — do
not skip it.

## Which sheet — ALWAYS reuse the one in your memory

There is **ONE** tracker sheet for all competitors, so it stays a single at-a-glance
overview. Its ID is recorded in your standing brief / memory (under "Tracker
spreadsheet"). **Always append to that same sheet — do not create a new tracker.**

- **If a tracker ID is already set: use it.** Every competitor goes into that one
  sheet. Never spin up a fresh tracker just because you're doing a new competitor.
- **Only create a tracker if none is set yet** (first-ever run) — and the moment you
  do, **record its ID in your memory** so every future run reuses it.
- **Only exception:** the user *explicitly* tells you to make a new one (e.g. a
  one-off test). Otherwise default to the existing tracker, always.

```
Spreadsheet ID: [YOUR_TRACKER_SHEET_ID]        # set in context/instructions.md
Target sheet (tab): [sheet/tab name], sheetId: [N]
```

## Row structure (one row per competitor, columns in this order)

1. **Company Name** — `=HYPERLINK("url","Name")` formula
2. **Founded** — year only
3. **Funding** — total + last round year
4. **Employee Count**
5. **Core Use Case** — concise bullets using `="• line1"&CHAR(10)&"• line2"` formula
6. **Target Users** — concise bullets
7. **Named Customers** — concise bullets (or "None publicly listed")
8. **Products / Features** — at-a-glance bullets
9. **Model Providers** — bullets
10. **Security** — at-a-glance bullets
11. **Pricing** — bullets; call out free trial Y/N
12. **Integrations** — bullets
13. **Detailed Analysis** — `=HYPERLINK("doc-url","About [Company] →")` formula

## How to write to the tracker — style once, then plain append

**Do NOT hand-craft Sheets formatting** (it comes out inconsistent). Two simple steps:

**Step 1 — style the sheet once** (when you first create or adopt a tracker sheet):
```bash
bun /workspace/agent/skills/competitor-analysis/scripts/style-tracker.js <spreadsheetId>
```
This applies the whole polished look (frozen colored header, column widths, wrap +
top-align, alternating row colors) — the styling then carries to every row you add.
It's idempotent; safe to re-run.

**Step 2 — append the competitor row as plain values.** No per-row formatting needed.
```
POST https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{tab}!A1:append?valueInputOption=USER_ENTERED
body: { "values": [[ <the 13 column values, in order> ]] }
```
- Multi-line bullet cells: put `\n` between bullets in the cell string (they wrap).
- **Company Name** and **Detailed Analysis** can be `=HYPERLINK("url","label")`
  formulas — `USER_ENTERED` interprets them.
- Auth: `Authorization: Bearer onecli-managed` (the proxy injects the token).

## Aesthetics — what style-tracker.js applies (reference)

The tracker is a customer-facing overview, so it must look clean and designed:

**Header row (row 1):**
- The 13 column titles, **bold white text on a dark accent background** (slate blue,
  ~`rgb(0.20, 0.29, 0.44)`), centered and wrapped.
- **Freeze the header row** (`frozenRowCount: 1`) so it stays visible on scroll.
- Header row height ~40px.

**Column widths** (`updateDimensionProperties`) — nothing so narrow text is cut off:
- Company Name ~170 · Founded ~80 · Funding ~140 · Employee Count ~90
- The bulleted columns (Core Use Case, Target Users, Named Customers, Products /
  Features, Model Providers, Security, Pricing, Integrations) ~210 each
- Detailed Analysis ~170

**Data rows:**
- `wrapStrategy: 'WRAP'`, `verticalAlignment: 'TOP'`, font size 10, generous padding.
- Row height tall enough that every wrapped bullet is visible (~180px or auto-resize).
- **Alternating row backgrounds** — white / pale blue-gray `rgb(0.96, 0.97, 0.99)`.
- Thin light-gray borders between rows and columns.
- **Freeze the first column** (Company Name) so it stays visible when scrolling right.

**General:** consistent font, no cramped cells, everything readable at a glance — it
should look like a designed dashboard, not a spreadsheet dump.
