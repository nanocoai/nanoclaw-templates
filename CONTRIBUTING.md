# Contributing

Thanks for adding to the NanoClaw template catalog. Templates are accepted via
pull request. This guide covers how a template is structured, where it goes, and
how to test it before you open a PR.

## What a template is

A template is an [Agent Plugins](https://agent-plugins.org) 1.0.0 directory
that NanoClaw stamps into a working agent. The portable parts (skills, MCP
servers) follow the spec; the NanoClaw-specific parts live in the
`ai.nanoco.nanoclaw/` extension directory:

| Path | Purpose | Required |
|------|---------|----------|
| `plugin.json` | Plugin manifest: `$schema` + `name` (the discovery marker) | **Yes** |
| `skills/<name>/` | A skill (the whole folder is copied) | No |
| `mcp.json` → `mcpServers` | MCP tool servers (`stdio` / `streamable-http`, placeholder credentials only) | No |
| `ai.nanoco.nanoclaw/context/instructions.md` | The agent's standing brief | No (recommended; non-empty if present) |
| `ai.nanoco.nanoclaw/context/additional_context/*.md` | Extra context, referenced from `instructions.md` by relative path (`additional_context/<file>`) | No |
| `ai.nanoco.nanoclaw/tasks/*.md` | Recurring scheduled tasks, created paused | No |
| `README.md` | Human docs for the template | Recommended |

The presence of `plugin.json` is what marks a folder as a template. A plain
Agent Plugin with no `ai.nanoco.nanoclaw/` extension dir is accepted; shipping a
persona is recommended so the stamped agent is useful out of the box. See the
main [README](README.md#anatomy-of-a-template) for the full anatomy.

## Where it goes: `<category>/<template>/`

Group every template under a category folder, for example `sales/sdr/`.

Before adding a new category, check whether an existing one fits and reuse it. If
you genuinely need a new one, keep it a single, lowercase, broadly-recognized
business function (for example `sales`, `support`, `engineering`, `marketing`,
`ops`, `finance`), not a niche or product-specific label. The aim is a small,
predictable set of categories a newcomer can guess.

## No secrets, ever

Templates are public. Never commit API keys, tokens, or any credential.

- Credential-shaped `env` and `headers` values in `mcp.json` carry the literal
  `"placeholder"`, never a real value. NanoClaw rejects a template whose
  values match known credential formats. Only declare such a var where the
  server refuses to boot without it (`sales/sdr` does for HubSpot, not Exa).
- Task scripts may call external services, but must not contain credentials.
- Credentials are injected at request time by the OneCLI gateway, not baked into
  the template. If your template needs a service connected, document in the
  template's own `README.md`, for each service: the API host, the auth style,
  the exact scopes, and where to get the key (see `sales/sdr/README.md` for the
  pattern).

> **`check-templates.mjs` is stricter than NanoClaw here.** A credential-shaped
> *key* (`TOKEN`, `SECRET`, `PASSWORD`, `API_KEY`, `CREDENTIAL`, `PRIVATE_KEY`,
> `AUTH`) whose value is not `"placeholder"` **fails CI**, while NanoClaw's
> stamp-time lint only warns. A template that stamps cleanly on your machine can
> still be rejected here — use `"placeholder"` for every credential-shaped key.

## Paid services and monetization

A template may depend on paid MCP servers or paid API tiers (Exa, HubSpot's paid
plans, and similar are all fine). What is not fine is a user discovering the
paywall after they have stamped it.

The template's `README.md` must state, up front:

- that the service is paid,
- a link to the tool,
- which plan or tier the template needs, where the vendor gates the required
  capability behind one,
- and that the user supplies **their own key**.

**Name the tier, do not quote the price.** Prices change and a stale figure in a
README is worse than none, so link the vendor's pricing page and name the plan
instead — tier names are far more stable than dollar amounts.

Never ship a shared key, a template-owner key, or any credential the contributor
controls. If the template is usable on a free tier with reduced capability, say
which parts need the paid plan — that is more useful than a blanket "requires a
paid subscription".

**No monetization through the registry template.** No affiliate or referral
links, no baked-in billing, no revenue share wired into the template. A registry
template is a configuration people can read and fork, not a distribution channel
for its author.

## Adding a template

1. Fork this repo and create a branch.
2. Create your template at `<category>/<template>/`.
3. Write `plugin.json` (the only required file) and, ideally,
   `ai.nanoco.nanoclaw/context/instructions.md` (the persona — recommended).
4. Add what the agent needs: `mcp.json` (placeholder credentials only), any
   `skills/<name>/` folders, optional recurring tasks under
   `ai.nanoco.nanoclaw/tasks/*.md`, and a per-template `README.md` covering
   what it does and which MCP servers and credentials it expects. The provider
   is not set in the template; it is chosen on the agent later.
5. Run the registry checks: `node scripts/check-templates.mjs` (the same
   script CI runs).
6. Test it end to end. `--template` resolves relative to your NanoClaw install's
   templates directory, not your clone, so do one of:
   ```bash
   # Option A: point the templates dir at your clone, then stamp the bare ref
   NANOCLAW_TEMPLATES_DIR="$(pwd)" ncl groups create --template <category>/<template> --name "Test"

   # Option B: copy the template into your install's templates/ dir, then stamp
   cp -R <category>/<template> <nanoclaw>/templates/<category>/<template>
   ncl groups create --template <category>/<template> --name "Test"
   ```
   If the template defines tasks, confirm they appear paused with
   `ncl tasks list --status paused`. For a scripted task, also run it once
   with `ncl tasks run <task-id>` and inspect it with
   `ncl tasks get <task-id>`.
7. Re-check the diff for any secret before you commit.
8. Open a PR describing what the template does, including any predefined tasks
   and MCP servers it expects.

## PR checklist

- [ ] Template lives under an appropriate `<category>/<template>/`.
- [ ] `plugin.json` is present with the exact 1.0.0 `$schema` and a valid `name`.
- [ ] If the template ships `ai.nanoco.nanoclaw/context/instructions.md`, it is
      nonempty. A persona is optional — without one, the stamped agent uses
      NanoClaw's default project doc.
- [ ] `mcp.json` servers declare `type` and carry `"placeholder"` for any
      credential-shaped `env`/`headers` value — no real keys anywhere.
- [ ] Any `"placeholder"` env var is there because the server will not boot
      without it, and the README says never to replace it with a real key.
- [ ] Every `ai.nanoco.nanoclaw/tasks/*.md` file has a nonempty `schedule`, an
      optional nonempty `script`, no other frontmatter fields, and a prompt body.
- [ ] A per-template `README.md` explains the template and, for every service it
      needs, gives the API host, auth style, exact scopes, and where to get the key.
- [ ] Every paid service is declared up front in the README: that it is paid, a
      link to the tool, the tier the template needs (if any), and that the user
      brings their own key. No prices quoted.
- [ ] No affiliate or referral links, no baked-in billing, and no shared or
      author-owned credential anywhere in the template.
- [ ] `node scripts/check-templates.mjs` passes.
- [ ] Stamped and tested locally with a bare ref (via `NANOCLAW_TEMPLATES_DIR`
      or a copy into `templates/`).
- [ ] No API keys, tokens, or other secrets anywhere in the diff.
