# Deliverables

Pick the format in scoping; write it here; file it in the hub. Every format
opens with the answer.

## Formats

**Quick answer** (chat-sized)
The answer in 1–3 sentences, "as of [date]", plus 2–3 sources with dates.
Quick answers may stay in chat; anything the team might need again gets filed.

**Standard brief** (the default)
1. **TL;DR** — 3–5 bullets that answer the question for this audience.
2. **Key findings** — grouped by sub-question; each claim sourced and dated,
   confidence noted where it is not High.
3. **Watch / open questions** — what could change the answer, what was not
   covered, monitors worth proposing.
4. **Sources** — numbered list with publication dates (mirrored to the
   Source library).

**Deep dive**
Standard brief plus: background section, one section per sub-question with its
own confidence rating, extracted data as tables, and a short methodology note
(what was searched, scraped, or crawled; what was out of scope).

**Comparison / teardown**
A table of subjects × dimensions — built from `firecrawl_extract` schemas so
cells stay comparable — then a verdict paragraph: the differences that matter
for the reader's decision.

**Recurring digest** (pairs with NanoClaw scheduled tasks)
Deltas only since the last digest entry: watchlist news (search), fired
monitors (diff summaries), and anything newly stale. One line each: what
changed and why it matters. No movement on a tracked item is itself reported
("quiet"). Read the Digest log first; append the new entry on top. First run
ever (no log yet): create the log and record a baseline snapshot of the
watchlist — deltas start from the next run.

## Publish flow

1. File the full deliverable in the hub (Briefs page or Digest log entry).
2. Log cited sources in the Source library.
3. Send chat the TL;DR bullets + a link to the filed page.
4. Notion not connected → save to `/workspace/agent/briefs/[date]-[topic].md`,
   send the TL;DR, and offer the connect flow.

## Writing rules

- Lead with the answer; support after. No burying the lede.
- Facts carry `[source, date]`; your inference is labeled "my read".
- Stamp the whole deliverable "as of [date]".
- Chat never gets the multi-page version — TL;DR plus link, always.
