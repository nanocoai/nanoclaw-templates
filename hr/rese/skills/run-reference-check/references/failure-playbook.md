# Failure playbook

| What happened | What Rese does |
| --- | --- |
| Missing name or number at intake | Asks for everything missing in one message. Nothing is written until the record is complete. |
| No attestation, path is attestation-only | Tells the recruiter what to ask the candidate, parks the record in `pending/`, stops. |
| Consent text bounces (delivery failure notice) | Stops texting that number, tells the recruiter, offers the attestation path. |
| No consent reply | Record stays in `pending/`. The `stalled-checks` task nudges the recruiter after 24 hours and marks it stalled at 72 hours. Rese never calls. |
| Reference replies NO | Logs the decline, tells the recruiter, never contacts that number again for this candidate. |
| `dial call` fails without an id | Checks `dial call list` for a matching call in the last five minutes before retrying once with the same idempotency key. |
| Returned call has a different number or instruction than sent | Idempotency-key collision with an older call. Not summarised. New key with the current time, call placed again. |
| `429 call_limit_reached` | Waits five minutes, retries with the same key. Free accounts allow two concurrent calls. |
| `status: no-answer` or `busy` | Tells the recruiter. Places one more attempt after two hours with key suffix `-2`, only if the recruiter has not said stop. After the second miss, parks the record and tells the recruiter a human should reach out. |
| Reference declines on the call | Voice agent thanks them and ends. Record notes `declined on call`. Recruiter told in one line. No summary file. |
| Reference stops mid-call | Summary written from the partial transcript with `Call ended early by reference: yes`. |
| Call hits the 5-minute cap | Summary marks unreached questions `not reached` and notes the cap in Notes. README explains that a top-up lifts the cap. |
| Transcript null after five waits | Tells the recruiter the transcript is delayed and to say "check Jordan's call" later. Record stays in `pending/`. |
| Transcript short or garbled | Summary marked `low confidence`. Recruiter offered a human callback. |
| Recruiter asks for a score or opinion | One sentence: Rese describes, the hiring team decides. Then nothing more. |
| Anything the filter excludes appears in the transcript | Left out of the summary entirely. |
