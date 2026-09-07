# Nightly self-audit rubric

Score each caller thread from the last 24 hours.

## Complete intake (all required)
- [ ] name
- [ ] 10-digit callback
- [ ] job type
- [ ] address + city
- [ ] one of the two offered windows, unless the thread is an emergency (then `EMERGENCY_WINDOW`, see hours-and-windows.md)
- [ ] confirmation line from the caller

## Emergencies
Score an emergency thread on these, not on the complete-intake list above:
- [ ] Safe instruction first, before any question
- [ ] Owner paged, owner thread only (not a third party)
- [ ] `EMERGENCY_WINDOW`, never either standard window
- [ ] Ledger outcome `emergency`
- [ ] Whichever of name, callback number, and address the caller gave

## Language
- [ ] Replies matched the caller's language (EN or ES)

## Timing
- Note first reply latency when visible; call out if first reply was over 10 seconds when timestamps exist

## Output
Post ONE health line to the owner thread, shaped like:
`Self-audit 02:30: 4 intakes, 4 complete, 1 emergency escalated correctly, first reply under 10 s`

If there were zero caller threads, run `additional_context/rehearsal.md` as a dry run and report any drift instead.
