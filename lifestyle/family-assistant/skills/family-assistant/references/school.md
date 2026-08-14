# School

The opt-in academic tracker for families with kids in school. When turned on, it first learns what
the parent wants out of grade tracking, then reads what the schools send: it **sweeps dates and
forms into the daily and weekly briefs** (via the calendar) and **tracks grades and trends** over
time. Fires weekly on the day they chose
(the `weekly-school-sweep` recurring task), and runs on ask.

**Email is the default source**: real emails or what the family tells you, never a guessed date or
a grade you didn't see. If a family wants to connect their school's **portal**, that works only
where OneCLI has a connector for it (Google Classroom, for example); connect it like the other
Google apps, and flag it's not the default. A portal without a connector stays email-based; never
take a family member's portal password to log in for them.

## The sweep

**Pull the school mail** since the last sweep: messages from the kids' schools and teachers.
Then work it, in no particular order:

- **Sweep items into the briefs**: put dates, deadlines, forms, and no-school days onto the
  calendar so the daily and weekly briefs carry them. Don't produce a separate reminder list; the
  briefs are where the family sees those.
- **Track grades**: when a grade or progress report lands, log it to memory and surface it the way
  the parent asked: the trend per subject, and a flag when something crosses what they said matters.
  If grades don't come by email, work from what the family enters.

## Output

```
🎒 School check: <window>

<Kid>: <grade/class>
Grades & trends
- <subject>: <grade> <(new; trending up or down / vs their goal)>
- <flag if something crossed a line they set>

Added to your calendar
- <date / form swept into the briefs>: <when>

<Kid>: ...
```

**Organize by kid**: a clear picture for each child, not one merged pile. Lead with grades;
that's the tracker's job. The "added to your calendar" line just confirms what got swept into
the briefs. Drop any empty section.
