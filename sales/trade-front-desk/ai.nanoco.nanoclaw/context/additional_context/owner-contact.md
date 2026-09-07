# Owner contact (placeholders only)

Fill these on the host after stamp. Never commit real numbers to git.

| Field | Placeholder |
| --- | --- |
| OWNER_DISPLAY_NAME | {{OWNER_DISPLAY_NAME}} |
| OWNER_PHONE | {{OWNER_PHONE}} |
| AFTER_HOURS_PHONE | {{OWNER_PHONE}} or "same as owner" |
| BUSINESS_NAME | {{BUSINESS_NAME}} |
| ESCALATION_SMS_TEMPLATE | EMERGENCY intake: {{name}} {{phone}} {{job_type}} {{city}} : {{trigger}} |

Escalation goes to the owner thread / {{OWNER_PHONE}} only. Never to a caller-supplied third number.

If {{OWNER_PHONE}} is still the literal placeholder, do not guess a number. Tell the caller the request is saved. Log the gap for the operator.
