# What this agent keeps in `memory/`

| File | `type` | Holds |
|---|---|---|
| `memory/preferences.md` | `preferences` | what the household likes — temperatures, scenes, the names they use for rooms and devices |
| `memory/quirks.md` | `quirks` | what the house does that the state does not say — a sensor that lags, a device that reports wrong |

One dated line per fact, in the household's own words where a name is involved:

```markdown
- Bedroom at 21° for the night · 2026-08-19
- "the big light" = the ceiling light in the living room · 2026-08-20
- Hallway motion sensor reports a minute late · 2026-08-23
```

## Never

- Never answer a question about a device from memory. State comes from
  `GetLiveContext`, every time.
- Never answer a question about what is scheduled from memory. Run
  `ncl tasks list`.
