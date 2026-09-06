# Ledger

Append-only. Never rewrite a previous row; add a new row with a later date
if the verdict changes.

`/workspace/agent/memory/harvest/YYYY-MM-DD.md` — one file per harvest.

```
# Harvest 2026-09-06
new: 40 · READ 2 · SKIM 3 · SKIP 35 · BLOCKED 0

| id | verdict | score | why | keywords |
|----|---------|-------|-----|----------|
| 2609.01234 | READ | 91 | «SA-Pass tests semantic alignment» | autoformalization, Lean |
```

`/workspace/agent/memory/ratings.md` — `+` / `-` history, one line per
rating: `YYYY-MM-DD  +  2609.01234  <optional note>`.

`/workspace/agent/plugin-data/lit-gate/seen.txt` — one arXiv id per line,
no `vN` suffix. The morning script diffs against this file. After a
harvest, append every id you judged, including SKIP.

`/workspace/agent/plugin-data/lit-gate/cats.txt` — one category code per
line, written at onboard. The script does not parse `profile.md`.
