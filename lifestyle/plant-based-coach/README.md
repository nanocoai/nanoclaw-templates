# Paula: your go-plant-based bestie 🌱

Paula is the friend who makes going plant-based easier. Tell her what you love to eat and she suggests three plant-based dishes that fit your taste, your evenings, and how far you want to go. Pick one and she finds the real recipe, tells you which shop near you has the odd ingredient and how far it is, and asks when you're making it. That evening she checks in, remembers what you liked, and cheers the plants ("eight in one meal, damn 🥇"). Sundays she looks back at the week and hands you three new ideas; Thursdays she nudges once. Both come with one research-backed fun fact, source named (two green kiwis a day beat psyllium in a randomised trial; only about 5% of US adults get enough fibre). Ask her where to eat out and she names the best fully plant-based places nearby, ranked by how plant-based they are and how well rated, with what to order from the actual menu; a place where you'd have to ask is never on the list. Ask where to shop and she ranks the shops by plant-based selection, not distance. And she tells you, one topic at a time, what most people going plant-based need to think about: B12 first, then iron, omega-3, iodine, vitamin D, calcium, protein, and which blood levels to ask a doctor about. Addition only: no calories, no weight, no restriction, no lecture.

**What Paula deliberately does not do:** suggest anything that isn't fully plant-based (plant-based means only plants: a mozzarella pizza is vegetarian and she won't offer it, though she'll quietly write the swap into a recipe that has one), count calories, set weight goals, suggest eating less or skipping meals, give medical advice, invent recipes or links, name a shop or restaurant from memory, describe what you ate beyond what you told her, push you past the goal you set, or nag (one check-in per plan, one nudge a week).

## Who it is for

People who want to go plant-based, mostly or fully, and know the hard part is keeping it up alone: ideas run out, the new ingredient isn't in the corner shop, nobody asks how the lentil ragù went. Omnivores and vegetarians at the start of the switch are the main audience. People already eating plant-based get a different Paula: more fibre, more protein on the plate, more plant variety, same loop. She says plant-based, not vegan; one is a way of eating, the other a philosophy, and she only does the eating part. Not for people with an eating-disorder history, medical diets, pregnancy, or children's nutrition; Paula says so kindly and refers to a professional (`ai.nanoco.nanoclaw/context/additional_context/safety.md`).

The judgment is in Markdown you can read and edit: the swap ladder that turns a dish someone loves into its plant-based cousin, the plant-counting rules, a fibre table shipped with the template so the same input gives the same number, and the transition guide written by a nutritionist.

## Services

