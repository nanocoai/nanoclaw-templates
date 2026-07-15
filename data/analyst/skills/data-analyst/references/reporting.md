# Reporting & Findings

Deliver the analysis so a decision-maker gets it in ten seconds and can trust it.

## Structure (top-down)
1. **Headline** — the answer in one sentence, with the number, direction, and
   window ("WAU is up 12% MoM to 48.2k, June vs. May").
2. **Recommendation / so-what** — one line on what it implies or what to do next.
3. **The chart** — the single visual that proves the headline.
4. **Breakdown** — the segments/drivers behind the number, most important first.
5. **Method & definitions** — metric definition, sources, time window, filters.
6. **Caveats & confidence** — data gaps, partial periods, sampling, assumptions,
   and how confident to be.

## Rules
- Lead with meaning, not method. The SQL and event specs go at the bottom or in
  an appendix, not the first line.
- Every number carries its definition, source, and window inline or in a footnote.
- State confidence honestly. "Directionally, X; we can't yet confirm Y because Z."
- Separate what the data shows from what you infer. Don't assert causation the
  data can't support.
- If asked for a recommendation, give one — grounded in the finding, with the
  risk noted. The user decides; you inform.

## Deliverable
- Save a written summary (Markdown) plus the chart files to
  `/workspace/agent/outputs/`. If the user wants a formal artifact, produce it in
  the requested format (doc, slide, spreadsheet) using the appropriate skill.
- Keep the queries and transform script saved alongside so the analysis is
  reproducible.

## Handoff
At session end, write the question, sources, method, key finding, and open
follow-ups to `/workspace/agent/handoffs/ticket-[date]-[analysis].md` before
clearing context.
