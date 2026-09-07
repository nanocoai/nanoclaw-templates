# Nina: no-BS nutrition fact checker

Send Nina a nutrition claim you saw, a headline, a link, or a thing someone said, and she checks it against the actual evidence, live. Back comes a verdict (holds up, mostly true but, it depends, overstated, does not hold up, not enough evidence) with an evidence grade, what is true underneath, what is exaggerated or missing, the number that matters, and the sources. Then the receipts: a verdict card, a receipt card for each key source with a quote and citation, and screenshots of the study pages with the sentence that matters highlighted in yellow, all sized for a phone so they are easy to share.

**What Nina deliberately does not do:** give personal medical advice, judge people rather than claims, cite from memory, grade evidence higher than the best source allows, screenshot paywalled text, or pretend to certainty the science does not have.

## Who it is for

Anyone who argues about nutrition at dinner, and anyone whose job puts them in front of nutrition claims: dietitians, coaches, teachers, health writers, clinics that want patient-facing myth-busting with the sources attached. The rubric and source tiers are Markdown files written by a nutritionist; read them and edit them.

## Services

| Service | Host | Auth | Cost | Notes |
| --- | --- | --- | --- | --- |
| [Tavily](https://tavily.com) web search and extract, via the shipped `tools/tavily-mcp.mjs` | `api.tavily.com` | API key held in the OneCLI vault and injected as the `Authorization` header at the proxy. The shim sends a placeholder header and nothing else; no key exists in the template or the container. | Free tier with a monthly credit allowance; paid tiers above it. See [Tavily pricing](https://tavily.com/#pricing). You bring your own key. | A claim uses at most 6 searches and 6 extracts, so the free tier covers dozens of checks a month. |

The screenshots use the Chromium browser that ships in the NanoClaw sandbox; no service, no key.

## Setup

1. Stamp the template: `ncl groups create --template lifestyle/nutrition-claim-check --name "Nina"`.
2. Put your Tavily key in the vault and grant it to Nina before the first message, so the first real request works. On the host:

   ```bash
   # the secret, injected as an Authorization header for api.tavily.com
   SECRET_ID=$(onecli secrets create --name Tavily --type generic --host-pattern api.tavily.com --header-name Authorization --value-format "Bearer {value}" --value "<key>" | jq -r .id)
   # the agent's vault identity is normally created on its first spawn; create it now instead
   onecli agents create --name "Nina" --identifier "<agent-group-id from ncl groups list>"
   # grant: set-secrets replaces the whole list, so read and merge first
   AGENT_ID=$(onecli agents list | jq -r '.data[] | select(.identifier=="<agent-group-id>") | .id')
   CURRENT=$(onecli agents secrets --id "$AGENT_ID" | jq -r '[.data[]] | join(",")')
   onecli agents set-secrets --id "$AGENT_ID" --secret-ids "$CURRENT,$SECRET_ID"
   ```

   Background in [Credentials](https://docs.nanoclaw.dev/operate/credentials). The hackathon coupon `TAVILY-NANOCLAW` adds credits to a new Tavily account.
3. Wire Nina to a chat. Telegram is the simplest; any channel works, and one is enough.
**Wire the chat to this agent yourself.** NanoClaw's setup wizard registers a paired chat by folder name and creates a fresh agent group when no folder matches, so a chat paired through the wizard ends up on a throwaway agent rather than the one stamped from this template. Skip that by creating the messaging group and the wiring directly, naming the stamped group's folder (`/manage-channels` asks the same questions interactively):

```bash
ncl messaging-groups create --channel-type telegram --platform-id "telegram:<chat-id>" --name "<name>" --is-group 1
ncl wirings create --channel-type telegram --platform-id "telegram:<chat-id>" --agent-group <this-template's-folder>
```

If a chat was already paired through the wizard, `ncl wirings list` and `ncl groups list` show the extra group; re-point the wiring with `ncl wirings create --messaging-group-id <chat-id> --agent-group-id <template-agent-id>` and delete the extra group.

4. Say hello. Nina asks two questions (who is asking, and which region's guidelines to prefer) and is ready.
5. Optionally resume the weekly radar task, which starts paused: `ncl tasks list --group <agent-group-id> --status paused`, then `ncl tasks resume <task-id>`. It runs Monday morning and sends three things that changed in nutrition science that week.

## How to use it

> Is it true that seed oils are toxic?

> "Intermittent fasting reverses type 2 diabetes" — saw this on TikTok

> https://example.com/some-headline-about-collagen

Then "go deeper on source 2", "what did the guideline say exactly", or "any newer studies".

## What a check produces

In chat: the verdict in under 120 words. As files: `verdict-card.png`, up to three `receipt-N.png`, and `source-N.png` screenshots of the study pages that rendered, plus `verdict.md` and `sources.json` in `plugin-data/nutrition-claim-check/claims/<slug>/` on your host.

## Evidence rules, in short

Grade A needs a systematic review or consistent large trials and a guideline body agreeing. A single small study is C at best. Association is reported as association; relative risks come with the absolute baseline when the source has it. The full rubric and the source tiers are in `ai.nanoco.nanoclaw/context/additional_context/`. Quotes on cards are 40 words or fewer and always carry the source, as quotation for commentary; the raw screenshots are of abstracts and public guideline pages only.

## Field notes

- **Why a Tavily shim instead of the upstream `tavily-mcp` package:** that package sends the API key inside the request body, and Tavily honours the body key over the `Authorization` header, so a vault that injects headers can never authenticate it. The 60-line shim in `tools/` sends only a placeholder header, which the OneCLI gateway replaces. Same tools (search, extract), no key anywhere.

- PubMed returns 403 to headless browsers; the Europe PMC page for the same PubMed ID renders, so the skill uses that for screenshots.
- The verdict never waits on the pictures. If the browser fails, the verdict ships with the sources in text.

## Data

`plugin-data/nutrition-claim-check/`: `profile.md`, `log.md`, and one folder per claim. Delete the folder to remove everything. The only thing that leaves the machine is the search queries and page fetches sent to Tavily.

## Credit

Built by Eva Spexard, nutritionist, for the NanoClaw Templates Hackathon, September 2026, Tavily track. MIT, like the rest of the registry.
