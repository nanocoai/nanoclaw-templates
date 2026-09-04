# Check-In Companion

A NanoClaw agent template that schedules periodic check-ins, calls you
if you miss a few, and calls a named emergency contact if you still
don't respond. Built for the
[NanoClaw Agent Templates Hackathon](https://nanoclaw.dev/hackathon)
(Sep 4-6, 2026).

## What this is - and what it is not

**Read this before using it for anything that actually matters.**

This is a best-effort check-in convenience tool. It is **not** a
safety-critical system, and it should never be relied on as one:

- It runs on your own personal NanoClaw install, on your own computer.
  If that machine is asleep, offline, or the NanoClaw service has
  restarted, check-ins **will not fire**. There is no redundancy, no
  uptime guarantee, no monitoring of the service itself.
- Task scheduling in NanoClaw has real-world latency - pickup and
  execution can take anywhere from tens of seconds to several minutes
  depending on host state. This is not a sub-minute-reliable system.
- **If you feel unsafe right now, contact emergency services directly**
  (100/101 in Israel, or your local equivalent). Do not wait for or
  rely on this bot in that moment.

This template generalizes beyond any single scenario - a date, a solo
hike, walking home alone, checking on a relative living alone. The
mechanic is the same regardless of why you started a session.

## What it does

1. **Start a session**: tell it your check-in window, interval, and an
   emergency contact's name and phone number. It confirms back with
   the full safety disclaimer above, every time - not just once.
2. **Check-in loop**: on your interval, it messages "you OK? reply to
   confirm." Any reply resets the miss count.
3. **Escalation**: miss a few (default 3) and it places a real phone
   call to you asking you to confirm. Still nothing after one more
   interval, and it calls your emergency contact - worded as "hasn't
   confirmed after multiple attempts, not a confirmed emergency, please
   try to reach them," never claiming certainty about what's actually
   happening.
4. **End any time**: say "I'm home" (or similar) and everything stops
   immediately, no friction, no confirmation step required.

## Required service and credentials

### Dial (required) - paid service

Both the check-in call and the emergency-contact call go through
[Dial](https://getdial.ai), which needs a registered, OTP-verified
phone number **to call from** (`DIAL_FROM_NUMBER`) - Dial's API
rejects calls with no `fromNumber` set, there is no account-level
default.

**Paid service - bring your own account:**
- See [Dial's pricing](https://getdial.ai/pricing) for current plans;
  this needs at least one phone number on either the flat-rate or
  metered/pay-as-you-go plan
- No sandbox/test mode exists - testing this uses your real account
  balance

`mcp.json`'s `checkin-dial` server is a small custom script
(`scripts/checkin-call.mjs`), not Dial's own packaged MCP server -
Dial's own server authenticates from an interactive local session file
or OAuth, neither of which support NanoClaw's headless,
env-var-injected credential model. See the comment at the top of that
file for the full explanation, and `scripts/stdio-mcp.mjs` for why it's
hand-rolled rather than using `@modelcontextprotocol/sdk` (a stamped
plugin directory has no `node_modules`).

Unlike a typical template, the call **destination** is not fixed at
stamp time - who gets called varies per session (your own number for
the miss-escalation call, your chosen emergency contact for the final
escalation), so those are captured in chat at session-setup time, not
baked into `mcp.json`.

## Tuning

Default miss threshold before the first escalation call is 3; default
check-in interval is 30 minutes if not specified. Both are set per
session at setup, not as fixed template config - just tell the agent
different numbers when starting a session.

## Local testing

```bash
mkdir -p <nanoclaw>/templates/lifestyle
cp -R . <nanoclaw>/templates/lifestyle/checkin-companion
ncl groups create --template lifestyle/checkin-companion --name "Test"
ncl tasks list --status paused
ncl tasks run <task-id>
ncl groups delete --id <agent-group-id>
```

Check the `templateReport` in the creation response for any skipped
components before relying on a run.

## Scope and safety

Advisory and coordination only. This agent never gives personal safety
judgment calls - it states facts (confirmed / not confirmed after N
attempts) and always defers to real emergency services and the
recipient's own judgment for anything beyond that.
