# Personal Manager

An assistant you hire that already knows you. One conversation gathers who you are and what you want it to hold, reads what you connect and what you give, and hands you one page of how it sees you: the starting point. From then on you have an assistant who knows you, remembers everything you tell it, and answers from it. Built for the NanoClaw Templates Hackathon, September 2026.

## What it does

One conversation, welcome, on your first message: your name, what your life is made of, what you want to give it, links, files, accounts if you like, what it may read, the areas of your life it should hold, and what it should stay out of. Then it reads, tells you before each stretch that takes minutes and as each part finishes, and comes back with the desk: not a long research dump in the chat, but one page that reads well and shows exactly what it gathered, how it sees you, in your color if you named one, sent into the chat. That page is the starting point.

From then on it is your assistant. Ask it anything; it reads the areas the question touches, crosses them with what you told it before, and answers with the facts, their numbers and dates, and where each came from. Whatever you tell it is filed where it belongs without being asked. When it needs one thing to answer well, it asks one question. It never interviews you and never works in the background unasked.

Two routines ship paused and are switched on only by your yes: a daily line each morning with what is on today, and a weekly tidy of what it holds.

If your life includes a business, the business is one of your areas. There is no business mode.

## Who it is for

One person with a life to keep in order: work, money, home, health, the people around them, a business, a passion. It lives in the chat you wire it to, WhatsApp or another, and remembers.

## Layout

NanoClaw stamps an agent from `plugin.json`, `skills/` and the `ai.nanoco.nanoclaw/` extension directory; this README is not loaded.

```
personal-manager/
├── plugin.json                              # Agent Plugins 1.0.0 manifest
├── ai.nanoco.nanoclaw/
│   ├── context/
│   │   ├── instructions.md                  # the persona: memory, rules, how a request is worked, ground rules
│   │   └── additional_context/
│   │       └── blueprint.md                 # the shapes: the folder, an area, the areas, the bar, the desk
│   └── tasks/                               # shipped paused; resumed only on the owner's yes
│       ├── daily-line.md
│       └── weekly-tidy.md
├── skills/
│   └── welcome/
│       ├── SKILL.md                         # welcome, seven steps, ends with the desk
│       └── references/desk-layout.html      # the desk's layout, filled never redesigned
└── README.md
```

The folder the agent builds in its workspace:

```
/workspace/agent/
├── memory/            the platform's memory; index.md maps the folder
├── handoff.md         what one session passes to the next
├── rules.md           your standing rules, in your words
├── sources/           what you gave, never edited; conversations/ worth keeping
├── profile/           who you are, what is connected, people/
├── research/          one dated file per research
├── desk.html          how it sees you, built once
└── <area>/            picture.md and what the area collects
```

## Connections

No `mcp.json`, no keys. Every read of your accounts goes through the OneCLI gateway, which holds the credential and injects it at the proxy; when an app is not connected, the agent hands you its connect link. Nothing is required: the run recorded below built five areas from shared chat links and a website alone. Connect only what you want read; welcome offers once and lets you narrow what it reads.

| App | API host | Auth | Scope needed | Where to connect |
|-----|----------|------|--------------|------------------|
| Gmail | `gmail.googleapis.com` | OAuth through OneCLI | `https://www.googleapis.com/auth/gmail.readonly` | the agent hands you the connect link when it first needs the app |
| Google Calendar | `www.googleapis.com` | OAuth through OneCLI | `https://www.googleapis.com/auth/calendar.readonly` | same |
| Google Drive | `www.googleapis.com` | OAuth through OneCLI | `https://www.googleapis.com/auth/drive.readonly` | same |
| Web search and fetch | provided by the runtime | none | none | no setup |

The agent only ever issues read requests; what a connection is scoped to is set in OneCLI, not by this template. It never sends mail, posts, spends or contacts anyone on your behalf without your word in the conversation, and a rule you give in welcome can make that stricter.

## Stamp an agent from this template

```bash
ncl groups create --template lifestyle/personal-manager --name "Personal Manager"
```

Wire it to the chat you want it in, with write access, and send it a message: welcome starts there. Connect apps when it asks; it hands you the connect link for each one. On an install where the model key is held in the OneCLI vault, the stamped group is a new agent identity and needs its own grant before it can call the model; the first message fails until it has one.

## Recurring tasks

Two ship paused in `ai.nanoco.nanoclaw/tasks/`. At the end of welcome the agent describes them and, for each one you say yes to, asks the hour, sets the schedule and resumes it. What you decline stays paused. `ncl tasks list --status paused` shows them after the stamp.

## What it deliberately does not do

- Write to your accounts: no mail sent, no event created, no file changed. Read requests only.
- Contact anyone, spend anything, or post anywhere on your behalf.
- Work in the background unasked, or interview you as a habit. One question, when it needs one.
- Copy a credential into a file: one-time codes and account numbers are read and left where they are.
- Put an area on the desk that has nothing in it, or reveal a path, a filename or a folder there.
- Update or resend the desk unless you ask.

## Proven live, and known limits

Two full welcomes over WhatsApp on 2026-09-05, in Hebrew and English: one owner with Gmail and Calendar connected; one with no account at all, who gave thirty-two links to his chat conversations and a website, and got a desk of five areas with dated, sourced facts, the empty area left out after one question. Not yet exercised: the two routines, a Drive connection, welcome's reading on a very large mailbox.

## Credit

Liran Friedman (https://github.com/Fritzzzz1), with Ishmael, his agent. MIT.
