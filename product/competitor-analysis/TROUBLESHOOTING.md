# Troubleshooting

Runbook for issues you may hit installing or running this template. The README covers
the normal install path; this file is for when something goes wrong.

## Connecting credentials when NanoClaw runs on a remote VM

The agent connects services through **OneCLI's web UI**. OneCLI runs in a Docker container
and is published to the **Docker bridge gateway** — on a Linux VM that's
**`172.17.0.1:10254`**, *not* loopback (`127.0.0.1`). Confirm with `ss -ltn | grep 10254`.
On a **remote VM**, your laptop's browser can't reach that internal address, so:

- **Expose OneCLI's port** from the VM to a URL you can open. A forwarder must point at the
  address OneCLI actually listens on — usually **`172.17.0.1:10254`** (targeting
  `127.0.0.1` gives "connection refused"):
  ```bash
  socat TCP4-LISTEN:8080,fork,reuseaddr TCP:172.17.0.1:10254 &
  ```
  then map your host's port-proxy / preview URL / SSH tunnel to that port.
- **Keep the exposed URL PRIVATE / behind a login — never make it publicly open.** This is
  the **credential UI**; a world-reachable URL exposes your API keys. (A login-gated preview
  URL that only *you* can open is fine.)
- **The agent may reference `172.17.0.1:10254`** (its internal view). Use your exposed
  address instead — for connector links *and* the Google OAuth callback (see
  `references/connecting-google.md`).

This is a NanoClaw/OneCLI hosting concern, not specific to this template — any template
hits it on a remote VM.

## The agent never replies after you create it

If you created the agent **by hand** — `ncl groups create` on a NanoClaw version
that doesn't support `--template` stamping — the first message may route but the
agent never spawns. The usual cause is a **missing container-config row**: the
agent has no container to run in, so the host silently fails to start it. Tell-tale
sign in `logs/nanoclaw.error.log`:

```
wakeContainer failed … "Container config not found for agent group: <id>"
```

Fix (both steps):

1. **Create the config row** (idempotent — safe to re-run):
   ```bash
   pnpm exec tsx scripts/q.ts data/v2.db \
     "INSERT OR IGNORE INTO container_configs (agent_group_id, updated_at) \
      VALUES ('<agent-group-id>', '2020-01-01T00:00:00Z')"
   ```
2. **Restart the host** so it re-reads the DB — a running host can hold a stale
   SQLite (WAL) view and not see the new row:
   ```bash
   # macOS
   launchctl kickstart -k gui/$(id -u)/<launchd-label>
   # Linux
   systemctl --user restart <unit>
   ```

The next message then spawns the agent normally.

**You should NOT hit this** if you stamp with `ncl groups create --template …` (the
stamp creates the config row for you) or if you complete the Discord "which agent?"
approval card (that path initialises the agent properly too). It's specific to the
manual create-then-wire path.

## A Google Doc/Sheet link 404s ("doesn't exist") on Telegram

Google Doc/Sheet IDs contain **underscores**, and **Telegram's Markdown parse mode can
strip underscores out of URLs** in delivery — so a link like `…UEC_-9ipj…` arrives as
`…UEC-9ipj…` and opens to "doesn't exist." The agent stored and *sent* the correct link;
only the chat copy was mangled.

- **Recover the real link:** the correct ID is in the agent's notes (`CLAUDE.local.md` /
  `/workspace/agent/`) and on the actual doc/sheet in Drive — open it from there, or ask
  the agent to resend it.
- **Scope:** this is a **Telegram channel-adapter** limitation, not a template bug —
  Discord, Slack, etc. are unaffected. The real fix belongs in the Telegram adapter's
  outbound Markdown handling: its sanitizer strips all `_` when the count is odd, so it
  should protect URLs the way it already protects code spans.
