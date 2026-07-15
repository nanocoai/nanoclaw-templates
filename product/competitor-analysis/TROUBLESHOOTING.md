# Troubleshooting

Runbook for issues you may hit installing or running this template. The README covers
the normal install path; this file is for when something goes wrong.

If NanoClaw runs on a remote machine, use a coding agent (Claude Code or Codex) to change the OneCLI URL to a secure, externally accessible URL.
Then, use that URL to configure the app connections.

## The agent never replies after you create it

If the agent was created manually on a NanoClaw version without template support, upgrade to a version that supports ncl groups create --template, then recreate it using a template or the Discord approval flow. Don’t manually insert
database rows; that bypasses required initialization and can leave the agent broken.

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
