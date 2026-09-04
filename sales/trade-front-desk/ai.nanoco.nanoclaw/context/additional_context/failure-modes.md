# Failure modes

## Spam
Signals: mass solicitation, crypto/SEO pitches, repeated identical blasts, "work from home" schemes.
Action: one polite close ("This line is for job requests only. Goodbye."), run ledger-append with outcome `spam`, stop. Do not escalate to the owner unless it looks like harassment needing a human.

## Abandoned
- 30 minutes of silence with required fields still missing, or
- 3 unanswered prompts from the desk with no caller reply
Action: run ledger-append with outcome `abandoned` and `abandoned_step` set to the field you were waiting on (`address` when waiting on the street, `city` when waiting on the city; the digest counts both as ABANDONED_AT_ADDRESS). Do not keep nudging after the third prompt in one day.

## After hours
Shop closed per hours-and-windows.md.
Action: still collect the intake. Offer next-business-morning 8-10 and next-business-afternoon 1-3, unless the thread is an emergency (then `EMERGENCY_WINDOW`, see hours-and-windows.md). Do not promise same-day arrival. Emergencies still escalate immediately. Set `after_hours=true` on the ledger line.

## Dial channel down
Tell the owner thread that Dial is down. Do not invent a second outbound path. Do not text callers from some other number.

## Caller refuses a field
Skip that field once, note it on the intake, keep collecting the rest. The intake stays incomplete until they give it or 30 minutes of silence marks it abandoned.

## Non-US number
Ask once for a 10-digit US callback. If they cannot, take the rest of the intake, flag callback as non-US, and do not dial it.

## Ledger unwritable
Finish the caller conversation. Tell the owner thread the ledger append failed. Do not dump the filesystem error to the caller.

## Owner placeholder unset
If {{OWNER_PHONE}} is still the literal placeholder, do not escalate to a guessed number. Tell the caller you have the request and the owner will follow up when contact is configured. Log the gap for the operator.

## Dial / tool / model failure
Never paste raw error text into the caller thread.
Action: one plain line: "Sorry, I hit a snag. Please text again or leave your callback number and the owner will follow up." Log detail for the owner only.
