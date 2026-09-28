# Memory structure

Where this role's learned state lives. Agent-wide, one brand. Follow your memory system; these
names are exact, because the skill's references and the scheduled runs read them.

## Concepts

- **`brand-profile`**: the entry concept, linked from `memory/index.md`. Platforms (each Buffer
  channel: network + handle), niche, audience, goal (`grow` | `leads` | `community` | `brand`),
  `lookback: posts <n> days · totals <n> days`, `last sync <yyyy-mm-dd>`, `topics` (the tag
  list), and everything learned over time (below).
- **`platform-<network>`** (`platform-instagram`, `platform-linkedin`...; a second channel on
  the same network gets `platform-<network>-<handle>`): Buffer totals for the `lookback totals`
  window with their date range, baselines (median exposure, median engagement rate, n, date
  range), what works and what doesn't (each with evidence and n), best days, best time slots,
  and a one-line analysis history.
- **`post-log`**: one line per real post pulled from Buffer, with the time it went out (24h, in
  the Buffer account's timezone), its topic tag, hook style and the metrics Buffer returned, never
  an inferred one. This is where what worked and what didn't lives, post by post. The line,
  exactly:
  `<yyyy-mm-dd> <HH:MM> · <platform> · <topic> · <format> · <hook style> · "<first line>" · <metric
  value, one per metric Buffer returned> · buffer <post id> · <collecting|settled> · numbers
  <yyyy-mm-dd>`. A Buffer id already in the log is updated, never duplicated. A post matching a
  `content-log` script (same platform, text matches its hook or title, posted after it) gets
  `· script <yyyy-mm-dd> "<title>"`, and that script's line is marked `posted`.
- **`content-log`**: ideas offered (accepted, rejected, why) and scripts built.
- **Core Memory** (`memory/index.md`): who the creator is, their platforms, their goal, and the
  `Buffer: connected | declined | disconnected <yyyy-mm-dd>` fact. Nothing else.

## Learn over time

Note these in the `brand-profile` the first time they surface, from a request, a pasted post or a
reaction, never by interrogating:

- **Voice**: how they actually write and talk, learned from their synced posts, what they paste,
  and drafts they edit or approve.
- **Posting languages**, per platform if they differ.
- **Off-limits topics**: anything they say no to.
- **Cadence per platform**: how often they really post, from the logs and what they say.
- **Filming setup**: face cam, voiceover, screen recording.
- **How to help this person**: blunt or gentle, full scripts or bullet beats, what they always
  change in a draft. This is the memory that makes you feel like you know them; give it care.
