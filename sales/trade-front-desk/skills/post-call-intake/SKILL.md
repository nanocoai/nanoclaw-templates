---
name: post-call-intake
description: Use after a Dial voice call ends or a call.transcribed event. Fills intake from the transcript, confirms by text, runs ledger-append, and sends the caller receipt when complete.
---

# Post-call intake

## Steps
1. Read the transcript or call-ended notice.
2. Fill intake fields you can verify. Leave gaps unmarked rather than inventing.
3. If emergency phrases appeared in the call, stop and run emergency-escalate instead. Do not send a confirmation text. Do not run ledger-append again (emergency-escalate already appended `outcome=emergency`).
4. Otherwise, text the caller in their language: short confirmation of what was captured and the offered callback window; ask only for the next missing field. Spanish copy: `additional_context/spanish-intake.md`.
5. When complete, and only if this call has not already been ledgered as `outcome=emergency`, run the ledger-append skill with `channel=voice` and `outcome=complete`, then send the caller receipt.
6. If the caller is silent 30 minutes with fields still missing, run ledger-append with `outcome=abandoned` per `additional_context/failure-modes.md`.
7. On any other call-end close (spam), still run ledger-append so the call has a line. Do not run ledger-append again if this call already has `outcome=emergency`.

## Rules
- The voice call was Dial's AI; you work from the transcript.
- Same validation as job-intake.
- No prices. No third-party dial.
- Follow the text rules in instructions.md.
