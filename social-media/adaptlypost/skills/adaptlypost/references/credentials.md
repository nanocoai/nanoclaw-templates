# Credentials and connection errors

AdaptlyPost is authenticated by the credential gateway, which adds the key to
every request for `mcp.adaptlypost.com`. You never see or handle the key.
Read this only when the connection fails.

## Symptoms

- The `mcp__adaptlypost__*` tools are missing from your tool list, or a call
  returns 401, "Authentication required" or "not connected": no key is
  stored for `mcp.adaptlypost.com` yet, or the stored one was revoked.
- A call returns 401 with `token_issuer_lost_access`: the member who created
  the key left the workspace or was deactivated. The key is dead.
- A call returns 403 with `permission_denied`: the key works but its role is
  too small for that action. See the role table in `SKILL.md`. Not a
  credential problem, so do not ask for a new key unless the user wants a
  bigger role.
- A call returns 403 with `subscription_required`: the organization's plan
  does not include API access or has lapsed. Every call fails the same way.
  Not a credential problem either; the user has to renew the plan.
- A call returns 429: rate limited (600 requests a minute per key). Wait for
  `Retry-After` seconds; do not loop.

## What to tell the user

1. Say AdaptlyPost is not connected yet. If the gateway's error carried a
   `connect_url`, show it as a bare URL on its own line.
2. Tell them how to make the key:
   - Sign in at https://adaptlypost.com and open **API Tokens**
     (https://adaptlypost.com/api-tokens).
   - Create a new token for this agent only, so it can be revoked on its own.
   - Pick its role: **Contributor** if the agent should only draft and a
     person publishes, **Editor** if the agent should schedule and publish.
   - Copy the key. It starts with `adaptly_` and is shown once.
3. They store it in the gateway for host `mcp.adaptlypost.com`, header
   `Authorization`, value `Bearer <key>`: through the connect link, the
   gateway dashboard, or the command in the template README.
4. Ask them to tell you when it is done, then retry the original request.
   If the tools were missing, the agent may need a restart
   (`ncl groups restart`) before they appear.

Never ask the user to paste the key into chat. If they paste one anyway, tell
them to revoke it in AdaptlyPost and make a new one, because chat history is
not a safe place for it.
