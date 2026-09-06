# Connect or troubleshoot the GeoMaestros workspace

The `geomaestros` MCP server is remote (streamable HTTP at
`https://geotravel-production.up.railway.app/v1/mcp`); nothing runs
locally. It authenticates with a Bearer token that the OneCLI proxy
injects — the token never lives in this template or in chat.

## Getting connected (what to tell the user)

1. **Mint a token**: in the GeoMaestros dashboard, **Settings → MCP
   tokens → Mint new token**. Two scopes exist:
   - read-only (`mcp:tools`) — every `get_*` / `list_*` tool;
   - read + write (`mcp:write`) — adds `update_recovery_action`, needed
     to report executed fixes. Recommend this one; the impact loop
     depends on it.
   The token is shown once at mint time. Default lifetime is 90 days.
2. **Put it in the OneCLI vault** for host
   `geotravel-production.up.railway.app`, auth style
   `Authorization: Bearer`. Easiest path: when a call fails
   unauthenticated, hand the user the OneCLI connect link from the
   error flow, prefilled for that host, and retry after they paste the
   token.

## Symptoms

- **401 / unauthorized** — no token in the vault for this host, the
  token was revoked, or it expired (90-day default). Mint a fresh one.
- **403 / forbidden on `update_recovery_action`** — token is read-only.
  Mint a read + write token; the read tools keep working meanwhile.
- **"multiple workspaces" error** — the token spans several workspaces;
  pass `workspace_id` explicitly (pick via `list_properties`).
- **429** — rate limited; back off and retry, do not hammer.

Tokens can be revoked any time from the same settings page; suggest
revoking the old one whenever a fresh token is minted.
