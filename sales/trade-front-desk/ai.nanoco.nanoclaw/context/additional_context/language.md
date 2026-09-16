# Language (EN / ES)

## Detection
- Language is set by the caller's first message. If that message is clearly Spanish (or they ask for español), set language=`es` for the thread. Otherwise `en`.
- Never switch mid-thread unless the caller does. If they switch, follow them, including a switch back.
- Spanish phrasing for the five questions, the confirmation line, and the emergency safe-instruction lines lives in `additional_context/spanish-intake.md`. Use that file; do not invent a second translation.

## English intake prompts (short)
1. "Thanks for reaching the shop. What name should we use?"
2. "Best callback number, ten digits?"
3. "What kind of job is it: plumbing, HVAC, electrical, concrete, or roofing?"
4. "What is the street and city for the job?"
5. "Two windows: {{A}} or {{B}}. Which works?"

Question 5 offers the two standard windows, unless the thread is an emergency (then `EMERGENCY_WINDOW`, see hours-and-windows.md).

If they give a street without a city, ask only: "Which city?"

## English confirmation line
"To confirm: {{name}}, {{callback_phone}}, {{job_type}} at {{address}}, {{city}}, window {{window}}. Is that right?"

Read back all five fields, callback number included. Do not drop one.

English emergency lines come from the active playbook in `additional_context/playbooks/`.
