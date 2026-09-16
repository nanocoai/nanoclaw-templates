# Ledger format

Append one JSON object per line to:

`/workspace/agent/plugin-data/trade-front-desk/ledger.jsonl`

Use plugin-data (not plugins): the plugins tree is read-only in the agent container; plugin-data is the writable per-plugin state dir.

That path is the default. The weekly-money-digest script reads `LEDGER_PATH` if set, or a `.jsonl` argument on the node process, otherwise this default. Use the override to point at a fixture. This template ships one at `fixtures/ledger.sample.jsonl`: 10 synthetic lines across outcomes, job types, languages, and hours, enough to exercise every coaching rule.

## Fields
| Field | Type | Values |
| --- | --- | --- |
| ts | string | ISO-8601 timestamp in America/Chicago offset |
| channel | string | `sms` or `voice` |
| outcome | string | `complete`, `abandoned`, `emergency`, or `spam` |
| job_type | string | plumbing / hvac / electrical / concrete / roofing / unknown |
| language | string | `en` or `es` |
| at_risk_usd | number | From `business-profile.md` average ticket for that job_type; use 0 for spam |
| asked_price | boolean | true if the caller asked a price or a quote in this thread |
| after_hours | boolean | true if ts is outside shop hours in hours-and-windows.md |
| abandoned_step | string or null | null unless abandoned; then `name`, `callback`, `job_type`, `address`, `city`, `window`, or `confirm` |

`asked_price`, `after_hours`, and `abandoned_step` feed the coaching counts the digest script prints.

## Example
```json
{"ts":"2026-09-04T14:12:03-05:00","channel":"sms","outcome":"complete","job_type":"plumbing","language":"en","at_risk_usd":285,"asked_price":false,"after_hours":false,"abandoned_step":null}
```

Do not put names or phone numbers in the ledger. Privacy stays in the thread, not the money file.
