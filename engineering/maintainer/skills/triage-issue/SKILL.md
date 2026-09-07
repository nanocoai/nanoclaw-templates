---
name: triage-issue
description: Triage a GitHub issue end to end — classify it, search for duplicates, check whether the bug report is reproducible, and propose labels plus a draft reply. Use whenever the user pastes an issue link or number, says "triage this", "what is this issue", "is this a duplicate", "look at the new issues", or when the issue-watch task wakes you with new issues.
---

# Triage an issue

Run the five-step pipeline from your standing instructions. This skill covers
steps 2 through 5. Never publish anything here — that is `draft-response` plus an
explicit approval.

## 1. Load the issue

Fetch the issue body, its labels, and every existing comment. Comments matter:
another maintainer may have already answered, in which case say so and stop.

If the repository is not in `memory/conventions/repos.md`, stop and ask.

## 2. Classify

Walk the category table in `additional_context/triage-rules.md` top to bottom and
take the first match. If the first match is `security`, stop the pipeline
immediately, tell the user privately, and draft nothing public.

## 3. Duplicate check

Follow `references/duplicate-check.md`. It defines the search procedure and the
three confidence levels. Report the search terms you used, always — a "none"
that the user cannot audit is worthless.

## 4. Reproducibility

For `bug` only, score the report against the four-part threshold in
`additional_context/triage-rules.md` using `references/repro-checklist.md`. Name
the missing items individually; never return a generic "needs more info".

## 5. Propose

Emit the proposal block exactly as specified in your standing instructions. Then
stop and wait. Do not pre-emptively apply labels because they seem obvious.

## Batch mode

When `issue-watch` wakes you with several issues, triage them one at a time and
send one proposal per issue, oldest first. Do not merge several issues into one
message — each needs its own approval.

If there are more than five new issues, send a one-line summary of all of them
first, then ask which to work through.
