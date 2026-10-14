# Family Historian

A records-only family history researcher for NanoClaw. Give it a few names,
a town, and some years. It searches the open web with Tavily, **opens every
hit** before it counts, writes **one sourced claim per file**, records a
not-found **only with a control query**, **never contacts anyone**, holds
**living people** out of every report, sends every wall to a human, and runs
an **adversarial second pass** before it tells the family anything.

It researches. It does not write the story. Pair it with an interviewer
(for example `lifestyle/story-keeper`) that writes what relatives say into the
same folder, and the folder keeps "what she told us" and "what the register
says" apart.

The method is the same for any family from anywhere. Spelling variants,
towns that changed name, a migration, an index that is not online yet: the
problems repeat across countries and so do the rules. The worked example
below uses one made-up family. Swap the names and the steps do not change.

## Why Tavily, and why only two of its tools

Every page the historian cites went through `tavily_extract`. Search finds
candidates, extract opens each one so the agent can read the page and quote
it, and a hit that was never extracted cannot become evidence. The ledger
lists every result with the first words of the extracted text as proof, and
the verify pass re-extracts a sample to check the ledger was honest. A
general web tool is off limits even when the bridge is down, so there is no
quiet way around any of this.

Crawl, map and research are removed at the bridge. They pull in pages
nobody chose or write conclusions nobody checked, and the historian needs
neither.

It starts on Tavily's keyless allowance with no signup. See "Tavily:
keyless, and how to upgrade" below.

## Layout

```
lifestyle/historian/
├── plugin.json
├── mcp.json                                   Tavily via mcp-remote, keyless, two tools only
├── README.md
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   ├── instructions.md                    the persona and the four rules
│   │   └── additional_context/
│   │       └── family-memory-schema.md        the shared folder format (schema_version: 1)
│   └── tasks/
│       └── weekly-open-questions.md           paused: retries "not indexed yet" walls
└── skills/
    └── historian/
        ├── SKILL.md                           the seven-step loop
        └── references/
            ├── intake.md                      brief → search plan, name and place variants
            ├── search-and-open.md             search, list every hit, open every hit
            ├── claims-and-provenance.md       one fact per file, url + quote + date
            ├── negatives.md                   a not-found needs a control
            ├── living-persons.md              the hold, and the no-dates default
            ├── human-needed.md                walls go to open-questions.md
            ├── verify.md                      the adversarial second pass
            └── credentials.md                 keyless Tavily, upgrade path
```

## Stamp an agent from this template

```
ncl groups create --template lifestyle/historian --name "Family Historian"
```

Then add the agent to a chat and give it a brief. No key needed for the
first run.

## The family memory

Everything the agent learns goes into one folder, `family-memory/`, in plain
Markdown a person can read:

```
family-memory/
├── index.md              one line per person, place, era
├── people/<slug>.md      one person, with living: true|false
├── places/<slug>.md      one place, with its name variants
├── eras/<slug>.md        one period of one person's life
├── claims/<id>.md        ONE fact each, with sources and a status
├── open-questions.md     what a human must answer or fetch, with a blocker kind
└── log/<date>.md         the historian's search ledger: every result, opened or skipped
```

A claim has a status on a short ladder: `candidate` (one source),
`confirmed` (two independent records), `unproven` (searched, not found, with
a control), `stranger` (same name, wrong person, kept so nobody re-finds
them), `contradicted` (two sources disagree; both stay), `withdrawn` (the
verifier killed it; the file stays with the reason). Claims are never
deleted. A claim about a living person is `operator_only` and never appears
in a report, not even as a count.

A record is a document, or an archive, library or registry page that shows
one. An encyclopedia article, a blog or a social-media post is a pointer:
the agent opens what it cites and cites that. Two pointers do not confirm
anything. And when the folder already holds a claim about a fact, from a
relative or from another agent, the historian rules on that claim rather
than writing a second one beside it.

The historian also keeps a search ledger in `family-memory/log/<date>.md`:
every query, every result, `opened` or `skipped` with one of three allowed
reasons. The ledger is a gate: no next search until the previous query's
lines are all closed, and the verifier demotes every claim from a query
with unopened hits. Other agents may ignore the folder.

The full format is in `ai.nanoco.nanoclaw/context/additional_context/family-memory-schema.md`.
It is shared with `lifestyle/story-keeper`, so both agents can work on one
folder.

## Tavily: keyless, and how to upgrade

