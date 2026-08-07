# Data Analyst Template

A NanoClaw template for a data analyst / reporting assistant serving one principal:
keep the client reporting pipeline healthy, keep metric definitions consistent, and
turn report requests into buildable, validated deliverables. It ships as a seed and
grows around one principal's stack — no bundled tools, no hard-wired databases.

## Layout

```
analyst/
├── context/
│   ├── instructions.md                # REQUIRED: the persona — proactive, fact-first, close the loop
│   └── additional_context/
│       └── memory-structure.md        # where learned state lives: metrics, pipelines, clients, systems
├── skills/
│   ├── client-report-setup/
│   │   └── SKILL.md    # stand up reporting for a new client end to end
│   ├── pipeline-check/
│   │   └── SKILL.md    # verify the scheduled data work ran and produced sensible output
│   ├── query-writing/
│   │   └── SKILL.md    # SQL/MongoDB queries: right grain, no fan-out, checked against knowns
│   ├── report-spec/
│   │   └── SKILL.md    # turn a report/widget request into something buildable
│   └── schema-and-cleanup/
│       └── SKILL.md    # fix bad data and change shape without breaking readers
└── tasks/
    ├── morning-pipeline-check.md      # weekdays at 07:00 — pipeline status before anyone opens a report
    └── weekly-report-integrity.md     # Mondays at 09:00 — metric drift and report disagreements
```

## Memory

Learned state does not live in the template — it lives in `memory/`, described by
`context/additional_context/memory-structure.md` and built as the agent works. The
skills and tasks read from and write to these paths:

- `memory/principal.md` — who the analyst serves, the platforms and pipelines they
  own, and where the line sits between handled and escalated.
- `memory/conventions/metrics.md` — one entry per metric: definition, source, and
  where it is computed. Metrics computed in two places are the root of most
  reporting disagreements, so this file records where each one lives.
- `memory/conventions/pipelines.md` — every scheduled job with its normal output
  volume per client; this is what the morning check measures against.
- `memory/conventions/clients.md` — each client's reports, scoping rules, and what
  was validated against numbers on their side.
- `memory/conventions/systems.md` — schemas, ambiguous-field meanings, and what
  reads each table from outside the application.
- `memory/queries/` — saved queries with the question each answers; a one-off pull
  is never a one-off.
- `sources/` — the immutable raw record (schema exports, query outputs, dumps).

## Stamp an agent

```bash
ncl groups create --template data/analyst --name "Data Analyst"
```

Wire the agent to a channel (`/manage-channels`) and connect it to the stack it
should work against.

## Notes

- **No `.mcp.json`.** An analyst's stack is client-specific (Postgres, MongoDB, a
  BI tool, a warehouse). Add servers as needed via the `/add-*-tool` skills; OneCLI
  injects credentials at request time, so no secrets live here.
- **Fact-first by default.** The agent reads the live table, thread, or file before
  answering, carries exact values through unchanged, and flags anything unverified.
- **Scheduled routines start paused.** The weekday pipeline check and Monday
  integrity review are installed with the template and run only after the user
  activates them. Both report and draft fixes; neither patches data by hand.
- **It grows itself.** When the agent repeats a procedure, it writes a new skill
  under `skills/<name>/`, and durable conventions go in `memory/conventions/`.
