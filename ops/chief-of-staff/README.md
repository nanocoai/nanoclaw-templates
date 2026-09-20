# Chief of Staff Template

A NanoClaw template for a chief of staff serving one principal: keep them on top of
what needs attention, prepare their decisions, track their commitments. It ships as a
seed and grows around one principal — no bundled tools, no pre-written plays.

## Layout

```
chief-of-staff/
├── context/
│   ├── instructions.md                    # REQUIRED: the persona — how it operates, output formats, what to grow
│   └── additional_context/
│       └── memory-structure.md            # where learned state lives: the memory/ folders this role relies on
├── skills/
│   ├── inbox-triage/
│   │   └── SKILL.md          # triage procedure; fires when sorting inbox/messages
│   └── scheduling/
│       └── SKILL.md          # calendar procedure; fires on scheduling requests
└── tasks/
    ├── morning-executive-brief.md  # weekdays at 08:00 — brief format lives in the prompt
    └── meeting-action-items.md      # weekdays at 17:30
```

The layout mirrors the researched pillars of the role: email → `inbox-triage`,
calendar → `scheduling`. Projects ship with no skill on purpose: the always-on
running list stays in memory (it has no trigger — it's every session), and the
scenario-shaped deliverables on top of it — status views, initiative breakdowns,
reviews — are skills the agent grows once they recur.

## Memory

Learned state does not live in the template — it lives in `memory/`, described by
`context/additional_context/memory-structure.md` and built in the first working
session. The persona, skills, and tasks all read from and write to these paths:

- `memory/principal.md` — verified identity: who the principal is, their timezone,
  and where the line sits between what the CoS handles and what comes back.
- `memory/commitments/` — the running list of everything open on the principal's
  plate; the always-on spine, re-read fresh each session and written back on change.
- `memory/priorities/` — the importance model consulted before surfacing, ranking, or
  escalating: `people.md`, `fronts.md`, `escalate-on-sight.md`, `noise.md`.
- `memory/conventions/` — how the principal works: `triage-scheme.md`,
  `scheduling-preferences.md`, `project-conventions.md`, and any convention the agent
  learns later (e.g. a voice guide).

Every folder starts empty and fills through the same cascade the skills use: adopt the
organization the principal already has, otherwise propose with a preview and commit
only on approval. Every correction afterward is a one-line update to the file it
belongs to.

## Stamp an agent

```bash
ncl groups create --template ops/chief-of-staff --name "Chief of Staff"
```

Before provisioning, inject the placeholders in `context/instructions.md`:

- [principal] — the name the CoS should use for the principal
- [job_title] — the principal's job or role
- [company] — the principal's company

Wire the agent to a channel (`/manage-channels`). If a placeholder was not replaced,
the agent treats it as unknown, resolves it from connected sources or one concise
question, and saves the verified values to `memory/principal.md`. The same template
can therefore serve a CEO, founder, investor, operator, or another principal without
changing the CoS playbook.

## Notes

- **No `.mcp.json`.** A CoS's stack is personal. Add servers as needed (calendar,
  email, docs, a tracker) via the `/add-*-tool` skills; OneCLI injects credentials at
  request time, so no secrets live here.
- **Proactive by default.** The agent scans for open loops, takes the next useful
  action, follows up, and surfaces decisions with a recommendation before the
  principal has to ask.
- **Scheduled routines start paused.** The weekday morning brief and meeting-action
  review are installed with the template and run only after the user activates them.
- **It grows itself.** When the agent repeats a procedure, it writes a new skill under
  `skills/<name>/`, and any durable convention that skill relies on goes in
  `memory/conventions/`. You start with a generalist and end with one shaped to your
  principal.

## When something is a skill (and when it isn't)

A `SKILL.md` earns its folder only when all three hold:

1. It has a **specific trigger scenario** — a moment the agent reaches for it, not
   an always-on behavior.
2. The **procedure is too long for a line or two** — steps, decision points, a
   learning loop.
3. It has something to **progressively disclose** — a procedure, a script, or a format
   that shouldn't sit in context permanently.

Otherwise the content belongs in `context/instructions.md` (a line or two), or — for
cron-triggered deliverables — directly in the task prompt, which is what actually
fires. This template ships two skills (`inbox-triage`, `scheduling`) as the pattern
to imitate; the agent grows the rest. Both share the same cascade: reuse the
organization the principal already has; otherwise propose with a preview and commit
only on approval. What a skill learns is not bundled
with the skill — it lives in `memory/`, so the fixed procedure and the learned state
stay separate.
