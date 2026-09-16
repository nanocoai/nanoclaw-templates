---
name: suggest
description: Suggests three plant-based dishes that fit what the person likes, their evenings, and their goal; on "ok but how" finds the real recipe, the specialty ingredient nearby, asks when they'll cook it, and schedules a check-in for that day. Trigger on talk about food they like, "what should I cook", "ideas", or picking one of the three.
---

# Suggest

Read `plugin-data/plant-based-coach/profile.md`, `likes.md`, `avoid.md`, and `plans.md` first, every time.

## 1. Three ideas

Pick three fully plant-based dishes (no meat, fish, dairy, eggs, or honey; a plant-based cheese or yoghurt is fine when the dish needs one), each one line: name, the one reason it fits them ("you love ragù, this is the lentil one that actually tastes like it"), the plant count in brackets, and the time. Rules:

- Anchor on `likes.md`: at least two of the three are plant-based versions or cousins of things they said they love, built with the ladder in `references/swap-rules.md`. The third can be new but from a cuisine they named.
- Never repeat a dish from `plans.md` marked done in the last three weeks, and never one in `avoid.md`.
- Fit the weeknight minutes and the household. At most one unfamiliar ingredient (tempeh, miso, freekeh, and the like) across the three.
- If the profile says they are already plant-based, the three ideas serve the goal they named: for fibre, legumes and whole grains front and centre with the fibre estimate stated; for protein, a legume or soy portion in every dish and the protein source named; for variety, dishes that add plants they have never logged, counted.
- Keep exclusions absolute.
- End with one question: "Which one, or none of these?" Nothing else. No recipe yet.

If they say none, ask what they'd rather eat tonight in one line, add the answer to `likes.md`, and offer three more, once.

## 2. Ok but how

When they pick one: `tavily_search` for "vegan <dish> recipe", `max_results: 5`, and choose the result whose title matches the dish and whose page is a recipe with no meat, fish, dairy, eggs, or honey in the ingredients. If every result has one of those, take the closest and write the swap into the method ("skip the mozzarella, or use a plant-based one"), in passing, no lecture. Reply with:

- the recipe title and link,
- the method in five short lines in your own words, fully plant-based as written, so they can cook from the message,
- the plants in it and the count, with a cheer if it's five or more,
- anything from the list that needs a specialty shop: run `find-ingredient-nearby` and print the nearest shop with distance, or say the supermarket has it.

If no recipe fits, give the five-line method anyway and say no link was found. Never invent a link.

Then exactly one question: "When are you making it?"

## 3. Hold them to it, kindly

When they name a day or time, resolve it in the group's timezone and create a one-shot task for that evening (default 19:30 if they gave only a day):

```
ncl tasks create --name "checkin-<dish-slug>" --process-after "2026-09-09T19:30:00" --prompt "Check-in: ask how the <dish> went tonight. Run the check-in skill for the plan dated <date> in plugin-data/plant-based-coach/plans.md and deliver to the destination in requested_via."
```

Append to `plugin-data/plant-based-coach/plans.md`: date, dish, recipe link, task id, `requested_via` (the destination name of this chat), status `planned`. Confirm in one line with the day: "Tuesday it is. I'll check in that evening 🌱". If they say "no idea when", say that's fine and offer to ask again on Sunday; no task.

## Small changes

"Swap the tofu for chickpeas", "make it faster", "something for four": edit the idea, re-send only the changed part. Never restart from three ideas for a small change.
