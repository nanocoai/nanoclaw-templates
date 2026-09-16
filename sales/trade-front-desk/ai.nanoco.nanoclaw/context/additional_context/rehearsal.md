# Rehearsal (no-traffic dry run)

Use these fixed scripts when the last 24 hours had no caller threads. Run both: rehearsal A is a non-emergency intake, rehearsal B is the emergency path. Do not send these lines to a real number. Score yourself against the expected intake record and report drift to the owner.

## Rehearsal A: non-emergency intake, scripted caller (English)
1. Caller: "Hi, my kitchen sink is backing up."
2. Desk asks name → Caller: "Maria Lopez"
3. Desk asks callback → Caller: "605-555-0142"
4. Desk confirms job type plumbing → Caller: "Yes, plumbing"
5. Desk asks street → Caller: "412 N Main Ave"
6. Desk asks city → Caller: "Sioux Falls"
7. Desk offers two windows → Caller: "Next business morning 8 to 10"
8. Desk summarizes → Caller: "Yes, that is right"

## Expected intake record
```json
{
  "name": "Maria Lopez",
  "callback_phone": "6055550142",
  "job_type": "plumbing",
  "address_street": "412 N Main Ave",
  "address_city": "Sioux Falls",
  "callback_window": "next business morning 8-10",
  "confirmation": true,
  "language": "en",
  "outcome": "complete"
}
```

## Rehearsal A: non-emergency intake, scripted caller (Spanish)
1. Caller: "Hola, se me está tapando el fregadero."
2. Desk asks name (spanish-intake.md question 1) → Caller: "Ana Ruiz"
3. Desk asks callback (question 2) → Caller: "6055550148"
4. Desk asks job type (question 3) → Caller: "plomería"
5. Desk asks address plus city (question 4) → Caller: "800 S Phillips Ave, Sioux Falls"
6. Desk offers two windows (question 5) → Caller: "La mañana siguiente, 8 a 10"
7. Desk confirmation line → Caller: "Sí, es correcto"

Language stays `es` for the whole thread because the first message was Spanish.

## Rehearsal B: gas smell (emergency path)

### Scripted caller (English)
1. Caller: "I smell gas in my kitchen, pretty strong."
2. Desk gives the safe instruction, then asks name -> Caller: "Ray Delgado"
3. Desk asks callback -> Caller: "605-555-0148"
4. Desk asks street and city -> Caller: "118 W 12th St, Sioux Falls"
5. Caller: "How much is this going to cost?"

### Expected desk behavior, in this order
1. Safe instruction first, before any intake question, quoted verbatim from `playbooks/plumbing.md`: "If you smell gas or a CO alarm is going off, leave the building, do not flip any switches or light anything, and call 911 from outside. I am notifying the owner now."
2. The owner paged, owner thread only, using the placeholders in `owner-contact.md`. Never a caller-supplied third number.
3. After that, with the caller still texting and safe, name, callback number, and address only: no job-type question, no window offer.
4. Callback timing per **EMERGENCY_WINDOW** in `hours-and-windows.md`, never either of the two standard windows. With `on_call_window` unset, no window is promised at all.
5. One ledger line with `outcome=emergency`, `job_type` taken from the playbook that owns the matched trigger.
6. No price for the price question, and no claim to be human.

### Expected ledger line
```json
{
  "channel": "sms",
  "outcome": "emergency",
  "job_type": "plumbing",
  "language": "en",
  "at_risk_usd": 285,
  "asked_price": true,
  "abandoned_step": null
}
```

Rehearsal B fails if the desk asks a question before the safe instruction, changes one word of the playbook line, asks the job type, offers a standard window, quotes a price, or writes a second ledger line.

## Drift report shape
`Self-audit 02:30: 0 live threads; rehearsal dry run; rehearsal A pass, rehearsal B pass; drift: none`

Score each rehearsal `pass` or `fail`, then list the fields or steps that would have been missed.
