# Story Keeper

A NanoClaw agent template that helps a family gather one person's life stories: a parent, a
grandparent, someone they have lost, someone they want to celebrate. Add it to the family chat.
It asks one question at a time, deepens each memory before moving on, keeps everything in a
sourced family memory the family owns, and drafts chapters in the tellers' own words when asked.

It needs no accounts, no API keys, and no tools (date arithmetic uses code where the host offers
it and is written out by hand where it does not). Any provider, any chat channel.

## What makes it different

Most "memoir" assistants transcribe. This one interviews. The craft inside is what an
experienced oral historian does and a chatbot usually does not:

- **One question per message, always.** The rule that keeps an 85-year-old talking.
- **The depth ladder.** Fact → scene → emotion → meaning. The first reply to any memory goes one
  rung deeper instead of racing to the next fact.
- **Never lead, never invent.** Open questions; nothing in the memory that nobody said.
- **Presence before meaning.** Around grief, the first reply acknowledges and does not interpret.
- **A sourced memory.** Every fact is a claim with who told it and when. Two tellers disagreeing
  is recorded as both, not resolved by the machine.
- **Living people are protected.** Anything about a living person stays out of drafts.

## Layout

```
story-keeper/
├── plugin.json                       # Agent Plugins manifest
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   ├── instructions.md           # the agent's standing brief and ten ground rules
│   │   └── additional_context/
│   │       └── family-memory-schema.md   # the family-memory/ layout (shared with lifestyle/historian)
│   └── tasks/
│       ├── weekly-story-prompt.md    # one gentle question a week (created PAUSED)
│       └── monthly-draft.md          # one chapter draft a month (created PAUSED)
├── skills/
│   ├── welcome/SKILL.md              # first contact: whose story, who's here, consent
│   └── story-keeper/
│       ├── SKILL.md                  # routes each moment to a reference
│       └── references/
│           ├── depth-ladder.md       # the questioning method and the seven moves
│           ├── session.md            # open, deepen, close, write
│           ├── memory-writing.md     # claims, provenance, living people, dates
│           ├── sensitive.md          # grief, illness, contested stories
│           └── drafting.md           # chapters from claims only, quotes marked
└── README.md
```

## Stamp an agent from this template

```bash
ncl groups create --template lifestyle/story-keeper --name "Story Keeper"
```

Then wire it to the family's chat (`/manage-channels`). On first contact it asks whose story
this is, who is in the chat, and whether it may keep what they share. Then it asks its first
open question, and the family talks.

## The family memory

Everything lives in the agent's workspace under `family-memory/`:

```
family-memory/
├── index.md            # one line per person, place, era
├── people/<slug>.md    # one person, with name variants, relations, living flag
├── places/<slug>.md    # one place, with its spellings over time
├── eras/<slug>.md      # one period of one life, built from claims
├── claims/<id>.md      # ONE fact each: statement, status, who said it and when
├── open-questions.md   # what to ask next, and whom
└── log/<date>.md       # a researcher's search ledger; the story-keeper never writes it
```

The layout is plain Markdown so the family can read it, and it is shared with the
`lifestyle/historian` template, a records researcher that writes to the same files from documents
instead of conversation. Run both on one memory and the interviewer's "Mum always said Kwiatowa 3"
becomes, after the historian finds the 1939 register, a confirmed fact with two sources.

Full schema: `ai.nanoco.nanoclaw/context/additional_context/family-memory-schema.md`.

## A worked example (fictional family, real public figure)

Ruth tells the agent about her late father, Sol, a shoe repairman in Appleton, Wisconsin, who
kept a cracked Houdini handbill in his shop window for sixty years and told every customer four
things: that he shook Houdini's hand there as a boy; that Houdini was born in Appleton on
April 6, 1874, "and he told us so himself"; that Houdini was the first secret agent; and that
he died on Halloween 1926 in Detroit.

The story-keeper asks one question at a time (the shop, the window, the smell of polish, how it
felt), and writes each fact as its own `told` claim in Ruth's words, all `candidate`, with
Houdini as the subject of the three Houdini facts. It does not look anything up. Then the family
runs `lifestyle/historian` on the same folder, and each claim gets one of four verdicts:

- The handshake stays `candidate`: no record can prove it, and the historian says so.
- The Appleton birth becomes `contradicted`: the Archives of Michigan has Erik Weisz born in
  Budapest on 24 March 1874. Sol's words stay in the file next to the record.
- The secret-agent story becomes `unproven`: one 2006 biography makes the claim, no primary
  document supports it, and the search is written down so nobody repeats it as fact.
- The Halloween death becomes `confirmed`: the death certificate and the next day's obituary
  agree with Sol exactly.

Ruth and her brother are living, so nothing about them appears in any draft or report.

## Scheduled runs (paused by default)

Two tasks ship paused, per NanoClaw's template rules; stamping never starts background work
without consent. The welcome asks the family in plain words, and turns on what they accept.

```bash
ncl tasks list --group <agent-group-id> --status paused
ncl tasks resume <task-id>
```

- **Weekly story prompt** (Sunday 18:00 in the agent's timezone): one open question to whoever has gone quiet, chosen
  from the thinnest era. Skips a week if the chat has been active.
- **Monthly chapter draft** (1st of the month): drafts the fullest undrafted era and tells the
  family the one question that would improve it.

## Privacy

The agent never searches the web for the family, never contacts anyone, and never posts
anywhere. The memory stays in the agent's workspace on your machine. Anything about a living
person is marked and kept out of every draft and summary.

## Third-party components

None. The template is Markdown and JSON only: no MCP servers, no packages, no external
services. The interviewing method is original work, released under this repository's MIT
license.

## A note on the craft

The interviewing method here was developed at [LegacyTaleCraft](https://www.legacytalecraft.com),
where families turn these memories into printed books. This template is the method, offered
freely under the registry's license. If a family later wants the memory made into a book, that
is a separate choice and nothing here depends on it.
