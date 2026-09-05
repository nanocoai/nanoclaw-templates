# Summary format

File: `plugin-data/rese/checks/<candidate-slug>/<reference-slug>-summary.md`. Follow the skeleton exactly. Do not add sections. Do not add adjectives about the reference or the candidate that are not in the transcript.

```
# Reference summary: {candidate_name}

Reference: {reference_name}, {relationship} at {org}
Dates the candidate claimed: {dates_claimed}
Dates the reference confirmed: {dates_confirmed | "not confirmed" | "differs: …"}
Call: {call_id}, {date}, {duration_seconds} s, status {status}
Consent: {path}, recorded {consent_at}
Question set: {set_name}

## Answers

### 1. {question text}
Paraphrase: …
Quote: "…"
Status: answered | partial | declined | not reached

### 2. …

## Verification
- Title: confirmed | differs ("…") | not covered
- Dates: confirmed | differ ("…") | not covered
- Would work with them again: answered ("…") | not asked | declined

## Follow-ups a human may want to ask
- …

## Notes
- Anything the reference volunteered that was not a question, paraphrased. Omit anything the filter excludes, even if the reference raised it.
- Call ended early by reference: yes | no
- Transcript quality: fine | low confidence (short, garbled, or one-sided)

Rese does not score references or recommend a hiring decision. The decision stays with the hiring team.
```

## Rules

- One quote per question at most, verbatim from the transcript, inside quotation marks. If the transcript has no usable quote, write `Quote: none`.
- `partial` means the reference started answering and stopped or was cut off. `declined` means they said they would rather not. `not reached` means the call ended before the question.
- The closing sentence is fixed text. Never remove or reword it.

## Chat digest

Sent right after the file, five lines, no headings:

```
{reference_name} ({relationship}) for {candidate_name}: done, {duration_seconds} s, consent via {path}.
Dates: {confirmed | differ | not covered}. Title: {confirmed | differs | not covered}.
"{most useful quote 1}"
"{most useful quote 2}"
Flags: {none | list of declined/partial/not reached questions and any low-confidence note}
```
