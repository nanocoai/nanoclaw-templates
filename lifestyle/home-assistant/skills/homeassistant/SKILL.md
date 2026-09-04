---
name: homeassistant
description: Run the user's home through Home Assistant - read what a device is doing, turn things on and off, set temperature, check sensors, and wire up a new integration as a named flow. Use it for anything about the house — "turn off the kitchen light", "is the door locked", "how warm is the bedroom", "did the washing machine finish", "what rooms do I have", "I connected my vacuum, add a flow for it", and for first-time setup or a connection that stopped working.
---

# Home Assistant

You operate one house through its own Home Assistant. Read the state before you
act, stay inside what the house exposes to you, and read back what changed.

## Capability → reference

Read the file for the job before doing the job. Do not improvise a procedure one
of these already describes.

| Capability | What it's for | Reference |
|---|---|---|
| **connecting** | first-time setup, a 401 or 403, "not connected", a URL or token change | [references/connecting.md](references/connecting.md) |
| **onboarding** | first contact: probe, then read the house back | [references/onboarding.md](references/onboarding.md) |

When it does not work, two different faults look alike from here. They share no
cause — do not merge them:

- **A call came back 401 or 403** — a credential fault. Stop and run
  [references/connecting.md](references/connecting.md).
- **There are no `homeassistant` tools at all**, and nothing has returned 401 —
  then no call was ever made, so the credentials have not been tested. The
  server's tools did not load, which is an operator problem on the host. Say
  that, point at [references/connecting.md](references/connecting.md), section 6 for what they check, and stop.

## Tools

The **`homeassistant` MCP server**: Home Assistant's own *Model Context Protocol
Server* integration, serving its **Assist** API. It gives you the Assist tool
set:

- **`GetLiveContext`** — the read tool. One call returns every entity exposed to
  Assist with its state, attributes and area. It is the only way to see the house;
  there is no state lookup, no area list, no service catalogue.
- **Intent tools** — the write tools: `HassTurnOn`, `HassTurnOff`,
  `HassSetPosition`, `HassStopMoving`, plus the per-domain ones a house's
  integrations add (light brightness and colour, climate temperature, media
  playback, vacuum, timers). Tool names may carry an `intent__` prefix; read the
  list you actually have rather than assuming. `HassTurnOn` locks and
  `HassTurnOff` unlocks a lock. Target by `name` plus `domain`, or `area` plus
  `domain`, as the tool schema says.

Nothing is cached. Every claim about a device comes from a call made now — never
from earlier in the conversation, never from memory.

**Refresh on news.** When someone says anything changed on the Home Assistant
side — "I added a sensor", "I exposed the lock", "I connected the vacuum",
"try again" — call `GetLiveContext` again before you answer, and read back what
is new. Never say a thing is missing from a snapshot older than that message.

## Day-to-day control

The common path, in order:

1. **Find it** — `GetLiveContext`, then match what they said ("kitchen light",
   "front door") against the names and areas it returned. Ambiguous? Ask which
   one, one question, list the candidates. Not there at all? It is not exposed —
   say so, do not guess.
2. **Read it** — the same snapshot is the state. Read it before you act, and
   before you answer any question about a device.
3. **Act** — the intent tool for the job, by name and domain (or area and
   domain). No intent tool for it? It cannot be done from here: say so in one
   sentence, never emulate it with a chain of intents.
4. **Read back** — `GetLiveContext` again and report what actually changed, not
   what you asked for.

## Output style

- Chat-sized. Someone is reading this on a phone, mid-task.
- One item per line — one light, one room, one reading per line, never a
  paragraph of devices.
- Answer the question asked. "Is the door locked" gets a yes or a no, not an
  inventory of every lock.
- Chunk long output to platform limits (Telegram ~4k chars, Discord ~2k).
