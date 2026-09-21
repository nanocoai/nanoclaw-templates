# PostOnce social posting agent

[PostOnce](https://postonce.to) is a paid service. This template requires your own
PostOnce account on the Creator or Pro plan with API access, your own scoped API
key, and connected social accounts for publishing. See [current plans](https://postonce.to/pricing).
The template includes no shared key, billing flow, referral link, model, or provider.
Configure your NanoClaw model provider and OneCLI gateway separately.

## What it does

Use the included PostOnce skill to discover connected account capabilities, save
and review drafts, publish or schedule explicitly approved posts, inspect actual
delivery status, and manage requested automatic crossposting workflows. No tasks
are installed or activated automatically. Queued posts are not confirmed delivery.

## Install

Copy this directory into `templates/social-media/postonce` in the active NanoClaw
installation. Preserve any existing same-name template. From that installation:

```sh
ncl groups create --template social-media/postonce --name "PostOnce"
```

Use the returned group ID. Creating a group does not connect a chat channel; use
NanoClaw's normal channel setup separately. Review any restamp plan before applying
it, because template-owned components may replace local edits. The template
contains the hosted MCP entry and portable skill, with no credentials or overrides.

## Connect your own PostOnce key

API host: `postonce.to`; MCP endpoint: `https://postonce.to/mcp`.
Authentication: `Authorization: Bearer <your-key>`, injected only by OneCLI.
Create the key in [PostOnce Preferences](https://postonce.to/dashboard/preferences).
Select only scopes needed for your intended operations:

| Operation | Scopes |
| --- | --- |
| Discover accounts and read existing posts/drafts | `accounts:read`, `posts:read` |
| Save/edit drafts or publish/schedule posts | Above, plus `posts:write` |
| Upload and resolve local media | `media:write`, `media:read` |
| Inspect crossposting workflows | `workflows:read` |
| Create/edit crossposting workflows | `workflows:read`, `workflows:write` |

`posts:write` includes publishing and deletion; it is not a draft-only scope.
A read-only key is sufficient for the first inspection prompt below. The template
does not require `accounts:write` or permission to connect/disconnect accounts.

In the intended OneCLI project, import a private file containing only your key:

```sh
onecli secrets create --name PostOnce --type generic --file <private-key-file> --host-pattern postonce.to --header-name Authorization --value-format 'Bearer {value}'
```

Select the intended project with normal OneCLI configuration or `--project`.
Grant the intended NanoClaw agent access, preserve gateway policy, and configure
its HTTPS proxy routing and CA trust. Keep the source file private and remove it
after import. Never put the actual key in this template, chat, command arguments,
or the agent container. The group must use the same gateway/project as the secret.

## First useful action

Ask: “Load the PostOnce skill, show my connected social accounts and their media
requirements, then read this existing draft by ID. Do not change or publish anything.”
Supply a real draft ID from your account. If there are no accounts or drafts, use
the existing PostOnce dashboard to connect an account or save a draft first.

For a requested write, let the skill discover current tool schemas. Use actual
account IDs, explicit authorization and stable idempotency keys. Read back the
returned draft/post ID and report real per-destination status. A future schedule
needs an explicit timezone; omitting its time is not a request for the next free slot.

Local media must exist in the agent's mounted workspace. Transfer the bytes to the
signed upload URL, resolve `get_media`, and use its returned public URL. Never send
PostOnce Authorization to signed storage, or equate a host path/chat attachment
with a completed upload.

## Recovery and removal

Resolve missing scopes/plan access in PostOnce; revoke a compromised key and import
a fresh separate key through OneCLI. Preserve unrelated agents, secrets and policy.
Removing the skill/group alone does not revoke PostOnce access. For an uncertain
write, inspect the saved result and retain the same idempotency key when retrying.
NanoClaw's default Claude runner can bypass per-tool approval prompts; rely on
PostOnce key scopes and preserve group policy, not assumed human prompts.

Created by [PostOnce](https://postonce.to). The portable skill is maintained with
the PostOnce integration packages; this registry contribution is under its MIT license.
