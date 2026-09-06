# Winnow Screen (pun intended)

Creates an industry-agnostic search agent leveraging Tavily to identify and screen candidates (M&A, procurement, etc) based on user-tunable criteria. Turn a written thesis into a ranked, cited shortlist — **source → filter → rank → explain**. Built on [Agent Plugins 1.0.0](https://agent-plugins.org).

**Runs on Tavily with no API key by default.** Add a Tavily API key to unlock higher rate limits and site crawling and enumeration tools.

## What it does

You write a thesis: what disqualifies a candidate, what makes one better than
another, what you want investigated either way. Winnow sources candidates,
applies it, and returns three bands — never a flat yes/no list:

- **PASS** — Clears every hard filter. Ranked by score.
- **NEAR MISS** — Failed *only* filters you marked `revisitable`, or has a
  filter the evidence could not settle. Researched and ranked separately, each
  naming what would settle it.
- **FAIL** — Failed a firm filter. Dropped before research, listed with the
  reason so you can audit the filter.

The near-miss band helps with criteria tuning: it is where a firm-but-negotiable rule shows you what it costs, instead of silently discarding candidates.

It also reports **what it could not see** — which sources fed each segment, and
which segments returned nothing. See [Coverage](#coverage) below.

## Who it's for

Anyone turning a large, messy candidate space into a defensible shortlist:
corporate development, procurement and vendor qualification, partnership
sourcing, grant and RFP triage, market landscaping.

You need a screen you can write down. If your criteria live only in your head
and shift per candidate, no tool helps.

## Run it

```bash
ncl groups create --template winnow --name "Winnow"
```

No credentials required. Then, in the agent's channel:

```
Run the shipped quickstart thesis from scratch and show me the brief.
```

`theses/quickstart-arizona.yaml` is one state, five metro segments, small
caps — about eleven minutes in fast mode, fifteen to twenty in standard.
`theses/example-fencing.yaml` is the full worked example (nine segments, eight
criteria, from a real 48-target screen) and takes an hour or more. Output
lands in `runs/<timestamp>/`: `brief.md`, `screen.csv`, `screen.json`, and
one evidence file per candidate.

## Credentials

| Tier | Setup | Tools |
|---|---|---|
| **Keyless** (default) | none | `tavily_search`, `tavily_extract` |
| **Keyed** | key in a user-owned server | adds `tavily_map`, `tavily_crawl`, `tavily_research` |

The template's own `tavily` server never carries a key — that is what stops a
template acquiring a secret. To add one, add a second server:

```bash
ncl groups config add-mcp-server --id <group-id> --name tavily-keyed \
  --command npx --args '["-y","tavily-mcp@latest"]' \
  --env '{"TAVILY_API_KEY":"<your-key>"}'
ncl groups restart --id <group-id>
```

## What it deliberately doesn't do

Winnow researches **companies from public sources** and stops.

- **No outreach.** It never contacts a target, drafts outreach, or looks up
  personal contact details. Approaching a company is your decision and action.
- **No gated or paid sources.** Public web only; no paywall or login bypass.
- **No individuals as subjects.** Named people appear only in their public
  business role where it bears on ownership or succession.
- **No numbers it cannot source.** No revenue, headcount or ownership estimate
  without saying what it rests on.

## Layout

```
winnow/
├── plugin.json            manifest
├── mcp.json               Tavily, the only declared tool
├── EVAL.md                validation against a real screen
├── ai.nanoco.nanoclaw/    the agent's persona
├── skills/
│   ├── define-thesis/     interviews you, writes the thesis
│   ├── build-universe/    thesis → candidate list
│   ├── research-target/   cited evidence on one company
│   ├── screen-target/     filters, bands, scores, ranks
│   │   └── references/    thesis schema, evidence policy, scoring, judgments format
│   └── produce-brief/     ranked table, briefs, CSV/JSON
├── scripts/               the deterministic core (node, zero deps, 61 tests)
│   └── winnow.mjs         init-run · validate · screen · status
└── theses/
    ├── quickstart-arizona.yaml   small, fast, no API key
    └── example-fencing.yaml      the full worked example
```

## Configuration is a thesis file

The plugin contains no industry knowledge; a thesis YAML holds all of it.
`define-thesis` interviews you and sorts each criterion into one of three:

| Question | Goes in |
|---|---|
| Does failing this take the candidate out? | `hard_filters` |
| Does this make one acceptable candidate better? | `scored_preferences` |
| Do I want this determined and reported either way? | `research_questions` |

Full schema: `skills/screen-target/references/thesis-schema.md`.

### The dials you'll change

```yaml
research_settings:
  execution: { mode: fast }        # fast: subagents, minutes, more tokens
                                   # standard: one agent, slower, cheaper
  target_limits:
    initial_universe: 12           # candidates carried forward
    deep_research_limit: 5         # of those, how many get researched
```

The limits bound runtime and spend, nothing else. **A cap is not a filter**: a
candidate dropped by a cap was never judged, so a cap that bites is reported
above the results as a coverage event. For a shorter shortlist raise the bar
(`hard_filters`, `minimum_score_for_priority`) — those leave a reason behind.

## Coverage

Results reflect which sources are indexed, not the shape of the market. In
the screen behind the worked example, 27 of 48 targets came from one union
roster while a declared segment returned nothing and said so nowhere. So the
brief opens with candidates per segment, the top source, and flags for
**single-source dominance** and **empty segments** — the universe-level form
of *never infer from absence*. The fix for a gap is enumeration, not search:
declare a licensing database or roster under `source_preferences.registries`
and the keyed tier crawls it.

## Is it right?

[`EVAL.md`](EVAL.md) replays a real 48-target screen where the correct calls
were known, including one the original screen got wrong: a company recorded
as nonunion that was in fact signatory. Screened with that evidence absent, it
loses 10 points and nothing else — it does not fail, score zero, or leave the
shortlist. Every band, score, rank and coverage figure comes from the tested
script, never the model: `cd scripts && node --test test/*.test.mjs` (61 tests).

## When things go wrong

| Failure | What you see | What to do |
|---|---|---|
| Thesis malformed | `validate` names the field and line | Fix it; it is not active until it passes |
| Judgment malformed, over a length cap, or outside the depth profile | `screen` exits non-zero and lists every company and field | Fix the judgment; never hand-compute around it |
| Filter unresolvable | Company lands in **NEAR MISS** | Decide the open question, or accept the band |
| No evidence for a criterion | Scored per `missing_data_policy`, flagged | Nothing — the flag is the point |
| Declared segment returns nothing | `⚠ no coverage` | Add a registry, or accept the gap knowingly |
| One source dominates | `⚠ single source N%` | Treat the spread as unproven |
| Tavily rate cap or 401 | Retry-after / auth error | Wait or add a key / check the key |

The rule behind all of these: **the agent never silently guesses.**

## Licence

MIT.
