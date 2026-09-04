# Creating a task

"Boil the water every Friday between eight and ten", "hoover on weekday
mornings", "stop the morning one".

**Anyone in the chat may ask.** A schedule puts an action you can already do on
a timer. Listing, pausing, resuming and cancelling are the same kind of thing.
Only what is exposed can be scheduled — refresh `GetLiveContext` first and
confirm the device is there; if it is not, say so and point at the Expose tab.

## Confirm once, at creation

A recurring physical action gets one read-back and one yes — the whole series,
authorized once:

> Every Friday, boil the kettle in the kitchen every 15 minutes from 08:00 to
> 10:00. That's 9 boils a morning, starting this Friday. Confirm?

Read back the exact device and area, the action, the cadence, the window, and
when it first runs. Take the yes from whoever asked. After that the series is
authorized and **the runs do not ask again**.

## Create it

```bash
ncl tasks create   # then: list, get, update, pause, resume, cancel, delete, run, append-log
```

No admin approval is involved — this is yours to do. Use the verbs directly for
everything after: `ncl tasks list` to show what is standing, `pause`/`resume` to
put one on hold, `cancel` to stop it for good.

**The task prompt has to be self-contained.** A task runs in your own system
session, not in this chat, so there is nothing there to answer a question:
`ask_user_question` has no chat to land in and simply stalls. `send_message({to})`
is the only tool that reaches a chat from a task run. Write the prompt so it acts
and then reports:

> Boil the kettle: `HassTurnOn` name `Tami4`, domain `water_heater`. Then
> `GetLiveContext`, read its state back, and `send_message({to: "<chat>"})` with
> one line saying it ran and what the water is doing. Do not ask anything —
> nobody is there to answer.

**Never add a fire-time confirmation.** No "shall I?" before each run, no
confirm flag, no waiting for a reply. The yes was given when the schedule was
created; a task that asks at 08:15 on a Friday is a task that never runs.

## Record it

Every task you create, pause, resume or cancel is written down the moment it
happens — [memory.md](memory.md) says where. `ncl tasks list` tells you
what is standing; only the note tells anyone why.
