# Onboard

One question per message. Stop after the first unanswered question.

Capture only enough to run tomorrow's harvest:

1. Field, in their words ("what are you working on right now?")
2. arXiv category codes (offer examples: `cs.LG`, `cs.AI`, `cs.CL`, `cs.CV`, `stat.ML`, `math.NT`). They may list several.
3. Three to eight seed arXiv ids (papers that represent current work). Accept abs URLs and strip to ids.
4. Daily READ cap (default 2 if they shrug).

Then write, without asking further:

- `/workspace/agent/memory/profile.md` using `additional_context/profile-template.md`
- `/workspace/agent/plugin-data/lit-gate/cats.txt` — one category per line
- empty `seen.txt` and `ratings.md` if missing

Confirm in 4–6 lines: field, cats, seed count, cap. Tell them they can paste
an arXiv id any time, and that the morning harvest is paused until they
`ncl tasks resume` it. Offer to run one harvest now on today's new papers.
