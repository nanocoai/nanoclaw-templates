#!/usr/bin/env bun
/**
 * style-tracker.js: one-time styling for the competitor tracker sheet.
 *
 * Run this ONCE on a tracker sheet (when you first create/adopt it). It sets a
 * polished, professional look that ALL rows inherit automatically:
 *   - header row: bold white on slate-blue, centered, wrapped, frozen
 *   - frozen first column (Company Name)
 *   - sensible per-column widths (nothing cut off)
 *   - default wrap + top-align for data cells
 *   - alternating row colors (banding); applies to new rows too
 *
 * After running this, just append competitor rows as plain values (Sheets
 * `values.append`); no per-row formatting needed, the styling carries over.
 *
 * Usage:  bun style-tracker.js <spreadsheetId>
 * Auth via the OneCLI proxy (curl uses HTTPS_PROXY + CA).
 */
import { spawnSync } from "child_process";

const sheetId = process.argv[2];
if (!sheetId) { console.error("usage: bun style-tracker.js <spreadsheetId>"); process.exit(1); }

function curl(method, url, body) {
  const args = ["-sS", "-X", method, url, "-H", "Authorization: Bearer onecli-managed"];
  if (body) args.push("-H", "Content-Type: application/json", "--data-binary", JSON.stringify(body));
  const r = spawnSync("curl", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  let j; try { j = JSON.parse(r.stdout); } catch { console.error("Non-JSON:", (r.stdout||r.stderr||"").slice(0,300)); process.exit(1); }
  if (j.error) { console.error("API error:", JSON.stringify(j.error).slice(0,300)); process.exit(1); }
  return j;
}

const HEADERS = ["Company Name","Founded","Funding","Employee Count","Core Use Case",
  "Target Users","Named Customers","Products / Features","Model Providers","Security",
  "Pricing","Integrations","Detailed Analysis"];
const WIDTHS = [170,80,140,95,210,190,190,220,170,190,190,190,170];
const N = HEADERS.length;

const slate = { red: 0.20, green: 0.29, blue: 0.44 };
const white = { red: 1, green: 1, blue: 1 };
const paleBlueGray = { red: 0.96, green: 0.97, blue: 0.99 };

// Resolve the first sheet's numeric id + whether banding already exists (idempotent).
const meta = curl("GET", `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`);
const sheet0 = meta.sheets[0];
const sid = sheet0.properties.sheetId;
const hasBanding = (sheet0.bandedRanges || []).length > 0;

const requests = [
  // freeze header row + first column
  { updateSheetProperties: { properties: { sheetId: sid, gridProperties: { frozenRowCount: 1, frozenColumnCount: 1 } }, fields: "gridProperties.frozenRowCount,gridProperties.frozenColumnCount" } },
  // write + style the header row
  { updateCells: {
      start: { sheetId: sid, rowIndex: 0, columnIndex: 0 },
      rows: [{ values: HEADERS.map((h) => ({
        userEnteredValue: { stringValue: h },
        userEnteredFormat: {
          textFormat: { bold: true, foregroundColor: white, fontSize: 11 },
          backgroundColor: slate, horizontalAlignment: "CENTER",
          verticalAlignment: "MIDDLE", wrapStrategy: "WRAP",
        },
      })) }],
      fields: "userEnteredValue,userEnteredFormat",
  } },
  // header row height
  { updateDimensionProperties: { range: { sheetId: sid, dimension: "ROWS", startIndex: 0, endIndex: 1 }, properties: { pixelSize: 42 }, fields: "pixelSize" } },
  // per-column widths
  ...WIDTHS.map((w, i) => ({ updateDimensionProperties: { range: { sheetId: sid, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 }, properties: { pixelSize: w }, fields: "pixelSize" } })),
  // default data-cell format: wrap + top-align + size 10
  { repeatCell: { range: { sheetId: sid, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: N }, cell: { userEnteredFormat: { wrapStrategy: "WRAP", verticalAlignment: "TOP", textFormat: { fontSize: 10 } } }, fields: "userEnteredFormat(wrapStrategy,verticalAlignment,textFormat)" } },
];

// alternating row colors: only add if none exists (addBanding errors on overlap)
if (!hasBanding) {
  requests.push({ addBanding: { bandedRange: {
    range: { sheetId: sid, startRowIndex: 0, startColumnIndex: 0, endColumnIndex: N },
    rowProperties: { headerColor: slate, firstBandColor: white, secondBandColor: paleBlueGray },
  } } });
}

curl("POST", `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, { requests });
console.log(`✓ tracker styled: header frozen+colored, ${N} column widths set, wrap+top-align default, ${hasBanding ? "banding already present" : "banding added"}. Append rows as plain values from here.`);
