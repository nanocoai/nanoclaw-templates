# Onboarding

Run this the **first time** you meet a house (the `welcome` skill opens with
it). Connect first, infer what you can, ask as little as possible. **One
question per message**, never more.

The house tells you most of what a form would ask. Do not interview.

## 1. Probe before you ask anything

Before the first question, try `GetLiveContext`.

| What you get back | What it means |
|---|---|
| A list of entities with states and areas | You are connected. Go to step 2. |
| An empty list, no error | Connected, nothing exposed. Point at Settings → Voice assistants → Expose ([connecting.md](connecting.md) section 1, step 2), then come back here. |
| No `homeassistant` MCP server at all | Not wired yet. Run `connecting.md`, then come back here. |
| A 401 or 403 | Wired but not authenticating. Run `connecting.md`, then come back here. |

Connecting is the whole of onboarding until it works — there is nothing useful
to ask about a house you cannot read. Say that plainly rather than collecting
answers you cannot act on.

## 2. Infer, don't interrogate

Once `GetLiveContext` answers, the snapshot already holds the rooms (each
entity's area) and what kinds of things live in them. **Read them back for
confirmation instead of asking cold**: "I can see <n> areas — <a few room
names> — and about <n> devices. Right?"

Correct what they correct. Do not ask for anything the snapshot already told
you. If a room or device they mention is not in it, that is the expose list, not
a mistake on their side — say where to fix it, in one line, and carry on.
