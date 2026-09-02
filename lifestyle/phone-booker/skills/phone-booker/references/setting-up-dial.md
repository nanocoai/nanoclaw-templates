# Setting Up Dial

Dial (https://getdial.ai) is the phone line. Without it this agent can find a number but cannot
book anything, so this is the first thing to get working.

**Dial is a paid service.** The owner brings their own account; calls and the phone number cost
their money, not yours. Never suggest otherwise, and never hand out a number that isn't theirs.

## How to use this reference

This is **orientation**, not a script. Guide the owner in your own words, a couple of steps at a
time — send two or three, let them say "done", then the next. Expect the UI and the wizard to have
drifted; adapt to what they tell you they're seeing.

## Is it already working?

```bash
dial doctor --json
```

`nextStep: "ready"` means you're set. Anything else tells you what's missing. If `dial` isn't on
the PATH at all, it isn't installed in your sandbox — don't improvise an install, see below.

## Getting the line

There are two ways in, and which one the owner wants depends on whether they want the agent to
*have* a phone number or just to *use* one.

**The Dial channel** (`/dial-setup` in NanoClaw, if the operator has it) gives the agent its own
number that people can text and ring — the owner talks to the agent by SMS. That's a NanoClaw
setup step, not something you can do from inside the sandbox.

**The Dial tool** (`/add-dial-tool`) is the one this agent actually needs: it puts the `dial` CLI
in your sandbox so you can place calls. The API key is held in the OneCLI vault and never enters
the sandbox. If `dial` is missing, this is what the owner needs to run.

Either way, the authoritative install and onboarding document is:

```bash
curl -fsSL https://getdial.ai/skills.md
```

Read it and follow it rather than guessing at flags.

## Limits worth knowing before you promise anything

- **Free accounts are capped at five minutes per call and two concurrent calls.** A place that puts
  you on hold can burn a five-minute call without booking anything. Both limits lift on the first
  top-up or subscription.
- **A call over the concurrency limit is rejected outright**, not queued.
- **US-bound SMS needs 10DLC registration on the Dial side** before carriers will deliver. It takes
  a few business days. This matters for the messaging channel, not for placing calls — but if the
  owner is being reached by SMS and nothing is arriving, this is usually why.
- Writes are **not idempotent by default**, which is why every call this agent places carries an
  `--idempotency-key`.

## When a call fails on the account

No credit, cap reached, number not provisioned: say it plainly and stop. These are the owner's to
fix and you cannot work around them. Tell them which one it was and what it means, without
speculating about their billing.

## Finding out what else Dial can do

`dial --help` and `dial <command> --help` are the source of truth for flags. For capabilities
beyond that:

```bash
curl -fsSL https://docs.getdial.ai/llms-full.txt | grep -i -B2 -A8 '<keyword>'
```

Every docs page at `https://docs.getdial.ai/<path>` has a markdown twin at `<path>.md` — read that
version, it's faster to scan.

**Never echo the API key.** It lives in the vault; you have no reason to read it and no reason to
repeat it.
