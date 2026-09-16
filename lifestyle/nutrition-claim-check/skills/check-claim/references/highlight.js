// Hides cookie banners and fixed overlays, then highlights the first occurrence of QUOTE
// in yellow and scrolls it into view. Prints "highlighted" or "not found".
// Run with: agent-browser eval --stdin < highlight-N.js   (after replacing QUOTE with the exact text)
(() => {
  for (const el of document.querySelectorAll('[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],[id*="CybotCookiebot" i],[id*="onetrust" i],[class*="gdpr" i]')) el.remove();
  for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().height > 80) el.style.display = 'none'; }
  const q = "QUOTE";
  let found = window.find(q, false, false, true, false, false, false);
  if (!found) { const short = q.split(/\s+/).slice(0, 8).join(" "); found = window.find(short, false, false, true, false, false, false); }
  if (!found) return "not found";
  const sel = window.getSelection();
  const range = sel.getRangeAt(0).cloneRange();
  const style = document.createElement("style");
  style.textContent = "::highlight(nina){background:#fde047;color:#111}";
  document.head.appendChild(style);
  CSS.highlights.set("nina", new Highlight(range));
  (range.startContainer.parentElement || document.body).scrollIntoView({ block: "center" });
  sel.removeAllRanges();
  return "highlighted";
})()
