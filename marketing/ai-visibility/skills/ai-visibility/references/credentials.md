# Connect or troubleshoot the GeoMaestros workspace

The `geomaestros` MCP server is remote (streamable HTTP at
`https://geotravel-production.up.railway.app/v1/mcp`); nothing runs
locally. It authenticates with a Bearer token that the OneCLI proxy
injects — the token never lives in this template or in chat.

## Getting connected (what to tell the user)

1. **Create a token**: in the GeoMaestros app, open the workspace,
   then **Workspace Settings → AI Assistant tab → Create token**. Keep
   the box **"Allow my assistant to report executed fixes"** ticked —
   that is the write scope (`mcp:write`) the impact loop depends on;
   unticked, the token is read-only (`mcp:tools`) and
   `update_recovery_action` will be refused.
   The token is shown once at creation time, is scoped to that one
   workspace, and lives 90 days by default.
2. **Put it in the OneCLI vault** for host
   `geotravel-production.up.railway.app`, auth style
   `Authorization: Bearer`. Easiest path: when a call fails
   unauthenticated, hand the user the OneCLI connect link from the
   error flow, prefilled for that host, and retry after they paste the
   token.

## Symptoms

- **401 / unauthorized** — no token in the vault for this host, the
  token was revoked, or it expired (90-day default). Mint a fresh one.
- **403 / forbidden on `update_recovery_action`** — token is read-only
  (the "report executed fixes" box was unticked). Create a new token
  with it ticked; the read tools keep working meanwhile.
- **"MCP access not included"-style error** — the workspace's plan does
  not include the MCP connection (it ships with the Recovery
  Subscription); point the user at geomaestros.com/pricing. The free
  scan play keeps working regardless.
- **"multiple workspaces" error** — the token spans several workspaces;
  pass `workspace_id` explicitly (pick via `list_properties`).
- **429** — rate limited; back off and retry, do not hammer.

Tokens can be revoked any time from the same settings page; suggest
revoking the old one whenever a fresh token is minted.
