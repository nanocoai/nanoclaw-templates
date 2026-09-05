---
name: run-reference-check
description: Runs a consent-first AI reference call over the Dial line and writes a neutral summary. Trigger when a message names a candidate and at least one reference with a phone number, or when a Dial call-ended notice arrives for a call Rese placed.
---

# Run a reference check

Eight steps, always in this order. Each step names the file it reads or writes. Do not skip a step because the recruiter seems to be in a hurry; the same message must produce the same behaviour every time.

Paths below are relative to the agent workspace. The plugin copy is read-only at `plugins/rese/`; state goes in `plugin-data/rese/`.

## 1. Intake

Parse the recruiter's message into:

- candidate name and the role they are being considered for
- question set name (fall back to `default_set` from `plugin-data/rese/company.md`)
- for each reference: name, phone number in E.164, relationship to the candidate (manager, peer, report, client), organisation, and the dates the candidate claims they worked together
- whether the candidate attested that the references expect a call (any wording like "Maya confirmed both references expect a call" counts; record it verbatim)

Example trigger:

> Reference check for Maya Chen, senior engineer, set: engineer. References: Jordan Lee +14155550123, former manager at Acme 2022 to 2025; Priya Nair +16465550188, peer at Acme. Maya confirmed both expect a call this week.

Normalise phone numbers to E.164. If a number cannot be normalised, or any reference lacks a name or a number, ask for everything missing in one message and stop until it arrives.

Create the slug for the candidate (`maya-chen`) and for each reference (`jordan-lee`). Write `plugin-data/rese/checks/<candidate>/<reference>.json`:

```json
{
  "candidate": "Maya Chen",
  "role": "senior engineer",
  "question_set": "engineer",
  "reference": { "name": "Jordan Lee", "phone": "+14155550123", "relationship": "former manager", "org": "Acme", "dates_claimed": "2022 to 2025" },
  "consent": { "path": null, "evidence": null, "at": null },
  "call": { "id": null, "idempotency_key": null, "placed_at": null, "status": null, "duration_seconds": null },
  "summary_path": null,
  "created": "2026-09-06T10:12:00Z"
}
```

## 2. Confirm

Reply with what you parsed and what you will ask, in this shape, then wait:

> Maya Chen, senior engineer. Reference: Jordan Lee, former manager at Acme, 2022 to 2025. Consent: candidate attestation on file. Set: engineer.
> I'll ask: (1) title and dates, (2) what Maya worked on with you that stands out, (3) whether you'd work with Maya again and why.
> Reply **go** to call now, or tell me what to change (different set, add or drop a question, another reference).

Apply any change to the record and show the updated version once. Only "go" (or an equivalent) moves to step 3. If the original request said to go ahead without confirming, skip this step and say so in one line.

## 3. Consent

Read `references/consent-paths.md` and apply the path from `company.md`.

- If the recruiter's message included a candidate attestation, record it: `consent.path = "attestation"`, `consent.evidence = "<verbatim sentence from the recruiter>"`, `consent.at = now`. Go to step 4.
- If there is no attestation and the path is `attestation-only`, tell the recruiter in one message what to ask the candidate and stop. Copy the record into `plugin-data/rese/pending/`. The check resumes when the recruiter sends the attestation.
- If there is no attestation and the path is `sms`, send the consent text from `references/consent-paths.md` with `dial message`, then wait for a reply in short loops (`dial wait-for` allows at most 60 seconds per call):

```
dial message --to +14155550123 --from-number <from_number> --body "<consent text>" --json
dial wait-for message.received --field from=+14155550123 --timeout 60
```

Loop the wait up to ten times. A reply starting with yes, ok, or sure is consent: record `path = "sms"`, `evidence = <body>`, `message id`, `at`. A reply with a time is a scheduling request: acknowledge it and copy the record to `pending/` with the requested time. A reply of no, stop, or similar is a decline: record it, tell the recruiter, and never contact that number again for this candidate. Anything else: answer once with the clarification text, wait once more, then treat silence as pending.

A `[NanoClaw system notice: … not delivered]` on the line means the text bounced (on US numbers this is usually 10DLC registration still pending). Stop texting that number, tell the recruiter, and offer the attestation path.

Never proceed to step 4 without `consent.path` set to `attestation` or `sms`.

## 4. Place the call

Build the outbound instruction from `references/call-script.md`. Fill every slot: company, recruiter, candidate, reference first name, retention days, and the three questions from the set as plain sentences with the numbers stripped (the `{question_list}` slot). Use the template text exactly; do not add rules to it (see the field note in `call-script.md`). Resolve the set in this order: `plugin-data/rese/question-sets/<name>.md`, then `plugins/rese/skills/run-reference-check/references/question-sets/<name>.md`. Cross-check every question against `references/question-filter.md` even though sets are checked when created.

Set `idempotency_key = "<candidate-slug>-<reference-slug>-1"` (increment the trailing number only for a deliberate second attempt after a no-answer). Write it to the record before dialling.

```
dial call --to +14155550123 --from-number <from_number> --idempotency-key maya-chen-jordan-lee-1 --language <language or omit for auto> --outbound-instruction "<script>" --json
```

Immediately write the returned call id, `placed_at`, and `status = "initiated"` to the record, and copy the record into `plugin-data/rese/pending/`. Only then tell the recruiter: "Calling Jordan now. I'll send the summary when the transcript is in."

If the command fails without returning an id, run `dial call list --direction outbound --since <placed_at minus 5 minutes>` and look for a call to that number. If one exists, use its id. If none exists, retry once with the same idempotency key. A `429 call_limit_reached` means the account is at its concurrent-call cap: wait five minutes, then retry with the same key.

## 5. Wait for the transcript

When the Dial channel is wired to this agent, the call-ended notice and the transcript arrive in the conversation on their own. Do not poll while waiting for that; end your turn after step 4.

When a notice arrives, or when the recruiter asks about a call, fetch the full record rather than relying on the inline transcript, which is clipped:

```
dial call get <call_id> --json
```

If `transcript` is null and `status` is `completed`, the transcript is still processing. Wait in loops of `dial wait-for call.transcribed --field callId=<call_id> --timeout 60`, at most five times, then fetch again. If `status` is `no-answer` or `busy`, follow `references/failure-playbook.md`. Update `call.status` and `call.duration_seconds` in the record.

## 6. Summarise

Write `plugin-data/rese/checks/<candidate>/<reference>-summary.md` following `references/summary-format.md` exactly. Read the transcript twice before writing: first to map each answer to its question, then to pull verbatim quotes. Paraphrase anything not quoted. Mark questions the reference declined or that were never reached.

Verification flags come only from the transcript: title confirmed or differs, dates confirmed or differ, would-rehire answered or not asked. Never infer.

Delete the record from `plugin-data/rese/pending/` and set `summary_path` in the record.

## 7. Deliver

Send the summary file with `send_file`, then the five-line digest defined in the summary format, into the thread where the check was requested. Nothing else. If the recruiter asks for an opinion, quote hard rule 5 in one sentence.

## 8. Log

Append one line to `plugin-data/rese/log.md`: date, candidate slug, reference slug, consent path, call id, status, duration, summary path. The retention task reads this log.

## Small changes

"Call Priya first", "use the manager set for Jordan", "cancel the check for Maya": edit the record, confirm in one line, and continue from the step that changed. Never restart intake for a small change.
