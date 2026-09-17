# NanoClaw Templates

Prebuilt agent templates for [NanoClaw](https://github.com/nanocoai/nanoclaw),
an AI assistant that runs agents securely in their own containers.

A **template** is an [Agent Plugins](https://agent-plugins.org) directory you
can stamp into a working NanoClaw agent. It carries the agent's standing
instructions, its MCP tool servers, its skills, and optional recurring tasks,
but **no secrets and no provider**. Templates are provider-neutral; you pick
the runtime separately, so one template works on any provider. Point `ncl` at
one and you get a configured agent group in seconds — and because the format
is the vendor-neutral plugin standard, the portable parts load in any other
spec-compatible client too.

> New to NanoClaw? Start at the [main repo](https://github.com/nanocoai/nanoclaw)
> or [docs.nanoclaw.dev](https://docs.nanoclaw.dev).

## Using a template

There are two ways to stamp an agent from a template.

**1. During install.** Running the NanoClaw installer (`bash nanoclaw.sh`) opens
a setup wizard with two template choices: **NanoClaw template library** clones
this repo and copies the template you pick into your local `templates/`, and
**Local templates** lists what is already in `templates/`. It then stamps and
wires your first agent.

**2. Anytime, via the CLI:**

```bash
ncl groups create --template sales/sdr --name "SDR Agent"
```

`--template <ref>` is a path relative to your local templates directory
(`templates/` by default, or `NANOCLAW_TEMPLATES_DIR`, a local path only).
Refs are multi-segment, e.g. `sales/sdr` resolves to `templates/sales/sdr`.
For safety, absolute paths, a leading `~`, and `../` escapes are rejected.

To use a template from this repo, get it into your local `templates/` first.
The install wizard's **NanoClaw template library** option clones this repo and
copies the template you pick into `templates/` for you; or copy the folder by
hand. Then stamp it with its bare ref.

`--name` is optional; without it the agent group is named after the template
folder.

## Repository layout

Templates live under a **category** folder, one folder per template:

```
<category>/<template>/
```

For example:

```
research/
└── analyst/    # Research analyst: Exa + Firecrawl + Notion research stack
sales/
└── sdr/        # Sales Development Representative agent
```

That `sales/sdr` path is exactly what you pass to `--template`.

## Anatomy of a template

A template is an [Agent Plugins](https://agent-plugins.org) 1.0.0 directory.
The portable surface (skills, MCP servers) follows the spec exactly, and
everything NanoClaw-specific rides in the `ai.nanoco.nanoclaw/` extension
directory and manifest key, which other plugin clients skip by rule. A template
from this registry is a fully conformant plugin: dropped into another
spec-compatible client, its skills and MCP servers load, and the NanoClaw
extras are ignored. The reverse also holds: NanoClaw stamps any conformant
plugin, with the NanoClaw-only slots simply left empty.

```
<template>/
├── plugin.json                  # REQUIRED: Agent Plugins manifest ($schema + name; the discovery marker)
├── mcp.json                     # optional: MCP servers per the spec, placeholder credentials only
├── skills/
│   └── <name>/                  # optional: one folder per skill (SKILL.md + any references/)
├── ai.nanoco.nanoclaw/          # NanoClaw extension dir (spec §8.2)
│   ├── context/
│   │   ├── instructions.md      # the agent's persona (optional but recommended — see below)
│   │   └── additional_context/  # optional: extra .md files, referenced from instructions.md by relative path
│   │       └── *.md
│   └── tasks/*.md               # optional: recurring tasks, created paused
└── README.md                    # recommended: docs for this template
```

| Path | Loaded as | Required |
|------|-----------|----------|
| `plugin.json` | Plugin identity (`$schema`, `name`, optional metadata + `extensions`) | **Yes** |
| `skills/<name>/` | A skill (folder copied whole; `SKILL.md` needs `name` + `description` frontmatter) | No |
| `mcp.json` → `mcpServers` | MCP tool servers (`stdio` or `streamable-http`) | No |
| `ai.nanoco.nanoclaw/context/instructions.md` | The agent's persona, prepended to its `CLAUDE.md`/`AGENTS.md` every spawn (system-prompt tier, any provider) | No (recommended; CI requires it to be non-empty if shipped) |
| `ai.nanoco.nanoclaw/context/additional_context/*.md` | Extra context, referenced from `instructions.md` by relative path (`additional_context/<file>`) | No |
| `ai.nanoco.nanoclaw/tasks/*.md` | Recurring scheduled tasks, created paused pending user activation | No |

Notes for template authors:

- **`plugin.json` is the discovery marker.** `$schema` must be exactly
  `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` and `name` is
  1-64 chars of lowercase alphanumerics, hyphens, and periods (start/end
  alphanumeric, no `--` or `..` runs). An optional
  `extensions["ai.nanoco.nanoclaw"].agentName` sets the stamped agent's
  display name; without it the agent is named after the template folder.
- **A persona is recommended, not required.** A plain Agent Plugin with no
  `ai.nanoco.nanoclaw/` extension dir is accepted as-is. If you do ship
  `ai.nanoco.nanoclaw/context/instructions.md`, CI
  (`node scripts/check-templates.mjs`) requires it to be non-empty.
- **Keep `instructions.md` focused (under ~200 lines).** It is always in the
  agent's prompt, and some providers cap that doc (Codex ~32 KB), so an
  over-long persona gets truncated. Put bulk material in `skills/` or
  `additional_context/`.
- **Put extra context under `ai.nanoco.nanoclaw/context/additional_context/`
  and reference it by plain relative path** from `instructions.md` (e.g.
  `` `additional_context/pricing.md` ``), not `@...`. Extras are copied with
  the `context/` prefix stripped, so they land at the same relative path you
  reference. A plain path works under any provider.
- Each immediate subfolder of `skills/` is **one skill**, named after the
  folder. The entire folder is copied, so place `SKILL.md` (with `name` and
  `description` frontmatter) and any `references/*.md` inside it per the
  skills convention. A non-conforming skill is skipped with a notice at stamp
  time, never silently.
- **`mcp.json`** has exactly two top-level fields, `$schema`
  (`https://agent-plugins.org/schemas/1.0.0/mcp.schema.json`) and
  `mcpServers`. Every server declares its transport: `"type": "stdio"`
  (`command` + `args` + optional `env`) or `"type": "streamable-http"`
  (HTTPS `url` + optional `headers`). `sse` is not supported. A stdio
  `command` is a single token: a bare executable name or a `./`-relative path
  resolved against the plugin root.
- **The stamped plugin is read-only at runtime.** NanoClaw copies the whole
  template into the agent's workspace and mounts it read-only; stdio servers
  get `PLUGIN_ROOT` (the plugin copy) and `PLUGIN_DATA` (a writable state
  dir), and `${PLUGIN_ROOT}`/`${PLUGIN_DATA}` expand in `args` and `env`
  values.
- Each immediate Markdown file under `ai.nanoco.nanoclaw/tasks/` defines one
  recurring task. The filename becomes the task name, `schedule` is a cron
  expression, an optional `script` can decide whether to wake the agent, and
  the body is the prompt:

  ```markdown
  ---
  schedule: "*/15 * * * *"
  script: |
    if [ -f /workspace/agent/wake-next-task ]; then
      echo '{"wakeAgent": true}'
    else
      echo '{"wakeAgent": false}'
    fi
  ---

  Handle the condition reported by the script.
  ```

  `schedule` is required. `script` is optional and may be a single-line or
  multiline YAML string. No other frontmatter fields are accepted. Scripts use
  NanoClaw's normal scheduled-task behavior; see
  [Scheduled Tasks](https://github.com/nanocoai/nanoclaw/blob/main/docs/scheduled-tasks.md#script-gates)
  for the contract, testing workflow, limits, and failure behavior.

  Tasks are validated when the template is stamped, use the NanoClaw install
  timezone, and start paused. List them with
  `ncl tasks list --group <agent-group-id> --status paused` and enable one with
  `ncl tasks resume <task-id>`.
- **Never commit secrets.** Credential-shaped `env` and `headers` values use
  the literal `"placeholder"`; the operator supplies real values after
  stamping (or OneCLI injects them at request time). NanoClaw rejects a
  template whose values match known credential formats.
- **No symlinks.** Stamping walks the whole template and rejects symlinks and
  special files outright, with caps of 2,000 files / 50 MB / 16 levels deep.

## Categories

Group every template under a category folder (`<category>/<template>/`).

Before adding a category, **check whether an existing one fits and reuse it**.
If you genuinely need a new one, keep it a single, lowercase, broadly-recognized
business function (e.g. `sales`, `support`, `engineering`, `marketing`, `ops`,
`finance`), not a niche or product-specific label. The goal is a small,
predictable set of categories a newcomer can guess.

## Contributing

Templates are welcome via pull request. See [CONTRIBUTING.md](CONTRIBUTING.md)
for the template structure, category conventions, the no-secrets rule, and how
to test a template locally before you open a PR.

## License

MIT. See [LICENSE](LICENSE).
