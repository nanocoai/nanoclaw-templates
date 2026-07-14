# Reference: Writing to the doc (ALWAYS use the formatter)

**Do NOT hand-craft Google Docs `batchUpdate` calls for formatting.** It's
unreliable — you end up dumping plain text with no bullets, indentation, or links
(and this doc has tabs, which makes the index math worse). Instead, write each
section as **plain Markdown** and let the helper render it with real formatting.

## The loop (per section)

1. Compose the section as Markdown (see conventions below) and write it to a temp
   file, e.g. `/workspace/agent/_section.md`.
2. Render it into the doc's **About** tab:
   ```bash
   bun /workspace/agent/skills/competitor-analysis/scripts/render-section.js \
     <docId> /workspace/agent/_section.md "About"
   ```
   (Use `"Recent News"` as the tab name when filling that tab.)
3. The helper appends the section to that tab with native bullets, sub-bullet
   indentation, bold, and every hyperlink. It prints a summary line — check it
   applied the bullets/links you expected.
4. Move to the next section.

## Markdown → formatting

Compose each section in plain Markdown. `render-section.js`'s header comment lists
exactly what it renders — anything else (`#` headers, tables, code blocks) comes out as
literal text, so skip it. Which elements must be linked, and the no-fabricated-URLs rule,
live in `doc-structure.md` ("Hyperlinking rules").

## Example section (what you pass the formatter)

```markdown
What problem do they solve?

Manual feature engineering blocks ML adoption at scale
- Teams spend weeks hand-building features before a model ships, so ML stays bottlenecked on data engineering.

Relational data doesn't fit traditional ML pipelines
- Business data spans many linked tables, but classic models need one flat table — forcing lossy joins.
```
