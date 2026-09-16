---
name: find-ingredient-nearby
description: Finds where to shop for plant-based food near the person, ranked by selection: the shops with the biggest plant-based range first, then where a specific ingredient is. Trigger on "where do I get <ingredient>", "where should I shop", "best supermarket for plant-based", or a specialty item in a recipe.
---

# Find where to shop

Two questions, one job: make shopping plant-based easy.

## A. "Where should I shop" (no specific ingredient)

Rank shops near the profile coordinates by plant-based selection, not by distance.

1. `tavily_search` "best supermarket for vegan products <city>" and, if the city is large, "vegan supermarket <city>", `max_results: 6`. Note the shops and chains the results praise (dedicated plant-based shops, organic supermarkets, chains known for a big plant-based range).
2. `nearby_places` with `kind: "organic"`, radius 2500 m, limit 10, then `kind: "health-food"` at 2500 m. Match names against step 1. Geocode by name any praised shop the map missed and keep it if within about 3 km.
3. Rank: dedicated plant-based shop, then organic supermarket, then a mainstream chain the web praises for its plant-based range; within a tier, distance.
4. Reply with three to five shops, best first: name, what kind, why it's on the list ("dedicated plant-based shop", "big organic range", "the chain with the widest own-brand plant-based line"), distance, opening hours if the map has them.

Budget: two Tavily calls and three map calls.

## B. "Where do I get <ingredient>"

1. Is it a normal supermarket item here? One `tavily_search` "<ingredient> <city> supermarket" (for example "tempeh Köln Rewe Edeka"). If mainstream chains stock it, say so in one line with the aisle, and add the best shop from section A's ranking if the person wants a bigger choice.
2. Otherwise map the ingredient to shop kinds and query, closest first within each kind:

| Ingredient | Kinds, in order |
| --- | --- |
| tempeh, miso, nutritional yeast, tahini, seitan | organic, health-food, asian-grocer |
| tofu, kimchi, gochujang, rice paper, Asian greens, shiitake | asian-grocer, organic, supermarket |
| harissa, za'atar, sumac, freekeh, bulgur, pomegranate molasses | middle-eastern-grocer, organic |
| fresh herbs, unusual vegetables, seasonal fruit | greengrocer, middle-eastern-grocer, supermarket |
| chia, flax, hemp, psyllium, oat bran | health-food, organic, supermarket |
| anything else | supermarket |

One `nearby_places` call for the first kind at 1500 m, limit 5; if empty, once more at 3000 m, then the next kind. At most three map calls per ingredient.

3. Reply with up to five shops, closest first, one line each: name, address if the map has it, distance, hours. Distance and hours come from the `osm` result; if hours are missing, leave them out rather than guess.

## Rules

- Every shop named came from the map or a web result opened in this conversation. Never a shop from memory.
- Never send someone across town for something the corner supermarket stocks; say so instead.
- Widen a radius once, then stop and say what to look for.
