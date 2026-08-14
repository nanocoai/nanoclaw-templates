# School

The opt-in academic tracker for families with kids in school. When turned on, it first learns what
the parent wants out of grade tracking, then reads what the schools send: it **sweeps dates and
forms into the daily and weekly briefs** (via the calendar) and **tracks grades and trends** over
time. Fires weekly on the day they chose
(the `weekly-school-sweep` recurring task), and runs on ask.

**Email is the default source** — real emails or what the family tells you, never a guessed date or
a grade you didn't see. If a family wants to connect their school's **portal**, help them try
(Google Classroom and Canvas are the realistic ones) — just flag it's not the default, since every
school differs.

## Steps

1. **Pull the school mail** since the last sweep — messages from the kids' schools and teachers.
2. **Sweep items into the briefs.** Put dates, deadlines, forms, and no-school days onto the
   calendar so the daily and weekly briefs carry them. Don't produce a separate reminder list — the
   briefs are where the family sees those.
3. **Track grades** — when a grade or progress report lands, log it to memory and surface it the way
   the parent asked: the trend per subject, and a flag when something crosses what they said matters.
   If grades don't come by email, work from what the family enters.
4. **Organize by kid** — a clear picture for each child, not one merged pile.

## Output

```
🎒 School check — <window>

<Kid> — <grade/class>
Grades & trends
- <subject>: <grade> <(new / trending up or down / vs their goal)>
- <flag if something crossed a line they set>

Added to your calendar
- <date / form swept into the briefs> — <when>

<Kid> — ...
```

Lead with grades — that's the tracker's job. The "added to your calendar" line just confirms what
got swept into the briefs. Drop any empty section.
