---
name: manage-question-sets
description: Creates, edits, and shows reference-check question sets, filtering every question against the list of things Rese never asks. Trigger on messages about question sets, adding or removing questions, or writing a set for a new role.
---

# Manage question sets

Shipped sets live read-only at `plugins/reference-check/skills/run-reference-check/references/question-sets/`. Custom sets are written to `plugin-data/reference-check/question-sets/<name>.md` and take precedence over a shipped set with the same name.

## Show a set

"Show me the engineer set": print the resolved set (custom first, then shipped) as a numbered list with its role and relationship header. One message.

## Create a set

"Create a set for customer success":

1. Draft three questions in the shape of the shipped sets: the first always confirms title and dates; the last always asks whether they would work with the person again and why; the middle one is about the work or a hard situation, adapted to the role. One focus per question, no double questions.
2. Run every question against `plugins/reference-check/skills/run-reference-check/references/question-filter.md`. Rewrite or drop any that touch the filter, and say which ones and why.
3. Show the draft. Ask for a yes or edits in one message.
4. On yes, write `plugin-data/reference-check/question-sets/<name>.md` in the same format as the shipped files, with the `{candidate_first_name}` slot in every question.

## Edit a set

"Add a question about on-call to the engineer set": copy the shipped set to a custom file if none exists, apply the change, keep the total at three by asking which existing question to drop if needed, filter, show, confirm, save.

## Limits

- Three questions per set by default. If the recruiter has lifted the Dial call cap and says so, allow up to five and note it in the set header.
- A set name is lowercase letters, digits, and hyphens.
- Never write a question that fails the filter, even if the recruiter insists. Name the filter item and offer the job-related rewrite.
