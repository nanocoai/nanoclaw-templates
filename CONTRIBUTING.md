# Contributing

Thanks for adding to the NanoClaw template catalog. Templates are accepted via
pull request. This guide covers how a template is structured, where it goes, and
how to test it before you open a PR.

## What a template is

A template is a folder that NanoClaw stamps into a working agent. Its files map
directly to what the template parser reads:

| Path | Purpose | Required |
|------|---------|----------|
| `context/instructions.md` | The agent's standing brief | **Yes** |
| `context/additional_context/*.md` | Extra context, referenced from `instructions.md` by relative path (`additional_context/<file>`) | No |
| `.mcp.json` → `mcpServers` | MCP tool servers (command + args only) | No |
| `skills/<name>/` | A skill (the whole folder is copied) | No |
| `README.md` | Human docs for the template | Recommended |

The presence of `context/instructions.md` is what marks a folder as a template.
See the main [README](README.md#anatomy-of-a-template) for the full anatomy.

## Where it goes: `<category>/<template>/`

Group every template under a category folder, for example `sales/sdr/`.

Before adding a new category, check whether an existing one fits and reuse it. If
you genuinely need a new one, keep it a single, lowercase, broadly-recognized
business function (for example `sales`, `support`, `engineering`, `marketing`,
`ops`, `finance`), not a niche or product-specific label. The aim is a small,
predictable set of categories a newcomer can guess.

## No secrets, ever

Templates are public. Never commit API keys, tokens, or any credential.

- `.mcp.json` carries `command` and `args` only. Do not add an `env` block with
  real keys.
- Credentials are injected at request time by the OneCLI gateway, not baked into
  the template. If your template needs a service connected, document how to get
  the key and which scopes it needs in the template's own `README.md` (see
  `sales/sdr/README.md` for the pattern).

## Adding a template

1. Fork this repo and create a branch.
2. Create your template at `<category>/<template>/`.
3. Write `context/instructions.md`, the only required file.
4. Add what the agent needs: `.mcp.json` (no secrets), any `skills/<name>/`
   folders, and a per-template `README.md` covering what it does and which MCP
   servers and credentials it expects. The provider is not set in the template;
   it is chosen on the agent later.
5. Test it end to end. `--template` resolves relative to your NanoClaw install's
   templates directory, not your clone, so do one of:
   ```bash
   # Option A: point the templates dir at your clone, then stamp the bare ref
   NANOCLAW_TEMPLATES_DIR="$(pwd)" ncl groups create --template <category>/<template> --name "Test"

   # Option B: copy the template into your install's templates/ dir, then stamp
   cp -R <category>/<template> <nanoclaw>/templates/<category>/<template>
   ncl groups create --template <category>/<template> --name "Test"
   ```
6. Re-check the diff for any secret before you commit.
7. Open a PR describing what the template does and which MCP servers it expects.

## PR checklist

- [ ] Template lives under an appropriate `<category>/<template>/`.
- [ ] `context/instructions.md` is present.
- [ ] `.mcp.json` has no secrets (command and args only).
- [ ] A per-template `README.md` explains the template and its credentials.
- [ ] Stamped and tested locally with a bare ref (via `NANOCLAW_TEMPLATES_DIR`
      or a copy into `templates/`).
- [ ] No API keys, tokens, or other secrets anywhere in the diff.
