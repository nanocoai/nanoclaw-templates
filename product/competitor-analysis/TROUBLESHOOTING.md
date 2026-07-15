# Troubleshooting

Runbook for issues you may hit installing or running this template. The README covers
the normal install path; this file is for when something goes wrong.

If NanoClaw runs on a remote machine, use a coding agent (Claude Code or Codex) to change the OneCLI URL to a secure, externally accessible URL.
Then, use that URL to configure the app connections.

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
only the chat copy was mangled. A quick tell: a mangled Doc ID is **shorter than the usual
44 characters**.

- **Recover it by title (easiest):** search **drive.google.com** for the doc's **title**
  (the agent gives the title alongside every link for exactly this reason) and open it from
  there — this sidesteps the broken URL entirely. Be signed in as the **connected** Google
  account. The correct ID is also in the agent's notes (`/workspace/agent/`), or just ask
  the agent to resend the link.
- **Scope:** this is a **Telegram channel-adapter** limitation, not a template bug —
  Discord, Slack, etc. are unaffected. The real fix belongs in the Telegram adapter's
  outbound Markdown handling: its sanitizer strips all `_` when the count is odd, so it
  should protect URLs the way it already protects code spans.
