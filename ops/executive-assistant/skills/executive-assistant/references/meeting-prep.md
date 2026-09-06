# Meeting Prep

Make sure the executive never walks into a meeting cold. Produce a short brief
and attach the materials.

## Steps

1. **Pull the meeting** — `calendar_get_event`: attendees, subject, any attached
   docs or notes, and the thread that created it.

2. **Research the attendees / company (Exa)** — only what's useful for this
   meeting:
   - `exa_search`: "[person or company] recent news OR role OR announcement"
   - `exa_get_contents`: pull the top 1–2 results for detail.
   - For internal recurring meetings, pull the last meeting's notes/action items
     instead.

3. **Write the brief** — 3–5 bullets, in this order:
   - **Who**: attendees, their roles, one relevant fact each.
   - **Why**: the purpose of this meeting in one line.
   - **Desired outcome**: what "success" looks like for the executive.
   - **Watch-outs / context**: open items, prior commitments, anything sensitive.

4. **Attach & deliver** — add the brief and any agenda/pre-reads to the event or
   send it to the executive ahead of time (timing per their preference — e.g.,
   evening-before or 30 min prior).

## Rules
- Relevance over volume — a tight brief beats a research dump.
- Cite sources for external facts; never invent a bio or a number.
- Flag if a meeting has no agenda or unclear purpose — that's often worth
  questioning before it happens.

## Hard stops
- No verifiable info on an attendee → say so; don't fabricate background.

Handle related travel → `references/travel-logistics.md`
