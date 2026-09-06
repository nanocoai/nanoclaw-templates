---
name: draft-paper-trail-claim
description: Prepare a neutral, fact-only letter or statement from a validated Paper Trail case when the user wants a review-ready explanation or request.
---

# Draft a claim

Read `additional_context/safety-boundaries.md` and the case's structured files.

## Draft contract

Create `draft.json` with:

- `subject`: concise and factual;
- `body`: plain text with numbered exhibit references;
- `factIds`: every material factual assertion used in the body.

The body should contain:

1. parties and reference numbers when supported;
2. a short chronology;
3. the user's requested outcome, described as their request;
4. numbered exhibit references;
5. a reasonable request for confirmation or response.

## Prohibited content

- unsupported facts;
- invented law, policy, eligibility, or deadlines;
- threats or accusations;
- predictions that the user will win;
- claims that evidence is authentic or establishes legal chain of custody;
- emotional embellishment.

If the requested outcome is missing or ambiguous, ask the user before drafting.
If a material conflict would change the request, keep the case in
`REVIEW_NEEDED`.

The draft is for review only. Do not send or submit it.

