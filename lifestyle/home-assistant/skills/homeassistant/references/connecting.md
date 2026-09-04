# Connecting — wiring Home Assistant, and what a 401 means

**Token into the OneCLI vault first, server wired second.** It is not a preference.
Home Assistant's MCP server advertises OAuth metadata, so an unauthenticated
first connect does not simply fail and retry: it 401s with
`www-authenticate: Bearer`, the client runs OAuth discovery, registers itself as
an OAuth client with an empty token, and from then on treats the server as
OAuth-protected and stops sending the requests the gateway would inject a header
into. That state survives restarts and adding the secret afterwards; only an
operator can clear it (section 6, last row). With the vault entry saved first, the very
first request returns 200 and discovery never runs.

## 1. In Home Assistant, first

Three things, done by them, in their own Home Assistant. Nothing is installed:
the server is a core integration.

1. **Add the integration.** It needs Home Assistant **2025.2 or newer** — check
   Settings → About first, and say so if theirs is older. Settings → Devices &
   services → **Add integration** → **Model Context Protocol Server** → pick the
   **Assist** API. From then on Home Assistant serves `POST /api/mcp/assist`
   itself — the Assist API's own endpoint, always present whatever else the
   integration is configured with. There is nothing to install on the NanoClaw
   host and no restart.
2. **Expose what you should see.** Settings → **Voice assistants** → **Expose**
   tab. The server only serves entities exposed to Assist. Home Assistant
   exposes new lights, switches, covers, climate, fans, media players, scenes,
   scripts, vacuums and the common sensors by itself, so most of a house is
   already there; **locks are not auto-exposed**, and neither is anything they
   turned off. Multi-select on that tab exposes many at once. This can be
   revisited any time — an entity you cannot see later is this step, not a fault.
3. **Create the token.** Their profile (bottom-left avatar) → **Security** →
   **Long-Lived Access Tokens** → Create Token. Home Assistant shows it once.
   Tell them to keep it in their clipboard for section 3 and **not** to paste it
   here. The token carries its user's role: the integration's **"Only allow
   administrator accounts"** option, when on, 401s a non-admin user's token, so
   create it as an administrator.

## 2. The URL — HTTPS only

Their Home Assistant base URL must be **HTTPS**. A plain `http://` address is refused when the server is
wired and will not save. The OneCLI gateway has to reach it, and its certificate
has to be valid, so a `192.168.x.x` / `homeassistant.local` address is a poor
fit even over HTTPS. If they offer one, say that plainly and give them the two
ways to get an HTTPS address:

- **Their own reverse proxy** — Caddy, nginx, or a Cloudflare Tunnel in front
  of Home Assistant. Free, theirs to run.
- **Home Assistant Cloud (Nabu Casa)** — the no-effort route: it hands them a
  `https://<id>.ui.nabu.casa` address with no port forwarding and no
  certificate work. It is a **paid subscription in their own name**, on the
  single Home Assistant Cloud plan — see
  <https://www.nabucasa.com/pricing/>. Nothing here is billed through NanoClaw.

**Home Assistant on the NanoClaw host itself is not an exception.** The URL
check does accept `http://host.docker.internal:8123`, but every request
from this container goes through the OneCLI gateway, and the gateway container
cannot resolve that name, so the call never connects — with or without a
token. A local Home Assistant needs an HTTPS hostname the gateway can resolve,
the same as a remote one.

Ask for the URL, read it back, and only then move on.

## 3. The token first — where is OneCLI?

The vault entry is created through a form in the OneCLI dashboard, in the
**user's browser**. You cannot see the dashboard's address from inside this
container, so ask for it:

> *"Can you open the OneCLI dashboard in a browser? If yes, what URL do you use
> for it?"*

On a local install it is usually `http://127.0.0.1:10254`; on a remote or
Docker-bridge install it is something else. **Do not guess it, and do not
proceed on an assumed one.**

**If they can:** build the link from **their** OneCLI URL and **their** Home
Assistant hostname, and hand it over:

```
<their-onecli-url>/connections/secrets?create=generic&host=<their-ha-host>&name=Home%20Assistant&header=Authorization&format=Bearer%20%7Bvalue%7D
```

The host is the hostname alone, no scheme. The link opens a prefilled form; they
paste the long-lived token into the value field and save.

