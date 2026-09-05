# Rese: consent-first reference checks by phone

Rese runs the reference call so the recruiter does not have to. One message names the candidate, the role, and the references. Rese confirms consent is on file, places an AI-voiced call through your Dial line, asks the company's question set, and returns a neutral summary: paraphrased answers, verbatim quotes, and flags for what was confirmed, what differed, and what was not covered. It never scores, ranks, or recommends.

**What Rese deliberately does not do:** score or grade references, recommend a hiring decision, search the web for the candidate or the reference, call anyone without a consent record, ask about protected characteristics, health, legal history, or pay, contact a reference again after they decline, or hide that it is an AI.

## Who it is for

Recruiters and hiring managers at companies without an enterprise applicant-tracking system that already bundles reference automation. Rese runs on your own NanoClaw install with your own Dial account, so no third party sees the transcripts. It is readable and forkable: the question sets, the call script, and the summary format are Markdown files you can edit.

## Services

| Service | Host | Auth | Cost | Notes |
| --- | --- | --- | --- | --- |
| [Dial](https://getdial.ai) | `api.getdial.ai` | Bearer API key, held in the OneCLI vault; the key never enters the agent container | Paid, pay-as-you-go with a free tier. You bring your own account. See [Dial pricing](https://getdial.ai/pricing). | The free tier caps calls at 5 minutes and 2 concurrent calls. Any top-up or subscription lifts both. Question sets ship with five questions to fit the cap. |

Rese needs no other service and ships no `mcp.json`. The Dial CLI is installed into the agent container by NanoClaw's `/add-dial-tool` skill, which pins the CLI version and stores the key in the vault.

**Outbound SMS to United States numbers** requires 10DLC registration of your Dial number, done in the Dial dashboard, which usually takes 3 to 5 business days. Calls, and texts to non-US numbers, work immediately. Rese's default consent path does not need SMS at all (see below).

## Setup

1. Stamp the template: `ncl groups create --template hr/rese --name "Rese"`.
2. Run `/add-dial` in your NanoClaw checkout if you have not connected Dial yet. Pair your phone as the line's owner. Say yes when it offers `/add-dial-tool`, or run `/add-dial-tool` afterwards and grant Rese's agent group.
3. Wire Rese to where recruiters work. Slack DM is the intended interface. Wire the Slack DM and the Dial line to Rese's agent group with `--session-mode agent-shared`, so the call-ended notice and transcript from the Dial channel land in the same conversation as the Slack request. See [Isolation levels](https://docs.nanoclaw.dev/concepts/isolation-levels). Telegram or any other channel works the same way.
4. Say hello. Rese asks the onboarding questions (company name, recruiter, the Dial line number, default question set, consent path, retention window, call language) and writes `plugin-data/rese/company.md`.
5. Optionally resume the two scheduled tasks, which start paused: `ncl tasks list --group <agent-group-id> --status paused`, then `ncl tasks resume <task-id>`.

## How to run a check

Send one message with the candidate, role, question set, and each reference's name, phone number, relationship, and the dates the candidate claims:

> Reference check for Maya Chen, senior engineer, set: engineer. References: Jordan Lee +14155550123, former manager at Acme 2022 to 2025; Priya Nair +16465550188, peer at Acme. Maya confirmed both expect a call this week.

Rese replies with one line per reference, places each call, and comes back with the summary file and a five-line digest when each transcript is in. Shipped question sets: `default`, `engineer`, `manager`, `sales`. "Create a set for customer success" starts the question-set skill.

## Consent

Rese never dials without a consent record.

- **Attestation (default):** the candidate confirms to the recruiter that each reference expects a call, and the recruiter says so in the trigger message. Rese stores that sentence verbatim.
- **SMS (optional):** Rese texts the reference and waits for a YES. This needs 10DLC registration for US numbers and a Dial line set to `public`, because an owner-only line refuses inbound texts from anyone but the paired owner. A public line means anyone who knows the number can start a conversation with your agent, so weigh that before switching.

On every call, regardless of path, the voice agent says it is an AI, says the call is transcribed, and asks permission before the first question. A no ends the call.

## Field notes from testing

- **The voice agent hangs up when the line does.** A callee number that drops the call a few seconds after answering (one US test line on a roaming SIM did this every time) shows up in Dial as a short "completed" call with no answers in the transcript. Rese treats it as a failed attempt, parks the record, and tells the recruiter. Test your own line first with one call.
- **The call script is plain prose on purpose.** Every agent turn ends with a question, question numbers are never read aloud, and hang-up conditions are listed last and exhaustively. See `skills/run-reference-check/references/call-script.md` before editing it.
- **Rese checks numbers before dialling.** It refuses to call a number already tied to another reference for the same candidate, and it flags a number that matches the line owner's phone, until the recruiter confirms. Both are deliberate: dialling the wrong person voids the consent record.
- **After editing a shipped file, tell Rese to re-read it.** Within a long session the agent may reuse the script it built earlier.

## Compliance notes

`ai.nanoco.nanoclaw/context/additional_context/compliance-notes.md` explains each rule in plain language: prior consent for AI-voiced calls, disclosure of transcription on every call, no scoring so the tool does not become an automated employment decision tool, the question filter, no web lookups, and retention. It is a design description, not legal advice. If you give candidates an AI-use notice, include Rese in it.

## Data

Everything lives in `plugin-data/rese/` inside the agent group's folder on your host:

- `company.md`: onboarding answers.
- `checks/<candidate>/<reference>.json` and `-summary.md`: the record and the summary.
- `pending/`: records waiting on consent or a transcript, read by the `stalled-checks` task.
- `question-sets/`: custom sets.
- `log.md`: one line per check.

The `retention-purge` task deletes checks older than the retention window (default 90 days). Delete the folder to remove everything.

## Demo

The demo video shows: onboarding, one trigger message in Slack, the phone ringing and the AI disclosure heard on speaker, three questions answered, the transcript notice arriving through the Dial channel, the summary file with the fixed "no score" closing line, and a second check where the reference declines on the call and Rese logs it without a summary.

## Credit

Built by Eva Spexard for the NanoClaw Templates Hackathon, September 2026, Dial track. MIT, like the rest of the registry.
