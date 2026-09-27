# Credentials and connection errors

RedReplier is authenticated by the credential gateway, which adds the key to
every request for `mcp.redreplier.com`. You never see or handle the key.
Read this only when the connection fails.

## Symptoms

- The `mcp__redreplier__*` tools are missing from your tool list, or a call
  returns 401, "Authentication required" or "not connected": no key is
  stored for `mcp.redreplier.com` yet, or the stored one was revoked.
- A call fails with a message saying the member who created the key lost
  access to the workspace (401 `token_issuer_lost_access`): the creator left
  the workspace, was deactivated, or was moved to a role that cannot use
  RedReplier (only Editor and Admin can). The key is dead; the user needs a
  new key from a current Editor or Admin, with the Editor role.
- A call fails with a message saying the plan does not include API access
  (403 `subscription_required`): the organization's plan lapsed or does not
  cover the API. A new key will not help; the plan must be renewed in
  RedReplier. Tell the user and stop.
- A call returns 429: rate limited (600 requests a minute per key). Wait for
  `Retry-After` seconds; do not loop.

## What to tell the user

1. Say RedReplier is not connected yet. If the gateway's error carried a
   `connect_url`, show it as a bare URL on its own line.
2. Tell them how to make the key:
   - Sign in at https://redreplier.com and open **API Tokens**
     (https://redreplier.com/api-tokens).
   - Create a new token for this agent only, with the **Editor** role, so it
     can be revoked on its own.
   - Copy the key. It starts with `redreplier_` and is shown once.
3. They store it in the gateway for host `mcp.redreplier.com`, header
   `Authorization`, value `Bearer <key>`: through the connect link, the
   gateway dashboard, or the command in the template README.
4. Ask them to tell you when it is done, then retry the original request.
   If the tools were missing, the agent may need a restart
   (`ncl groups restart`) before they appear.

Never ask the user to paste the key into chat. If they paste one anyway, tell
them to revoke it in RedReplier and make a new one, because chat history is
not a safe place for it.
