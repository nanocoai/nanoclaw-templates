# Intake fields

| Field | Required | Validation |
| --- | --- | --- |
| name | yes | Non-empty; at least 2 characters |
| callback_phone | yes | Exactly 10 US digits after stripping spaces, dashes, parentheses, and a leading +1 |
| job_type | yes | One of: plumbing, hvac, electrical, concrete, roofing. Map near-synonyms to those keys. English: AC→hvac, water heater→plumbing, etc. Spanish: plomería / fontanería → plumbing; calefacción / aire acondicionado / HVAC → hvac; electricidad / eléctrico → electrical; concreto / hormigón → concrete; techo / techos / tejado → roofing |
| address_street | yes | Non-empty street line |
| address_city | yes | Non-empty city |
| callback_window | yes | Must be one of the two windows offered from hours-and-windows.md, unless the thread is an emergency (then `EMERGENCY_WINDOW`, see hours-and-windows.md) |
| confirmation | yes | Read back all five fields (name, callback number, job type, address plus city, window), then the caller affirms it (yes / that is right / correct, or Spanish sí / correcto) |

Optional trade-specific fields come from `additional_context/playbooks/<job_type>.md` after job_type is known. They are nice-to-have, not blockers, unless the playbook marks them required for emergencies.

Do not collect payment card numbers. Do not ask for a gate code unless the caller volunteers it.