`mcp.json` bridges to Tavily's hosted MCP server with `mcp-remote@0.8.3` and
asks for keyless access. Keyless is free, but it is a small monthly
allowance per network address, shared by every agent on the host. Enough to
try the template; not enough for a real pass. When it runs out the agent
writes an open question and stops, rather than retrying.

Only two tools reach the model: `tavily_search` and `tavily_extract`. Crawl,
map and research are removed at the bridge, because the whole method is
"every page is a deliberate, citable act". The agent is told to use nothing
else for research, even if the host offers a general web tool; if Tavily is
not connected it says so and stops.

To use your own key, store it in your host's credential manager (OneCLI on
NanoClaw), never in the template, and have it injected as an authorization
header on requests to Tavily. Details in
`skills/historian/references/credentials.md`.

First start: `npx` downloads the bridge. On a cold cache the two tools can be
missing in the first turn; restart the agent once.

## The weekly task

`weekly-open-questions.md` ships paused. When resumed, once a week it retries
only the open questions whose blocker is `not_indexed_yet`, and reports only
if something closed. Resume with `ncl tasks resume <task-id>`.

## Worked example (fictional family, real public figure)

Brief from the chat, after `lifestyle/story-keeper` has already written what
Ruth told it:

> Can you check the Houdini parts of my father's stories against real
> records? He always said he shook Houdini's hand in Appleton as a boy,
> that Houdini was born in Appleton on April 6, 1874, that Houdini was
> the first secret agent, and that he died on Halloween 1926 in Detroit.

What the agent does, in order:

1. **Intake.** Reads the folder: subject Sol Bernstein (d. 1994, not
   living), teller Ruth (living), brother David (living). Four `told`
   claims about Houdini, all `candidate`. Writes a plan: the person to
   research is Harry Houdini (Erik Weisz), windows `1874` and `1926`; the
   handshake cannot be researched without a date or a newspaper, so it
   goes to `ask_family`.
2. **Search and open.** A query on the birth returns five results. Each
   goes in the ledger as `pending`, each is opened, each line gets its
   snippet. A museum research page transcribes the Budapest birth
   register: Weisz Erik, born 24 March 1874. That is one record. Three
   encyclopedia and fan pages repeat it; the ledger marks them
   `opened · no claim (pointer)`. The told claim gains the record as a
   source and its status becomes `contradicted` (the family said Appleton,
   April 6). No parallel claim is minted for the real birth; the true date
   sits in the same claim's note, with the document that would settle it.
3. **Two records, a confirmed claim.** The death: a national library's
   1926 newspaper page and a state archive's death certificate entry,
   independent institutions, both opened and quoted. The told claim
   "died on Halloween 1926 in Detroit" moves to `confirmed` after the
   verify pass, `verified_by: both`.
4. **A contradiction, honestly.** "Born in Appleton, April 6, 1874" is what
   Houdini told the public for fifty years. The family's source and the
   register both stay on the claim; the note says which is which; the
   report says so in one sentence.
5. **An unproven story with its search recorded.** "First secret agent":
   the search finds one 2006 biography making the claim and reviews
   disputing it. The agent opens them, quotes the claim and the dispute,
   finds no primary document, and sets the told claim to `unproven` with a
   control query that shows the index does return Houdini documents for
   other topics.
6. **A wall.** Two social-media pages fail to fetch: `skipped:wall`, one
   open question.
7. **What stays a candidate.** The handshake. No record, and no negative
   either: an `ask_family` line asks Ruth for a year or a newspaper
   clipping.
8. **Verify.** A fresh subagent gets the record-sourced claims and the
   ledger, re-opens every cited page, checks the quotes, checks the
   control, counts the ledger, and rules.
9. **Report.** Per query: results, opened, skipped. Then the four
   verdicts: handshake `candidate`, Appleton `contradicted`, secret agent
   `unproven`, Halloween death `confirmed`. Nothing about Ruth or David.


## Third-party components

- **Tavily** hosted MCP server (`https://mcp.tavily.com/mcp/`): the search
  and extract tools. Used under Tavily's terms of service; keyless tier by
  default, your own key optional.
- **mcp-remote** 0.8.3 (npm, MIT license): the local stdio bridge to the
  Tavily server, fetched by `npx` on first start.
- Nothing else. The template itself is Markdown and JSON; the method is
  original work, released under this repository's MIT license.

## Credit

Method developed at LegacyTaleCraft.
