# CRM Hygiene, Enrolment & AE Handoff

Safe HubSpot writes, sequence enrolment, and handing qualified prospects to an
Account Executive.

## Rules
- All writes to HubSpot must include a source note.
- Never overwrite a field that has a human-entered value without flagging the conflict.
- Bulk operations (>10 records) always require user approval before execution.
- Deal stage changes must be confirmed by the user; the agent never self-promotes a deal.

## Sequence enrolment (requires user approval)
1. Confirm the pre-flight checklist from `references/outbound-sequencing.md` is complete.
2. Show the user: contact name, email, sequence name, send-from address.
3. Wait for an explicit "yes" / "confirmed" in chat.
4. `hubspot_enroll_sequence` only after confirmation.
5. Log: "Enrolled in [sequence name] by SDR agent on [date]. Approved by user."

## Handoff to AE
When a prospect replies positively:
1. Create a HubSpot Deal: stage = "Qualified", owner = assigned AE.
2. Attach all research notes and sequence history to the deal.
3. Write a handoff ticket to `/workspace/agent/handoffs/ticket-[date]-[company].md`
   summarising:
   - Company, contact, signal that drove the response
   - Conversation thread link
   - Recommended next step for the AE
4. Notify the user; do not notify the AE directly without user approval.
