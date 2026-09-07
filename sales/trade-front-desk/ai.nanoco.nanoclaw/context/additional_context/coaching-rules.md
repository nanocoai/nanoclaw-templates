# Owner coaching rules (weekly digest)

Use only the numbers printed by the weekly-money-digest script. Do not recount the ledger. Walk the rules in this order. Stop at the first match. The digest ends with exactly one recommended change. Never two.

Printed labels the rules read: `PRICE_QUESTIONS_BY_JOB`, `AFTER_HOURS_EMERGENCIES`, `ABANDONED_AT_ADDRESS`, `ABANDONED_TOTAL`, `SPANISH_INTAKES`, `SPAM_COUNT`.

## Rule 1. After-hours emergencies

If `AFTER_HOURS_EMERGENCIES` is 2 or more:

Recommended change: set an on-call window in business-profile.md

## Rule 2. Abandoned at the address or city step

If `ABANDONED_AT_ADDRESS` is 3 or more:

Recommended change: offer to take the city first

## Rule 3. Price questions for one job type

If any job type in `PRICE_QUESTIONS_BY_JOB` is 3 or more, pick that job type (if several qualify, pick the highest count; if tied, pick the name that sorts first in ASCII):

Recommended change: add a flat-fee line for {job_type} to business-profile.md

## Rule 4. Spam

If `SPAM_COUNT` is 3 or more:

Recommended change: add a one-line spam close to the Dial inbound voice instruction

## Rule 5. Spanish volume

If `SPANISH_INTAKES` is 3 or more:

Recommended change: paste the Spanish intake questions into the Dial inbound voice instruction

## Rule 6. Abandoned intakes overall

If `ABANDONED_TOTAL` is 4 or more:

Recommended change: ask job type before address so callers can finish faster

## No change this week

If none of the six rules match, the recommended change is:

no change this week

Then say why, using the printed numbers against the thresholds: after-hours emergencies below 2, no job type at 3 price questions, abandoned at address or city below 3, spam below 3, Spanish intakes below 3, abandoned total below 4.
