# Reference: Update the tracker spreadsheet (Phase 5 — always last)

After every competitor doc is complete, add a **new row** to the competitor
tracking Google Sheet for that company. This is a **required** final step — do
not skip it.

## Which sheet — always reuse the one canonical tracker

There is **ONE** tracker for all competitors (ID in your standing brief —
`context/instructions.md`, under "Tracker spreadsheet"). **Always append to it** so it
stays a single at-a-glance overview. Only create a new tracker if none is set yet (first
run — then record its ID in memory) or the user explicitly asks for a one-off; otherwise
never spin up a fresh one.

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

## Aesthetics

The tracker should read like a designed dashboard, not a spreadsheet dump. The exact
styling — frozen colored header, column widths, wrap + top-align, alternating rows,
frozen first column — is defined in and applied by `scripts/style-tracker.js`, which is
the source of truth. To change the look, edit that script.
