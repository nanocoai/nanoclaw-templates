---
name: ledger-append
description: Append one JSON line to the trade-front-desk money ledger after intake close, 30-minute silence abandonment, call end, or spam.
---

# Ledger append

## Where

Write exactly one JSON object per event as a single line appended to:

`/workspace/agent/plugin-data/trade-front-desk/ledger.jsonl`

Path why: `/workspace/agent/plugins` is mounted read-only in the agent container; `/workspace/agent/plugin-data/<plugin-name>/` is the writable per-plugin state dir the host pre-creates.
Before the first append, run `mkdir -p /workspace/agent/plugin-data/trade-front-desk` then create the file if missing. Do not rewrite earlier lines. Do not put names or phone numbers in the line.

## Exact JSON line shape

```json
{"ts":"2026-09-04T14:12:03-05:00","channel":"sms","outcome":"complete","job_type":"plumbing","language":"en","at_risk_usd":285,"asked_price":false,"after_hours":false,"abandoned_step":null}
```

| Field | Required | Values |
| --- | --- | --- |
| ts | yes | ISO-8601 with America/Chicago offset |
| channel | yes | `sms` or `voice` |
| outcome | yes | `complete`, `abandoned`, `emergency`, or `spam` |
| job_type | yes | `plumbing`, `hvac`, `electrical`, `concrete`, `roofing`, or `unknown` |
| language | yes | `en` or `es` |
| at_risk_usd | yes | Illustrative average ticket from `additional_context/business-profile.md` for that job_type; `0` for spam |
| asked_price | yes | `true` if the caller asked a price or a quote in this thread; else `false` |
| after_hours | yes | `true` if `ts` is outside shop hours in `additional_context/hours-and-windows.md`; else `false` |
| abandoned_step | yes | `null` unless `outcome` is `abandoned`. Then the field you were waiting on: `name`, `callback`, `job_type`, `address`, `city`, `window`, or `confirm`. Use `address` when waiting on street or city. |

## When to append (one line per event)

- Intake close: caller confirmed a complete intake (`outcome=complete`).
- Abandonment after 30 min silence: required fields still missing and the caller has been silent 30 minutes (`outcome=abandoned`).
- Call end: after post-call-intake finishes or the voice thread closes (`channel=voice`; outcome `complete`, `abandoned`, or `emergency`).
- Spam: after the one-line spam close (`outcome=spam`, `at_risk_usd=0`, `job_type=unknown` if unknown).

Emergencies also append (`outcome=emergency`) from the emergency-escalate skill.

If the file is unwritable, do not dump the error to the caller. Finish the caller thread. Tell the owner thread that the ledger append failed.
