#!/usr/bin/env bun
/**
 * render-section.js — append a Markdown section to a Google Doc TAB with real
 * formatting (native bullets, sub-bullet indentation, bold, hyperlinks).
 *
 * Why this exists: writing formatted Google Docs via the raw API means precise,
 * index-based batchUpdate calls whose ranges shift as you insert text — and this
 * doc has tabs, so every location needs a tabId. Hand-crafting that is unreliable.
 * The agent writes plain Markdown; this script does the formatting deterministically.
 *
 * Usage:
 *   bun render-section.js <docId> <markdownFile> [tabTitle]
 *   (tabTitle defaults to "About"; matched trimmed + case-insensitively. In a single-tab
 *    doc it writes to that tab; in a multi-tab doc a missing tab title is a hard error —
 *    it never silently writes to the wrong tab.)
 *
 * Supported Markdown (one block per line):
 *   plain line            -> paragraph
 *   "- text"              -> bullet (level 1)
 *   "  - text"            -> sub-bullet (level 2, indented)
 *   blank line            -> paragraph break (spacing)
 *   inline **bold**       -> bold run
 *   inline [label](url)   -> hyperlink
 *
 * Auth: calls go through the OneCLI proxy via curl (HTTPS_PROXY + CA already set
 * in the container). Send `Authorization: Bearer onecli-managed`.
 */
import { spawnSync } from "child_process";
import { readFileSync } from "fs";

const [docId, mdPath, tabTitle = "About"] = process.argv.slice(2);
if (!docId || !mdPath) {
  console.error("usage: bun render-section.js <docId> <markdownFile> [tabTitle]");
  process.exit(1);
}

// The 13 section titles are ALWAYS bold — enforced here so it can't be forgotten.
// Matched on normalized text (lowercase, whitespace removed).
const norm = (s) => s.toLowerCase().replace(/\s+/g, "");
const KNOWN_TITLES = new Set([
  "founders", "about/mission", "whatproblemdotheysolve?", "whatproblemdotheysolve",
  "coreusecase", "targetusers", "namedcustomers", "products/features", "productsfeatures",
  "modelproviders", "security", "pricing", "keydifferentiators", "keydifferentiations",
  "integrations", "socials", "socials/extralinks",
].map(norm));

function curl(method, url, body) {
  const args = ["-sS", "-X", method, url, "-H", "Authorization: Bearer onecli-managed"];
  if (body) args.push("-H", "Content-Type: application/json", "--data-binary", JSON.stringify(body));
  const r = spawnSync("curl", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  let json;
  try { json = JSON.parse(r.stdout); } catch {
    console.error("Non-JSON response:", (r.stdout || r.stderr || "").slice(0, 400));
    process.exit(1);
  }
  if (json.error) { console.error("API error:", JSON.stringify(json.error).slice(0, 400)); process.exit(1); }
  return json;
}

// --- 1. Locate the target tab + its current end index ---
const doc = curl("GET", `https://docs.googleapis.com/v1/documents/${docId}?includeTabsContent=true`);
const tabs = doc.tabs || [];
const want = tabTitle.trim().toLowerCase();
let tab = tabs.find((t) => (t.tabProperties?.title || "").trim().toLowerCase() === want);
if (!tab) {
  if (tabs.length === 1) {
    tab = tabs[0]; // single-tab doc (e.g. the About tab before a Recent News tab is added)
  } else {
    const titles = tabs.map((t) => `"${t.tabProperties?.title || ""}"`).join(", ") || "(none)";
    console.error(
      `Tab "${tabTitle}" not found — refusing to write to the wrong tab. ` +
      `Available tabs: ${titles}. Check the tab name (matched trimmed + case-insensitively).`
    );
    process.exit(1);
  }
}
const tabId = tab.tabProperties.tabId;
const content = tab.documentTab.body.content;
let endIndex = 1;
for (const el of content) if (el.endIndex) endIndex = el.endIndex;
const insertAt = endIndex - 1; // insert before the tab body's trailing newline

// --- 2. Parse Markdown into blocks, resolving inline bold/links to offsets ---
function parseInline(text) {
  let plain = "", bolds = [], links = [], i = 0;
  while (i < text.length) {
    if (text.startsWith("**", i)) {
      const e = text.indexOf("**", i + 2);
      if (e !== -1) { const s = plain.length; plain += text.slice(i + 2, e); bolds.push([s, plain.length]); i = e + 2; continue; }
    }
    if (text[i] === "[") {
      const c = text.indexOf("]", i);
      if (c !== -1 && text[c + 1] === "(") {
        const p = text.indexOf(")", c + 2);
        if (p !== -1) { const s = plain.length; plain += text.slice(i + 1, c); links.push([s, plain.length, text.slice(c + 2, p)]); i = p + 1; continue; }
      }
    }
    plain += text[i++];
  }
  return { plain, bolds, links };
}

const blocks = readFileSync(mdPath, "utf8").replace(/\r/g, "").split("\n").map((raw) => {
  if (raw.trim() === "") return { level: 0, bullet: false, inline: { plain: "", bolds: [], links: [] } };
  const m2 = raw.match(/^\s{2,}[-*]\s+(.*)$/);
  const m1 = raw.match(/^[-*]\s+(.*)$/);
  if (m2) return { level: 2, bullet: true, inline: parseInline(m2[1]) };
  if (m1) return { level: 1, bullet: true, inline: parseInline(m1[1]) };
  return { level: 0, bullet: false, inline: parseInline(raw.trim()) };
});

// --- 3. Build full text + absolute-index formatting ranges ---
let text = "";
const bulletRanges = [], subBulletRanges = [], boldRanges = [], linkRanges = [];
for (const b of blocks) {
  const start = insertAt + text.length;
  for (const [s, e] of b.inline.bolds) boldRanges.push([start + s, start + e]);
  for (const [s, e, url] of b.inline.links) linkRanges.push([start + s, start + e, url]);
  // Hard-code: a standalone line matching a known section title is always bold.
  if (!b.bullet && KNOWN_TITLES.has(norm(b.inline.plain))) boldRanges.push([start, start + b.inline.plain.length]);
  text += b.inline.plain + "\n";
  const end = insertAt + text.length;
  if (b.bullet) (b.level === 2 ? subBulletRanges : bulletRanges).push([start, end]);
}

// --- 4. One batchUpdate: insert text, then bullets, indentation, bold, links ---
const R = (r) => ({ startIndex: r[0], endIndex: r[1], tabId });
const requests = [{ insertText: { location: { index: insertAt, tabId }, text } }];
for (const r of [...bulletRanges, ...subBulletRanges])
  requests.push({ createParagraphBullets: { range: R(r), bulletPreset: "BULLET_DISC_CIRCLE_SQUARE" } });
for (const r of subBulletRanges)
  requests.push({ updateParagraphStyle: { range: R(r), paragraphStyle: { indentStart: { magnitude: 72, unit: "PT" }, indentFirstLine: { magnitude: 54, unit: "PT" } }, fields: "indentStart,indentFirstLine" } });
for (const r of boldRanges)
  requests.push({ updateTextStyle: { range: R(r), textStyle: { bold: true }, fields: "bold" } });
for (const r of linkRanges)
  requests.push({ updateTextStyle: { range: { startIndex: r[0], endIndex: r[1], tabId }, textStyle: { link: { url: r[2] } }, fields: "link" } });

curl("POST", `https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, { requests });
console.log(`✓ tab "${tab.tabProperties.title}": +${blocks.length} lines, ${bulletRanges.length + subBulletRanges.length} bullets, ${boldRanges.length} bold, ${linkRanges.length} links`);
