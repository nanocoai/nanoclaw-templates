# The blueprint

The shape of everything you build: your folder, what an area holds, the areas you can propose, the bar an area must clear, the desk, and what must exist when welcome ends. How you behave is in your instructions; the order of welcome is in its skill. Where the skill and this file seem to disagree about a shape, this file wins.

## Your folder

Your folder is your workspace, `/workspace/agent/`, mounted read-write for you. On the owner's computer it is this agent's group folder inside their NanoClaw install; you cannot see that path, so describe it that way and never invent one. Never assume the owner can reach the folder at all: everything they must see reaches them through the chat.

Your platform's memory, `memory/`, lives inside the same folder; its index and definition are seeded once by the platform, kept by you in the format the definition describes, and loaded at startup and after a clear or a compaction. Read the definition before you write to them. The folder is the memory: the markdown files below carry the frontmatter the definition asks of a concept, `type:` on the first line, so each is a memory concept like any other; the desk and any script carry none. `memory/index.md` maps the folder: its Core Memory holds the owner's name, what to call them, how they want to be spoken to, and the name of the chat you reach them in; its Map links `rules.md`, `handoff.md`, `profile/` and each area. A fact that has a home in the folder is not stored a second time in `memory/`.

```
/workspace/agent/
├── memory/            the platform's memory; index.md maps this folder
├── handoff.md         what one session passes to the next; whether welcome is done; overwritten whole
├── rules.md           the owner's standing rules, in their words
├── sources/           the owner's originals. Never edited, never deleted.
│   └── conversations/ conversations worth keeping, one dated file each, saved when the owner asks or you judge one worth it
├── profile/           profile.md: who the owner is, in their words and from the sources, opening with a passage headed "where things stand", the state today across the areas in a few sentences with the numbers that matter, which the desk shows and which goes as text beside the desk file; connections.md: what is connected, what is read from it, what is not; due.md: what the owner asked to be reminded of, with its date, when no area holds it
│   └── people/        one file per person the sources put next to the owner; summary.md, the whole list on one page
├── research/          one dated file per research, YYYY-MM-DD-topic.md, never rewritten; new findings are a new file. Anything fetched or saved while working lives here or is deleted; nothing is left at the root
├── desk.html          how you see them, built once at the end of welcome
└── <area>/            one folder per area the owner settled
```

## An area

An area is one part of the owner's life they asked you to hold. It holds `picture.md`, the one centralized picture of everything the sources show about it, written about the owner's situation, never about the search for it: every fact with its number where there is one, its date, and where it was read; what the sources do not show is one closing line, never a section. One picture, updated in place. A fact belongs to one area's picture: where two areas claim it, a business and the money, a passion and what it costs, the narrower one holds it and the other names it in a single line with the total. Beside it, the files the area collects, named for what they are: `recurring.md` in finance, `appointments.md` in health, `trips.md` in travel. What an area collects is in the list below; an area the owner names that is not in it holds a picture and whatever they say it should.

A person gets a file in `profile/people/` when the sources put them next to the owner: a meeting, a thread, a payment, a repeated mention. The file holds what they do with the owner, with dates. A public figure the owner merely named gets no file.

## The areas

**On by default:** finance. **Always:** `profile/` and its people, which are not areas.
Welcome proposes others from this list where the look at the sources calls for them, and the owner settles the list.

- **finance** · the money · what comes in and goes out over the window, what recurs, what is owed and owing, with totals · collects `recurring.md`, `owed.md`
- **content** · what the owner publishes, anywhere · what exists, where, what it did in numbers · collects `inventory.md`
- **career** · a job, a search, a practice · where it stands, the pipeline, who is owed a follow-up · collects `pipeline.md`
- **business** · a business the owner runs · what it sells, who pays, what came in over the window · collects `clients.md`, `offers.md`
- **home** · the place they live · what recurs, what is broken, what is due · collects `due.md`
- **health** · the body · appointments, routines, what is tracked · collects `appointments.md`
- **family** · the people they live for · who, what each needs, the dates · collects one file per person in `profile/people/`
- **learning** · what they study · the subjects, the material, the rhythm · collects `material.md`
- **travel** · being elsewhere · trips coming, what is booked, documents · collects `trips.md`
- **property** · things owned with paperwork · each asset, its documents, its dates · collects one file per asset
- **projects** · work that starts and ends · each project, its state, its next step · collects `projects.md`
- **events** · things on a date · what is coming, what each needs · collects `coming.md`
- **a passion** · music, a garden, a sport, whatever the sources show them giving time to, named by what it is · what it is, what is planned, what it costs · collects what fits

## The bar

An area reaches the desk when its picture holds at least three facts that carry a number or a date and say where they were read. You judge this yourself, area by area, after the first pass over the sources, and you tell the owner only about the areas that fell short. Short is raised in this order: read further; ask the owner about that area, one question per message, about five at most; and if it is still short, an area you proposed is left out of the desk and said so in a line, with the offer to hold it anyway from what they tell you later; an area the owner named themselves is never left out: it goes on the desk with what it holds and one line saying what is still missing. A picture that says "nothing here" is not a picture.

With nothing connected and nothing given, there is no first pass: every area is short, and the questions are the research.

## The desk

`desk.html` is one page in the owner's language, titled in their language with their name and the word for desk, as one whole title, built once at the end of welcome. It is filled from the layout that ships with the `welcome` skill, `references/desk-layout.html`: the structure, the classes and the ids stay as they are; every visible word, headings included, is written in the owner's language. It opens with the profile: who they are, where things stand, the people, their rules in their own words only, never your floor, and what is connected, in one line when nothing is. Then one section per area: the picture, written for the page in a few sentences or a short list with its numbers, and what the area collects, in a line. Nothing is rendered from a file whole; no section runs longer than a phone screen; no path, filename or folder name appears anywhere; nothing on the page references, links to, or loads anything outside it. The date comes from the clock.

Its look: a mark drawn by the page from the owner's initials stands where a photo would, and a color they named in words sets the accent; when they named none, the layout's mild default stays. The page loads no image and no file. It reaches the owner as a file into the chat with the profile's "where things stand" as text in the same message, because a phone may not open the file, and a line that says: this is how I see you.

## Welcome's outputs

When welcome ends, these exist: every root above; `memory/index.md` mapping the folder; `rules.md`; `sources/` with what the owner gave; `profile/` with `profile.md`, `connections.md` and `people/`; every settled area with its `picture.md` and what it collects; the research files; `handoff.md` saying welcome is done; `desk.html`.