**If they cannot:** someone with access to the NanoClaw host has to create the
entry there. Say so and stop — never ask for the token in chat, and never try to
write the vault entry yourself.

## 4. Wire the server

Only once the vault entry exists:

```
add_mcp_server({ name: "homeassistant", url: "https://<their-host>/api/mcp/assist" })
```

Two things to say as you do it, because both are visible to them and both look
like failure if unexplained:

- **It raises an admin approval card.** Nothing connects until a NanoClaw admin
  approves it. Say so, and wait.
- **Approval is followed by a restart, and the restart is required.** MCP
  servers only load at container start, so after approving the card an operator
  restarts this group:

  ```bash
  ncl groups restart --id <group-id> --message "connect home assistant"
  ```

  Say so as part of the same message. The chat goes quiet for a moment; that is
  the restart, not a failure.

When you come back, try `GetLiveContext`. If there are still no `homeassistant`
tools, the restart has not happened yet — say that, and ask for it. Do not
diagnose anything else before it.

## 5. If the gateway does not inject

If the vault entry is correct and calls still come back 401 with nothing
arriving at Home Assistant, an operator can attach the header to the server
itself, host-side. That is not something you can do from in here: say that the
fallback exists, that it is documented in the template README under
"Fallback, if the gateway does not inject", and hand it to an operator. Mention
the trade-off — the token then lives in the group's config on the host instead
of the vault.

## 6. When it does not work — and which fault it actually is

**Separate the two first. They look alike from the chat and share no cause.**

- **A call came back 401 or 403.** That is a credential fault. Work down the
  table.
- **There are no `homeassistant` tools at all and nothing returned 401.** Then no
  call was ever made, so nothing about the credentials has been tested. The
  tools did not load — the group was not restarted after approval (section 4), or
  the stale OAuth registration in the last row. Say exactly that, and hand it to an operator.

**Never name a cause you have not observed.** Do not blame the vault, the host
pattern, `selective` mode or an expired token unless something in front of you
says so: an error message, a status, a call that actually failed. "I cannot tell
from in here — here is what an operator can check" is a correct and useful
answer. A confident wrong diagnosis sends someone rewriting a vault entry that
was fine.

Quote the provider's own message when the error carries one. Then work down:

| What is wrong | How it looks | First move |
|---|---|---|
| Token belongs to a non-admin user and "Only allow administrator accounts" is on | Every call 401s, including the first, straight after wiring | New token from an administrator account (section 1, step 3), then update **only the value** of the vault entry — or an admin turns the option off under Settings → Devices & services → Model Context Protocol Server → Configure. |
| Token revoked, or Home Assistant reinstalled | Worked before, 401s now | New long-lived token (section 1, step 3), then update **only the value** of the existing vault entry. |
| Vault entry wrong | 401 from the first call, token is an admin's | Host pattern typo, a scheme or `/api/mcp/assist` left in the host field, or a format of `{value}` instead of `Bearer {value}`. Fixed through the same link — never by asking for the token. |
| Agent in `selective` secret mode, secret not selected for it | Nothing is injected at all; the entry is provably correct | An operator selects the secret for this agent, host-side. |
| Server not loaded | No `homeassistant` tools exist at all, and no call has failed | The group was not restarted after approval (section 4). An operator runs `ncl groups restart`. |
| Stale OAuth registration from a connect made before the vault entry existed | No `mcp__homeassistant__*` tools at all, the agent is told to authorize or to use `/mcp`, no 401 anywhere in evidence, and the vault entry is provably correct | **Operator, on the host.** Delete the `homeassistant\|…` key from the `mcpOAuth` object in `data/v2-sessions/<group-id>/.claude-shared/.credentials.json`, reset `.claude-shared/mcp-needs-auth-cache.json` to `{}`, then `ncl groups restart --id <group-id> --message "reconnect home assistant"`. Nothing inside the container can clear this, and no amount of vault fixing will: the client has stopped making injectable requests. |

A **404** on `/api/mcp/assist` is a different fault: the Model Context Protocol Server
integration has not been added (section 1, step 1), or Home Assistant is older than
2025.2.

**A device that is "not there" is not a connection fault either.** Tools load,
calls answer 200, and the entity is simply missing from `GetLiveContext`: it is
not exposed to Assist (section 1, step 2). Say which entity, point at the Expose tab,
and wait — the next `GetLiveContext` picks it up, no restart needed.
