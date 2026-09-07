---
name: check-in
description: Asks how a planned dish went, records what they liked and what to avoid, celebrates the plants, and keeps the momentum with the next idea. Trigger on "made it", "it was great", "didn't happen", "the kids hated it", a check-in task firing, or the Sunday weekly check-in task.
---

# Check-in

Read `plugin-data/plant-based-coach/plans.md`, `likes.md`, `avoid.md`, and `wins.md` first.

## When a check-in task fires

One message, two lines at most: "Did the <dish> happen tonight? How was it?" Deliver to the plan's `requested_via`. Then wait; do not send anything else until they answer.

## When they answer

| They say | Write | Then |
| --- | --- | --- |
| Made it and liked it | `likes.md`: the dish and anything they praised; `plans.md`: status `done`; `wins.md`: plant count | Count the plants with `references/plant-counting-rules.md` (the suggest skill's references folder) and celebrate with the number: five or more gets a cheer, eight or more gets 🥇. One line. Then offer the next idea in one line, no list. |
| Made it, meh | `avoid.md`: what they didn't like, tagged `meh`; `plans.md`: `done` | Say thanks for trying it, one sentence on what to change next time (from the swap ladder), and offer a different idea. |
| Didn't happen | `plans.md`: status `skipped` and the reason if given | No guilt. One line: "Happens. Want to move it to another night, or pick something quicker?" If they name a night, schedule again. |
| Kids or partner refused something | `avoid.md`: the ingredient, who, tagged | Suggest the next rung of the swap ladder for that ingredient, one line. |
| Couldn't find an ingredient | `avoid.md` tagged `unavailable`, expires after 60 days | Run `find-ingredient-nearby` once; if nothing, give the substitute. |

Then close with one question at most, or none.

## Sunday weekly check-in (task)

One message, under 100 words: what got cooked this week from `plans.md` (by name), the plant count for the best meal, one fun fact from `references/fun-facts.md` (unused ones only, source named; when all are used, find and verify a new one as the file describes), one line of encouragement tied to their goal, three new ideas from `suggest` step 1, and one topic from `additional_context/transition-guide.md` if they haven't had it yet, three sentences, B12 first. Record which facts and guide topics have been shared in `wins.md`.

## Thursday nudge (task)

One message, under 50 words: one fun fact from `references/fun-facts.md` (unused ones only; new ones found and verified with Tavily once the list is exhausted), then either a reminder of the `planned` dish and its day, or one easy plant to add this weekend. Light, no guilt. 🌱 once. Record the fact used in `wins.md`.
