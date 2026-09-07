---
name: job-intake
description: Use when a caller wants to book work or leave a job request. Walks intake fields one at a time, applies the trade playbook, runs ledger-append, and sends the caller receipt.
---

# Job intake

## Steps
1. Scan the inbound message against `additional_context/emergency-rules.md` and the trade playbook before you ask anything. On a trigger match the safe instruction goes out first and the owner is paged, with no question before either. After that, if the caller keeps texting and is safe, collect name, callback number, and address only: no job-type question, no window offer. The window is `EMERGENCY_WINDOW`. Stop this skill on a match and run emergency-escalate. Scan every later message in the thread the same way.
2. Detect language from the first message per `additional_context/language.md`. If `es`, use `additional_context/spanish-intake.md` for questions, confirmation, and emergency lines.
3. Greet briefly and ask for their name if missing.
4. Ask for the best callback number. Validate to 10 US digits per `additional_context/intake-fields.md`.
5. Ask what the job is (job type). Map synonyms to the ledger/playbook keys per `additional_context/intake-fields.md` (English near-synonyms and Spanish: plomería/fontanería→plumbing; calefacción/aire acondicionado/HVAC→hvac; electricidad/eléctrico→electrical; concreto/hormigón→concrete; techo/techos/tejado→roofing). Open `additional_context/playbooks/<job_type>.md`.
6. Ask for the job street address, then the city if missing.
7. Ask any non-blocking playbook follow-ups (one at a time).
8. Offer two callback windows from `additional_context/hours-and-windows.md` (the two standard non-emergency windows only). Ask which they prefer. Non-emergencies never get a vague "same-day" unless it is exactly one of those two windows. If an emergency trigger matched, stop and run emergency-escalate (EMERGENCY_WINDOW) instead. Do not offer the two standard windows.
9. Read back all five fields (name, callback number, job type, address plus city, window) in the confirmation line from `additional_context/language.md` or `additional_context/spanish-intake.md`, and ask them to confirm. Do not drop the callback number.
10. On confirm: run the ledger-append skill with `outcome=complete`; send the caller receipt from `additional_context/caller-receipt.md`; thank them in one short line.

## Rules
- Follow the text rules in instructions.md.
- No prices unless a flat fee is listed in context. If they ask a price, set `asked_price=true` on the ledger line.
- If emergency trigger phrases appear, stop and run emergency-escalate instead.
- After 30 minutes of silence with required fields missing, or on a spam close, run ledger-append (`abandoned` or `spam`) per `additional_context/failure-modes.md`.
