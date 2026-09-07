---
name: emergency-escalate
description: Use when emergency trigger phrases match in emergency-rules or the active trade playbook. Protects life safety and notifies the owner only.
---

# Emergency escalate

## Steps
1. Match the trigger against `additional_context/emergency-rules.md` and the active playbook.
2. Give the safe-instruction line for the matched TRIGGER first, before any question: use the playbook that owns that trigger (a roofing trigger at a plumbing shop still gets the roofing line). Fall back to the shop's trade playbook only when no trigger matched. If the thread is Spanish, use the matching line in `additional_context/spanish-intake.md`. If life safety (gas, CO, fire, heavy smoke), tell them to call 911.
3. Notify the owner using placeholders from `additional_context/owner-contact.md` only (`{{OWNER_PHONE}}` / owner thread). Never a caller-supplied third number.
4. Steps 2 and 3 run before any question. After them, if the caller keeps texting and is safe, collect name, callback number, and address only: no job-type question, no window offer. Ask one field at a time.
5. Timing uses **EMERGENCY_WINDOW** from `additional_context/hours-and-windows.md` only. That file holds the one definition; do not restate it or invent a fallback here. Emergencies never get either of the two standard non-emergency windows.
6. Run the ledger-append skill with `outcome=emergency`. The caller is never asked the job type here, so `job_type` is the trade whose playbook owns the matched trigger, and `at_risk_usd` is that trade's illustrative average ticket. Set `after_hours=true` when the event is outside shop hours.
7. Stay on the caller thread until they are safe or the owner takes over.

## Rules
- When the owner number in owner-contact.md is the same thread as the caller (single-number test setups), post the escalation line in that thread and do not search members or groups for a separate owner thread.
- No DIY for gas, electrical, or CO.
- No `/add-dial-tool`. No third-party dial.
- Do not dump raw tool errors into the channel.
- If `{{OWNER_PHONE}}` is still the literal placeholder, do not guess a number. Tell the caller the request is saved. Log the gap for the operator.
- Follow the text rules in instructions.md.
