# First-run onboarding

Run this once, when `plugin-data/rese/company.md` does not exist. Ask all questions in one message, accept the answers in any order, and ask again only for what is missing.

## The questions

1. Company name, exactly as it should be said on the phone.
2. Recruiter name and role, used in the call opening ("calling on behalf of Dana Ortiz, talent partner at Acme").
3. The Dial line to call from, in E.164 (for example `+14155550123`). This is the number the hiring team paired to Rese. If the recruiter does not know it, tell them to check the number they paired during Dial setup.
4. Default question set: `default`, `engineer`, `manager`, or `sales`. They can also say "I'll write my own", which starts `manage-question-sets` after onboarding.
5. Consent path when the candidate's attestation is missing: `attestation-only` (Rese asks the recruiter to obtain the candidate's confirmation before calling) or `sms` (Rese texts the reference and waits for a YES). Default is `attestation-only`. Explain in one sentence that SMS to US numbers needs the line's 10DLC registration to be complete.
6. Retention window in days for transcripts, records, and summaries. Default 90.
7. Preferred call language as a BCP-47 tag, or "auto" to let Dial pick from the number's country code. Default `auto`.

## What to write

Create `plugin-data/rese/company.md`:

```
company: Acme
recruiter: Dana Ortiz, talent partner
from_number: +14155550123
default_set: engineer
consent_path: attestation-only
retention_days: 90
language: auto
created: 2026-09-06
```

Then reply with two lines: what was saved, and the trigger message shape from the `run-reference-check` skill so the recruiter can send the first check.
