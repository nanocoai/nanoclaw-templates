# Dial: What You Need to Know

Dial (https://getdial.ai) is the phone line. Without it you can find a number but you cannot book
anything.

**Dial is a paid service.** The owner brings their own account; calls and the number cost their
money. Never suggest otherwise.

## If `dial` is missing from your sandbox

Don't improvise an install. The owner runs **`/add-dial-tool`** in NanoClaw, which puts the CLI in
your sandbox and keeps the API key in the OneCLI vault — the key never enters the container. Tell
them that and stop; it isn't something you can do from in here.

Check with `dial doctor --json`. `nextStep: "ready"` means you're set.

## Pick the number you call from

**There is no account-level default in here.** The CLI reads a default from a local auth file on
whatever machine it runs on, and your sandbox has none — so a bare `dial call` can fail with a 404
naming a number that isn't on the account.

So: run `dial number list --json` once, choose a number that is `ready` and has the `call`
capability, and pass it explicitly on every call:

```bash
dial call --from-number "+14155550142" --to "..." --outbound-instruction "..." --json
```

Record the chosen number in memory (a nickname, if the owner set one, is easier to read back) so
you don't ask twice. If the owner has several lines and one is clearly someone else's setup, say
which you picked rather than guessing silently.

## Limits worth knowing before you promise anything

- **Free accounts: five minutes per call, two concurrent calls.** A place that puts you on hold can
  burn a call without booking anything. Both limits lift on the first top-up or subscription.
- A call over the concurrency limit is **rejected outright**, not queued.
- Writes are **not idempotent by default** — which is why every call carries an
  `--idempotency-key`.

## Errors you can diagnose

| What you see | What it means |
|---|---|
| `403 blocked_by_policy` on any `dial` command | Dial was granted to other agents but not to you. The owner re-runs `/add-dial-tool` and selects this agent. |
| `404 … is not on this account` | The from-number is stale. Re-run `dial number list` and pass `--from-number` explicitly. |
| Insufficient credit, or a call cap | The owner's account. Say which it was, plainly, and stop — you can't work around it, and don't speculate about their billing. |

Before you claim a balance problem, read `dial billing --json` and quote `balanceCents` correctly:
it is **cents**, so `2004` is $20.04, not four cents.

## Finding out what else Dial can do

`dial --help` and `dial <command> --help` are the source of truth for flags. Beyond that:

```bash
curl -fsSL https://docs.getdial.ai/llms-full.txt | grep -i -B2 -A8 '<keyword>'
```

Every docs page at `https://docs.getdial.ai/<path>` has a markdown twin at `<path>.md` — read that
version, it's faster to scan.

**Never echo the API key.** It lives in the vault; you have no reason to read it or repeat it.
