---
name: eat-out-nearby
description: Finds the best fully plant-based restaurants near a place, ranked by how plant-based they are and how well rated, and says what to order from the actual menu. Trigger on "eat out", "restaurant", "dinner in <neighbourhood>", "going out tonight", or "I'm at <restaurant>, what do I order".
---

# Eat out nearby

The job is to make eating out plant-based easy, not to list what happens to be closest. A place where you would have to ask whether anything is plant-based is not a recommendation; it is the problem.

## 1. Where

If the message names a neighbourhood, geocode it with the `osm` `geocode` tool (first candidate). If it names a restaurant, geocode "<restaurant> <city>". Otherwise use the coordinates in `plugin-data/plant-based-coach/profile.md`. If the profile has no location, ask once.

## 2. Gather candidates from two directions

Map first: one `nearby_places` call with `kind: "vegan-restaurant"`, radius 2500 m, limit 15. Keep the `diet_vegan` value for each.

Web second: one `tavily_search` for "best vegan restaurants <neighbourhood or city>" with `max_results: 8` (sites like HappyCow, local city guides, and review aggregators surface here). Pull names, cuisine, and any rating or reputation line. A place the web praises that the map missed is a candidate too: geocode it by name and keep it if it is within about 3 km.

Budget: two map calls and three Tavily calls at most per request.

## 3. Rank

1. Fully plant-based places (`diet_vegan: only`, or the web says "vegan restaurant") always outrank plant-friendly ones, whatever the distance within the radius.
2. Among those, reputation: a rating or a named guide beats none.
3. Then distance, then whether it is open now.

Plant-friendly places (`diet_vegan: yes`) are used only when fewer than three fully plant-based places exist within the radius, and only if their menu, fetched in step 4, has a real plant-based section, not "ask the staff". If nothing qualifies within 2.5 km, widen once to 5 km and say so. Never recommend a place because it is close.

Respect the profile's exclusions absolutely, including in dressings and sauces.

## 4. Menus

For the top three, `tavily_search` "<name> <city> menu" (one call can cover a name; reuse a result from step 2 if it already links the menu) and `tavily_extract` the menu page if there is one. Pick the dish with the most plant ingredients and say one modification if it helps. If no menu is online, say "menu not online" and give the safe pick for that cuisine from the table below, still only for a place already known to be plant-based or to have a plant-based section.

## 5. Reply

Three places, best first, in this shape, no more:

```
1. Bunte Burger, fully plant-based, 4.6 on Google, 900 m, open until 22:00. Order the Big Bunte with the sweet potato fries.
2. Sattgrün, fully plant-based buffet, 1.2 km, open until 21:30. Fill the plate with the lentil dal and the kale salad.
3. Well Being, fully plant-based, 4.5 on HappyCow, 1.5 km. The tempeh bowl.
```

State "fully plant-based" or "plant-based section on the menu" for every entry; never list a place without one of those two labels. Every place came from the map or a web result you opened in this conversation, with the distance from the `osm` result. Never a place from memory.

## Safe picks by cuisine, only for places already known to be plant-based or to have a plant-based section

| Cuisine | Order |
| --- | --- |
| Italian | pasta with vegetables or beans, no cheese; pizza marinara with vegetables |
| Indian / Pakistani | dal, chana masala, vegetable biryani, no ghee |
| Middle Eastern / Turkish | mezze, falafel, lentil soup, tabbouleh, fattoush |
| East Asian | tofu or tempeh dishes, vegetable stir-fry, edamame; no fish sauce, no egg |
| Mexican | bean burrito or bowl, no cheese or sour cream, extra guacamole |
| Burger | the plant-based burger, no cheese, salad or fries |
