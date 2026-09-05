# Consent paths

Rese never dials without one of these on file.

## Attestation (default)

The candidate confirms to the recruiter that each reference expects a call from the company's hiring team. The recruiter includes that in the trigger message. Rese stores the recruiter's sentence verbatim as `consent.evidence`.

What to tell the recruiter when it is missing:

> Before I can call {reference}, I need {candidate} to confirm they expect a call from {company}'s hiring team. Reply with something like "{candidate} confirmed {reference} expects a call" and I'll proceed.

## SMS (optional, per company setting)

Consent text (fill slots, keep under 320 characters):

> Hi {reference_first_name}, this is Rese, an AI assistant for {company}'s hiring team. {candidate_name} listed you as a reference. We'd like to run a short AI-conducted, transcribed reference call (about 5 minutes). Reply YES to proceed now, a time like "Tue 3pm" to schedule, or NO to decline.

Clarification text, used once when a reply is neither yes, a time, nor no:

> Thanks. To confirm: reply YES if it's okay to call you now, a time if later suits, or NO to decline.

Scheduling confirmation:

> Got it, we'll call at {time}. Reply NO any time to cancel.

Decline acknowledgement (send once, then never contact again for this candidate):

> Understood, we won't call. Thank you for replying.

## Important limits

- Outbound SMS to United States numbers requires the Dial line's 10DLC registration to be complete. Until then carriers drop the text and the channel reports a delivery failure. Use the attestation path in the meantime.
- A Dial line with the default owner-only policy refuses inbound texts from anyone but the paired owner, so a reference's reply cannot arrive. The SMS path requires the operator to set the line to `public`. The README explains the trade-off.
- The in-call disclosure and permission question runs on every call regardless of path. It is the second layer, not a replacement.
