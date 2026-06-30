# NanoClaw Templates

Prebuilt agent templates for [NanoClaw](https://github.com/nanocoai/nanoclaw),
an AI assistant that runs agents securely in their own containers.

A **template** is a folder you can stamp into a working NanoClaw agent. It
carries the agent's standing instructions, its MCP tool servers, and its skills,
but **no secrets**. Point `ncl` at one and you get a configured agent group in
seconds.

> New to NanoClaw? Start at the [main repo](https://github.com/nanocoai/nanoclaw)
> or [docs.nanoclaw.dev](https://docs.nanoclaw.dev).

## Using a template

There are two ways to stamp an agent from a template.

**1. During install.** Running the NanoClaw installer (`bash nanoclaw.sh`) opens
a setup wizard. Choose **Template setup**, and it lists the templates in this
repo so you can start your first agent from one.

**2. Anytime, via the CLI:**

```bash
ncl groups create --template sales/sdr --name "SDR Agent"
```

`--template <ref>` accepts three forms, resolved by the *shape* of the value.
They are checked **in this order**, and the first match wins:

| Form | Example | What it does |
|------|---------|--------------|
| **Local path** (`./` `../` `/` `~`) | `./sales/sdr` | Stamp from a folder on disk |
| **Git repo** (`git+…`, `git@…`, `*.git`) | `git+https://github.com/you/repo.git#path@v1` | Clone and stamp from any repo |
| **Bare name** (fallback) | `sales/sdr` | Fetch `<category>/<template>` from this repo |

A bare name like `sales/sdr` is the common case for this repo. It's the
fallback used when the value isn't a local path or a git URL.

Extras:

- `@<ref>` pins a branch or tag, not a commit SHA (e.g. `sales/sdr@v2`)
- `#<subpath>` selects a folder inside a git repo
- `--source <git-uri>` overrides the default repo (applies to **bare names** only)
- `--name` is optional; without it the agent group is named after the template folder

The default source for bare names is
`git+https://github.com/nanocoai/nanoclaw-templates`. There is no local cache:
each stamp re-fetches the template, copies it into your new agent group, then
discards the clone.

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
│   ├── instructions.md   # REQUIRED: the agent's standing brief
│   └── *.md              # optional: extra context, auto-appended to instructions as @context/<file>.md
├── .mcp.json             # optional: MCP servers (command/args/env), NO secrets
├── agent.json            # optional: {"provider": "claude"}
├── skills/
│   └── <name>/           # optional: one folder per skill (SKILL.md + any references/)
└── README.md             # recommended: docs for this template
```

| Path | Loaded as | Required |
|------|-----------|----------|
| `context/instructions.md` | The agent's instructions | **Yes** |
| `context/*.md` (others) | Extra context files | No |
| `.mcp.json` → `mcpServers` | MCP tool servers | No |
| `agent.json` → `provider` | Provider (defaults to `claude`) | No |
| `skills/<name>/` | A skill (folder copied whole) | No |

Notes for template authors:

- The presence of `context/instructions.md` is what marks a folder as a
  template, both for listing and for stamping.
- `agent.json` only reads **`provider`**. There is no `model`/`effort` key here;
  those are configured on the agent later, not from the template.
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
