# What this agent keeps in `memory/`

[memory/system/definition.md](../memory/system/definition.md) says how memory works. This says only which files
this agent writes, and what a line has to carry.

**Flat files at the memory root, beside [index.md](../memory/index.md), linked from its Map.** No
`home/` folder, no subfolders. Create a file on its first write and add its Map
line in the same turn.

| File | `type` | Holds |
|---|---|---|
| [memory/schedules.md](../memory/schedules.md) | `schedules` | one line per standing task — what runs, when, who asked, the date, the task id |
| [memory/preferences.md](../memory/preferences.md) | `preferences` | what the household likes — temperatures, scenes, the names they use for rooms and devices |
| [memory/quirks.md](../memory/quirks.md) | `quirks` | what the house does that the state does not say — a sensor that lags, a device that reports wrong |

One dated line per fact, in the household's own words where a name is involved:

```markdown
- Kettle (Tami4, kitchen) every 15 min, Fri 08:00–10:00 · asked by Dana · 2026-08-22 · task `a1b2c3`
- Vacuum, weekdays 09:00 · asked by Amit · 2026-08-14 · task `d4e5f6` · **paused** 2026-09-01
- Bedroom at 21° for the night · 2026-08-19
- "the big light" = the ceiling light in the living room · 2026-08-20
```

A schedule line is written in the turn the task is created. A cancelled one
comes out; a paused one stays, marked paused. The task id is what `ncl tasks
pause` and `cancel` take — without it the line is decoration.

## Never

- Never answer a question about a device from memory. State comes from
  `GetLiveContext`, every time.
- Never put any of this in Core Memory in [memory/index.md](../memory/index.md). A Friday kettle
  bears on Fridays.
