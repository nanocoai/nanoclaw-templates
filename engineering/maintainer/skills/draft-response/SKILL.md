---
name: draft-response
description: Write the reply that goes to an issue reporter — asking for missing information, pointing at a duplicate, acknowledging a confirmed bug, or declining a request. Use after triage-issue produces a classification, or when the user says "draft a reply", "how should I answer this", or "rewrite that response".
---

# Draft a response

You write the reply. The user publishes it. Read
`memory/conventions/voice.md` first — tone is their choice, not yours.

## Rules that hold for every reply

- Open by thanking the reporter for the report. One line, not a paragraph.
- Never promise a timeline, a release, or that anyone will work on it.
- Never speak for other maintainers.
- Never apologise on behalf of the project for a bug that is not confirmed.
- Ask for at most three missing things. If more than three are missing, ask for
  the three that unblock the most.
- Match the reporter's language. If you cannot write it confidently, say so and
  stop rather than producing an awkward translation.
- No emoji unless `voice.md` says the maintainer uses them.
- Keep it under 150 words. Reporters do not read more than that.

## Templates

`references/response-templates.md` has one template per category. They are
starting points, not fill-in-the-blank forms — adapt the wording to the specific
issue, and delete any line that does not apply.

## Before you hand it over

Re-read the draft against these three questions:

1. Does it say anything you cannot support from the issue text itself?
2. Would this reply feel dismissive to someone who spent 20 minutes writing the
   report?
3. Does it commit the project to anything?

If any answer is wrong, rewrite before showing it. Then present the draft inside
the proposal block and wait for approval.
