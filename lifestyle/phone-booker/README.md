# Phone Booker Agent Template

A NanoClaw agent that **books things by telephone**. You say what you need booked; it finds a slot
that actually works in your calendar, places a real phone call that does the booking, and puts the
event back with the address and the name it's booked under.

It gets better the more you use it, because it remembers **both sides** of a booking: the places
you use (the number, who to ask for, what you learned last time you rang them) and what you ask
them for (the outside table, the high chair, Marco specifically). Once it knows, it asks every
time without being told again.

> **Requires a paid service.** Placing calls needs a [Dial](https://getdial.ai) account and phone
> number, paid for by you, with your own key. See [Credentials](#credentials-via-onecli-and-the-vault-not-env-vars).

## Why it exists

The catalog's [`lifestyle/family-assistant`](../family-assistant) can find a place and request a
booking by email or web form. Its `book-it` reference stops at the same wall every time:

> **Phone only**: you can't call; hand them the number with the details to give.

Plenty of the best places are phone-only. This template is the one that picks up the phone.

## Layout

NanoClaw stamps an agent from the parts of this folder its plugin reader loads (`skills/` and the
`ai.nanoco.nanoclaw/` extension dir); README.md is not one of them.

```
phone-booker/
├── plugin.json                       # Agent Plugins manifest (marks the folder as a plugin)
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   └── instructions.md           # persona + the 10 ground rules
│   └── tasks/
│       └── weekly-memory-hygiene.md  # shipped PAUSED
├── skills/
│   ├── welcome/                      # first contact: intro, wiring check, one setting question
│   │   └── SKILL.md
│   └── phone-booker/                 # the router + all mechanics
│       ├── SKILL.md                  #   entry: capabilities → references routing
│       └── references/
│           ├── book-it.md            #   the end-to-end run
│           ├── call-brief.md         #   writing the --outbound-instruction
│           ├── read-the-transcript.md
│           ├── memory-structure.md   #   places vs. standing asks
│           ├── connecting-google.md
│           └── setting-up-dial.md
└── README.md                         # this file
```

There's no `mcp.json` and no scripts: Calendar and web search reach their APIs through the OneCLI
proxy, and Dial is the `dial` CLI installed into the agent's sandbox by `/add-dial-tool`. Nothing
to pin, and no credential fields anywhere in the template.

## What it does

| Capability | What it's for |
|------------|---------------|
| **book-it** | the whole run: memory → place → slot → call → confirmation → calendar → memory. Covers rescheduling and cancelling too |
| **call-brief** | writing the call's system prompt: disclosure, the ask, pre-authorised fallbacks, mandatory read-back |
| **read-the-transcript** | pulling the confirmation out of what was said — and deciding when there isn't one |
| **memory-structure** | what goes on the place, what goes in the standing asks, and how they're kept apart |

It books anything you have to ring up: restaurants, barbers, dentists, doctors, vets, mechanics,
salons.

## How the call actually works

Dial calls are **one-shot**. The agent writes the call's system prompt
(`--outbound-instruction`), the call happens without it, and it reads the transcript afterwards.
The agent is never on the line.

So the negotiation — "7:30's gone, but I have 7:45" — has to be **pre-authorised in the brief**.
`references/call-brief.md` is the reference that gets this right; it's the file to read first if
you're forking this template.

Three properties are deliberate and worth keeping if you edit it:

- **The call always identifies itself as an assistant** calling on the owner's behalf, gives their
  real name, and answers honestly if asked whether it's an AI. It never impersonates the owner, and
  that isn't a setting.
- **A booking is only real if the transcript says so.** Every brief ends with a mandatory read-back
  of the date, time, party size and name. No read-back, no calendar event — the agent reports the
  call as inconclusive and hands over the number. This is what stops it inventing a reservation.
- **Caps: three places per request, one retry each.** Calls cost money, and a business rung twice by
  a bot remembers it.

## Configure before first use

Nothing to fill in by hand. On first contact the agent checks its own wiring (Dial, then Calendar),
walks you through whatever is missing, and then asks **one** setting question: whether it should
just handle a booking end to end, or run the plan past you before it rings anyone. It records the
answer and never asks again.

It also asks for the two facts it can't book without — the name to book under, and a callback
number. Everything else (where you eat, your usual party size, the high chair) it learns from real
use rather than interrogating you up front.

## Stamp an agent from this template

```bash
ncl groups create --template lifestyle/phone-booker --name "Phone Booker"
```

Then wire it to a chat (`/manage-channels`). Dial's own channel is a natural fit — the agent gets a
real number and you text it — but any channel works.

## Recurring tasks

One task ships in `ai.nanoco.nanoclaw/tasks/`, **created paused** (the engine stamps every template
task paused): a weekly, non-destructive tidy-up of the agent's own memory — merging places recorded
twice, re-checking numbers that failed on a call, flagging standing asks that have gone stale. The
agent actively recommends turning it on during first contact. The `schedule` cron in the file is
only a sensible default.

The agent also creates **one-shot tasks of its own** during a booking: a ~6-minute safety net while
a call is in flight (so a recycled container resumes the run instead of losing it), and a ~20-minute
retry when a place doesn't answer. Both cancel themselves when they're no longer needed. Every call
carries a `--idempotency-key`, so a resumed run returns the call already placed rather than dialling
the business a second time.

## Credentials: via OneCLI and the vault, not env vars

**No API keys live in this template.** NanoClaw never passes secrets into agent containers as env
vars; the OneCLI gateway holds credentials in its vault and injects them at the proxy boundary, and
Dial's key stays in the vault rather than entering the sandbox.

| Tool | Paid? | API host | Auth | Scopes | Where to set it up |
|------|-------|----------|------|--------|--------------------|
| **Dial** | **Yes — your own account and number** ([getdial.ai](https://getdial.ai), [pricing](https://getdial.ai/pricing)) | `api.getdial.ai` | API key, held in the OneCLI vault | n/a | `/add-dial-tool` in NanoClaw; the key is read from the host's Dial login and stored in the vault. Details: `skills/phone-booker/references/setting-up-dial.md` |
| **Google Calendar** | No | `www.googleapis.com` | OAuth via OneCLI; an instance without platform Google credentials asks for your own Web-app OAuth client (Client ID + Secret) from Google Cloud Console | `calendar.readonly`, `calendar.events` | OneCLI → Apps → Google Calendar → Connect. Details: `skills/phone-booker/references/connecting-google.md` |
| **Web search** | No | provided by the runtime | n/a | n/a | no per-user setup |

### About the Dial tier

Dial works on a free account, with two limits that matter here: **five minutes per call** and **two
concurrent calls**. A booking call is usually well under five minutes, so the free tier is enough to
try the template — but a place that puts you on hold can burn a call without booking anything. Both
limits lift on the first top-up or subscription; see Dial's pricing page for the current tiers.

Two more things worth knowing before you rely on it:

- **US-bound SMS needs 10DLC registration** on the Dial side before carriers will deliver, which
  takes a few business days. That affects being *messaged* by the agent, not its ability to place
  calls.
- **Calls cost money per call.** The three-place cap exists partly for this reason.

You supply your own Dial key. This template ships no shared credential, no referral link, and no
billing of any kind.

### Running on a remote box?

If NanoClaw runs on a VM, the Google connect flow still happens in your browser and Google's sign-in
has to reach OneCLI back — usually an SSH tunnel from your machine (never expose OneCLI publicly
when a tunnel is possible). The agent walks you through it in chat; the steps are in
`skills/phone-booker/references/connecting-google.md` under "Remote box?".

## Legal and etiquette, briefly

Calling a business with an AI voice agent is regulated differently in different places, and some
businesses simply don't want it. This template's stance is to be **obviously honest** — it announces
what it is, uses the owner's real name, and takes "we don't deal with assistants" as a real answer
and records it so it never rings them that way again. If you fork it, keep that. Recording consent,
robocall rules and per-jurisdiction requirements are the operator's responsibility, not the
template's.

---

Contributed by [@YarinDay](https://github.com/YarinDay).
