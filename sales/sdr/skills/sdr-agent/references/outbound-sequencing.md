# Outbound Sequencing

Draft signal-led outreach and a 3-touch sequence. Never send without approval.

## Pre-flight checklist (run before drafting)
- [ ] Verified email exists in HubSpot
- [ ] Unsubscribe status = subscribed
- [ ] No open deal exists for this contact
- [ ] Prospect brief note exists on the company record
- [ ] User has not excluded this contact manually

## Drafting a first-touch email

1. Pull the prospect brief note from HubSpot (`hubspot_get_company` → notes).
2. Pick the single strongest signal from the brief.
3. Draft using this structure:
   - **Line 1**: Specific signal reference ("Saw you just closed your Series B…")
   - **Line 2**: One-sentence problem you solve for companies at that stage.
   - **Line 3**: One-line proof point (customer name or stat, only if approved for use).
   - **Line 4**: Ultra-low-friction CTA ("Worth a 15-min chat this week?")
4. Subject line: reference the signal directly. Max 8 words.
5. **Present the draft to the user for approval before any send or enrolment.**

## Sequence structure (3-touch, 2-week cadence)
- Touch 1 (Day 0):  Email: signal-led intro
- Touch 2 (Day 5):  LinkedIn connection note (draft only, no auto-send)
- Touch 3 (Day 12): Email: different angle (challenge/stat, not the same signal)

After 3 touches with no reply: move to the HubSpot "Nurture" stage.

Enrolment → `references/crm-hygiene.md`
