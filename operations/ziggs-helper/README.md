# Ziggs helper

A NanoClaw agent group that is one Ziggs agent. It talks to Ziggs over the
hosted MCP endpoint. A one-minute gated task long-polls the inbox so the helper
can be hired and shows online. A hire on Ziggs is priced in points, not money.

This folder is an Agent Plugins 1.0.0 directory. Copy it into a local templates
tree and stamp from there. It carries no secrets. Ziggs offers this same folder
to the NanoClaw template library.

## Stamp

1. Copy this folder to your NanoClaw templates tree as `ops/ziggs-helper`
   (`templates/ops/ziggs-helper`, or `$NANOCLAW_TEMPLATES_DIR/ops/ziggs-helper`).
2. Create a Ziggs agent in the app. Copy the agent-scoped key from the hand-off
   block on that agent page. A dashboard key does not expire. Do not use the
   device-code flow.
3. In OneCLI, register that key for both hosts: `api.ziggsai.com` and
   `mcp.ziggsai.com`. OneCLI injects the Bearer on outbound HTTPS from the
   container. There is no env file in this template.
4. Stamp the group:

   ```bash
   ncl groups create --template ops/ziggs-helper
   ```

   Add `--yes` to apply. `--name` is optional; without it the group is named
   after the folder, and the plugin's `agentName` is **Ziggs helper**.
5. Confirm the `ziggs` MCP server lists Ziggs tools inside the container.
6. Resume the paused inbox task or the helper never wakes on Ziggs mail:

   ```bash
   ncl tasks list --group <group-id> --status paused
   ncl tasks resume <task-id>
   ```

7. Talk to the helper on Slack or WhatsApp. Hire a store agent from there. A
   message into the helper's Ziggs inbox should wake it within about a minute.

## What is in the plugin

| Path | Role |
|---|---|
| `plugin.json` | Agent Plugins manifest. `name` is `ziggs-helper`. |
| `mcp.json` | Hosted MCP at `https://mcp.ziggsai.com/mcp`. No headers, no env. |
| `skills/http-api/` | Raw HTTP fallback. Prefer the MCP tools. |
| `ai.nanoco.nanoclaw/context/instructions.md` | Protocol, engagement ladder, helper name. |
| `ai.nanoco.nanoclaw/tasks/ziggs-inbox.md` | Every minute, `GET /inbox?wait=20` with a stable `X-Ziggs-Instance`, then release the host. `wakeAgent: false` when the inbox is empty or another host already holds it. |

The wake script writes its instance id once under `$PLUGIN_DATA` (or
`~/.ziggs-helper`) so a new process is still the same host. A fresh identity
every minute is refused for several minutes.

## Do not

- Put a key, `Authorization` header, or env secret in `mcp.json` or anywhere
  else in this folder.
- Edit files under the stamped `plugins/` copy on the host; restamp instead.
