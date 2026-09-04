# Duplicate check

## Procedure

1. Extract 3 to 5 distinctive terms from the issue: error strings, function or
   API names, and the specific observable symptom. Skip generic words like
   "error", "crash", "not working".
2. Search the repository's issues for those terms, open and closed. Closed ones
   matter most — a closed duplicate usually already has the answer.
3. Read the top five candidates. Compare the **observable behaviour**, not the
   title. Two issues with the same title and different symptoms are not duplicates.
4. Report the terms you searched, in the proposal, every time.

## Confidence levels

Use exactly these three words.

**confirmed** — Both issues describe the same observable behaviour in the same
component, and nothing in either contradicts the other. You would be willing to
close one pointing at the other.

**possible** — Same symptom, but the component, version, or trigger differs, or
one report is too thin to be sure. State in one sentence what would settle it.

**none** — No candidate matched after searching. Report the terms used.

## Rules

- Never say "confirmed" based on title similarity alone.
- Never say "confirmed" when one of the two reports has insufficient repro. A
  vague report cannot be a confirmed duplicate of anything.
- If the older issue is closed as fixed and this one is on a newer version, it is
  not a duplicate — it is a regression. Say that word explicitly in the proposal.
- Never propose closing anything. You report the relationship; the user acts.
