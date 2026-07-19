# Reference: Update the tracker spreadsheet (Phase 5: always last)

After every competitor doc is complete, add a **new row** to the competitor
tracking Google Sheet for that company. This is a required final step.

## Which sheet: ALWAYS reuse the one in your memory

There is **ONE** tracker sheet for all competitors, so it stays a single
at-a-glance overview.

- If a tracker ID is already set: use it.
- Only create a tracker if none is set yet.

```
Spreadsheet ID: [YOUR_TRACKER_SHEET_ID]        # set in context/instructions.md
Target sheet (tab): [sheet/tab name], sheetId: [N]
```

## Row structure (one row per competitor, columns in this order)

1. **Company Name**: `=HYPERLINK("url","Name")` formula
2. **Founded**: year only
3. **Funding**: total + last round year
4. **Employee Count**
5. **Core Use Case**: concise bullets using `="• line1"&CHAR(10)&"• line2"` formula
6. **Target Users**: concise bullets
7. **Named Customers**: concise bullets (or "None publicly listed")
8. **Products / Features**: at-a-glance bullets
9. **Model Providers**: bullets
10. **Security**: at-a-glance bullets
11. **Pricing**: bullets; call out free trial Y/N
12. **Integrations**: bullets
13. **Detailed Analysis**: `=HYPERLINK("doc-url","About [Company] →")` formula

## How to write to the tracker: style once, then plain append

**Do NOT hand-craft Sheets formatting** (it comes out inconsistent). Two steps:

**Step 1: style the sheet once** (when you first create or adopt a tracker):
```bash
bun /workspace/agent/skills/competitor-analysis/scripts/style-tracker.js <spreadsheetId>
```
It's idempotent; safe to re-run.

**Step 2: append the competitor row as plain values.** No per-row formatting
needed; add one new row with this competitor's 13 values to the bottom:
```
POST https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{tab}!A1:append?valueInputOption=USER_ENTERED
body: { "values": [[ <the 13 column values, in order> ]] }
```
- Multi-line bullet cells: put `\n` between bullets in the cell string (they wrap).
- **Company Name** and **Detailed Analysis** can be `=HYPERLINK("url","label")`
  formulas; `USER_ENTERED` interprets them.
- Auth: `Authorization: Bearer onecli-managed` (the proxy injects the token).