| Service | Host | Auth | Cost | Notes |
| --- | --- | --- | --- | --- |
| [Tavily](https://tavily.com) web search, via the shipped `tools/tavily-mcp.mjs` | `api.tavily.com` | API key held in the OneCLI vault and injected as the `Authorization` header at the proxy. The shim sends a placeholder header and nothing else; no key exists in the template or the container. | Free tier with a monthly credit allowance; paid tiers above it. See [Tavily pricing](https://tavily.com/#pricing). You bring your own key. | Used for recipes, restaurant menus, and regional availability of ingredients. A few searches per conversation; the free tier covers everyday use. |
| [OpenStreetMap](https://www.openstreetmap.org) via the Overpass and Nominatim public APIs, through the shipped `tools/osm-mcp.mjs` | `overpass-api.de`, `nominatim.openstreetmap.org` (with mirrors) | None | Free, public, fair-use limits | One bounded query at a time, with a timeout and a radius, identified by user agent. Data © OpenStreetMap contributors, ODbL. |

Nothing else. No nutrition API: fibre values are in the template.

## Setup

1. Stamp the template: `ncl groups create --template lifestyle/plant-based-coach --name "Paula"`.
2. Put your Tavily key in the vault and grant it to Paula before the first message, so the first real request works. On the host:

   ```bash
   # the secret, injected as an Authorization header for api.tavily.com
   SECRET_ID=$(onecli secrets create --name Tavily --type generic --host-pattern api.tavily.com --header-name Authorization --value-format "Bearer {value}" --value "<key>" | jq -r .id)
   # the agent's vault identity is normally created on its first spawn; create it now instead
   onecli agents create --name "Paula" --identifier "<agent-group-id from ncl groups list>"
   # grant: set-secrets replaces the whole list, so read and merge first
   AGENT_ID=$(onecli agents list | jq -r '.data[] | select(.identifier=="<agent-group-id>") | .id')
   CURRENT=$(onecli agents secrets --id "$AGENT_ID" | jq -r '[.data[]] | join(",")')
   onecli agents set-secrets --id "$AGENT_ID" --secret-ids "$CURRENT,$SECRET_ID"
   ```

   Background in [Credentials](https://docs.nanoclaw.dev/operate/credentials). The hackathon coupon `TAVILY-NANOCLAW` adds credits to a new Tavily account.
3. Wire Paula to a chat. Telegram is the simplest; any channel works, and one is enough.

**Wire the chat to this agent yourself.** NanoClaw's setup wizard registers a paired chat by folder name and creates a fresh agent group when no folder matches, so a chat paired through the wizard ends up on a throwaway agent rather than the one stamped from this template. Skip that by creating the messaging group and the wiring directly, naming the stamped group's folder (`/manage-channels` asks the same questions interactively):

```bash
ncl messaging-groups create --channel-type telegram --platform-id "telegram:<chat-id>" --name "<name>" --is-group 1
ncl wirings create --channel-type telegram --platform-id "telegram:<chat-id>" --agent-group <this-template's-folder>
```

If a chat was already paired through the wizard, `ncl wirings list` and `ncl groups list` show the extra group; re-point the wiring with `ncl wirings create --messaging-group-id <chat-id> --agent-group-id <template-agent-id>` and delete the extra group.

4. Say hello. Paula asks where you are (omnivore, vegetarian, already plant-based) and where you're heading, where you live (geocoded once, stored as coordinates), three dinners you love, cuisines and exclusions, and your weeknight minutes. The first three ideas arrive in the same conversation.
5. Resume the two scheduled tasks, which start paused, so the Sunday check-in and the Thursday nudge run: `ncl tasks list --group <agent-group-id> --status paused`, then `ncl tasks resume <task-id>`. The per-dish check-ins Paula schedules herself.

## How to use it

> I love a good ragù, Thai curries, and anything with halloumi.

> The second one. Ok but how?

> Tuesday.

> Made it, the kids even ate the lentils.

> Where should I shop for the biggest plant-based selection?

> Where do I get tempeh?

> Dinner in Kreuzberg tonight, lots of vegetables.

> What do I need to know about going plant-based?

## Data

Everything lives in `plugin-data/plant-based-coach/` in the agent group's folder on your host: `profile.md` (coordinates, not your address), `likes.md`, `avoid.md`, `plans.md`, and `wins.md`. Delete the folder to remove everything. The only things that leave the machine are the search queries sent to Tavily and the bounded map queries sent to OpenStreetMap.

## Field notes

- **Why a Tavily shim instead of the upstream `tavily-mcp` package:** that package sends the API key inside the request body, and Tavily honours the body key over the `Authorization` header, so a vault that injects headers can never authenticate it. The 60-line shim in `tools/` sends only a placeholder header, which the OneCLI gateway replaces.
- Overpass is a shared public service and returns 504s under load. The shipped server queues requests one at a time, tries three endpoints, and retries once; the skills widen a radius once and then stop.
- Organic supermarkets in many cities are tagged `shop=supermarket` + `organic=only` rather than `shop=health_food`, which is why the `organic` kind exists and is tried first for tempeh and miso.
- The map alone ranks by distance and knows nothing about quality, which once produced a Brauhaus as the top dinner pick. Restaurants and shops are now ranked plant-based-first with a web reputation check, and "you'd have to ask" disqualifies a place.
- An earlier version of Paula rewrote last week's meals with more plants. It was accurate and nobody would open it twice. The bestie loop replaced it.

## Credit

Built by Eva Spexard, nutritionist, for the NanoClaw Templates Hackathon, September 2026, Overall track. MIT, like the rest of the registry. Map data © OpenStreetMap contributors.
