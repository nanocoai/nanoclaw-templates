# NanoClaw Templates

Prebuilt agent templates for [NanoClaw](https://github.com/nanocoai/nanoclaw),
an AI assistant that runs agents securely in their own containers.

A **template** is a folder you can stamp into a working NanoClaw agent. It
carries the agent's standing instructions, its MCP tool servers, and its skills,
but **no secrets and no provider**. Templates are provider-neutral; you pick the
runtime separately, so one template works on any provider. Point `ncl` at one and
you get a configured agent group in seconds.

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
sales/
└── sdr/        # Sales Development Representative agent
```

That `sales/sdr` path is exactly what you pass to `--template`.

## Anatomy of a template

A template is just the files NanoClaw's template parser reads. **Only
`context/instructions.md` is required.** Everything else is optional and
defaults sensibly.

```
<template>/
├── context/
│   ├── instructions.md   # REQUIRED: the agent's persona (marks the folder as a template)
│   └── *.md              # optional: extra context, referenced from instructions.md by relative path
├── .mcp.json             # optional: MCP servers (command/args/env), NO secrets
├── skills/
│   └── <name>/           # optional: one folder per skill (SKILL.md + any references/)
└── README.md             # recommended: docs for this template
```

| Path | Loaded as | Required |
|------|-----------|----------|
| `context/instructions.md` | The agent's persona, prepended to its `CLAUDE.md`/`AGENTS.md` every spawn (system-prompt tier, any provider) | **Yes** |
| `context/*.md` (others) | Extra context, referenced from `instructions.md` by relative path (`context/<file>`) | No |
| `.mcp.json` → `mcpServers` | MCP tool servers | No |
| `skills/<name>/` | A skill (folder copied whole) | No |

Notes for template authors:

- The presence of `context/instructions.md` is what marks a folder as a
  template, both for listing and for stamping.
- **Keep `instructions.md` focused (under ~200 lines).** It is always in the
  agent's prompt, and some providers cap that doc (Codex ~32 KB), so an
  over-long persona gets truncated. Put bulk material in `skills/` or
  `context/*.md`.
- **Reference extra `context/*.md` by plain relative path** from
  `instructions.md` (e.g. `` `context/pricing.md` ``), not `@context/...`. A
  plain path works under any provider.
- Each immediate subfolder of `skills/` is **one skill**, named after the folder.
  The entire folder is copied, so place `SKILL.md` and any `references/*.md`
  inside it per the skills convention.
- **Never commit secrets.** `.mcp.json` carries `command` + `args` only.
  Credentials are injected at request time by the OneCLI gateway. See a
  template's own README (e.g. [`sales/sdr/README.md`](sales/sdr/README.md)) for
  the per-service setup, including what to do if an MCP server needs a
  placeholder env var to boot.

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
