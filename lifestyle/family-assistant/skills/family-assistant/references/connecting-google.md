# Reference: Connecting Google (Calendar + Gmail)

Google is this agent's main external credential. **Calendar** holds the family's schedule; **Gmail**
is where the family's logistics land. The simple default is **one Google account** the family
funnels everything into, used for both Calendar and Gmail; that's the funnel model onboarding sets
up. If a family would rather keep separate inboxes, OneCLI does support **more than one account per
provider** (e.g. each parent's own Gmail), see **Multiple accounts** below; treat it as the
optional path, not the default.

**Gmail is usually quick** (managed by OneCLI, no Google Cloud setup; though some instances ask for
an OAuth client too; see below). **Calendar takes longer** (its own OAuth client from Google Cloud
Console). Do Gmail first for an easy win.

## When a call returns 401 / 403 / "not connected"

The connector has no credential in the OneCLI vault yet:

1. Tell the user which connector needs connecting and surface the OneCLI connect link if the
   gateway provided one.
2. Walk them through the setup below. Never ask for a raw key or secret in chat.
3. Ask them to retry once connected.

If they're on a VM or remote box and the link won't open, don't dead-end them or send them to an
admin. Guide them through reaching it.

## How to use this reference

This is **orientation**. Guide the user in your own words. **Expect the UI to have drifted**, so
adapt to what the user tells you they see on their screen.

Don't paste the whole setup as one wall. Send a small batch (two or three steps), let them reply
"done," then send the next. Keep the language plain and easy to follow.

## Gmail: usually the quick one (OneCLI-managed)

**Usually** no Google Cloud Console is needed; OneCLI handles the OAuth. In the OneCLI web UI:

1. Open OneCLI (**http://127.0.0.1:10254**) → **Apps → Gmail → Connect**.
2. Sign in with the Google account the agent should act as: the one that receives (or gets
   forwarded) the school, appointment, and bill mail.
3. Approve the requested access, then retry the failed call.

It should come back connected with `gmail.readonly`, `gmail.modify`, and `gmail.send` scopes.

**If OneCLI asks for a Client ID + Secret for Gmail too**, don't push back; follow the Calendar
route below, just enabling the **Gmail API** and its scopes (`gmail.readonly`, `gmail.modify`,
`gmail.send`) instead. One OAuth client can cover both.

## Google Calendar: the longer one (Google Cloud Console + OneCLI)

Calendar needs its own **Web-application OAuth client** (a Client ID + Secret) from Google Cloud
Console, then connected in OneCLI.

### Part 1: Google Cloud Console (https://console.cloud.google.com)

What has to be true along the way:

- A **project** exists (new or reused).
- The **OAuth consent screen** is set up; fill in the app info, then choose **External** (app name
  + their email).
- **The user is added as a Test user** on that consent screen; *skip this and they hit "Access
  blocked" later.* This is the step most setups miss.
- The **Google Calendar API is enabled**. **Do this first**: the scope picker only lists scopes for
  APIs that are already enabled.
- **Then** add the **Calendar scopes** on the consent screen; *enabling an API is not the same as
  granting its scope; miss this and they hit "Access blocked: this app's request is invalid."*
  Usually **APIs & Services → Data access → Add or remove scopes** (may vary).
- An **OAuth client** of type **Web application** is created → this gives the **Client ID + Secret**.
  Keep them handy and keep the tab open; Part 2 produces a redirect URL to paste back here.

### Part 2: OneCLI

First, **where is OneCLI running?**

- **Local**: it's at **http://127.0.0.1:10254**.
- **Remote machine / VM**: the VM's local address won't work in their browser, and Google's sign-in
  has to reach OneCLI back. **Prefer an SSH tunnel; it's the secure way and keeps OneCLI private**
  (never expose it publicly if you can tunnel). First, check where OneCLI is actually listening; on
  a VM it's often **`172.17.0.1:10254`** (the Docker bridge), not `localhost`. From the user's own
  machine, forward a local port to that address, e.g.:

  ```
  ssh -L 10255:172.17.0.1:10254 <user>@<vm-host>
  ```

  (Use `10255` locally to dodge a collision with any local OneCLI on `10254`.) Then open OneCLI at
  **`http://localhost:10255`** in their browser and do the whole connect flow there; Google's
  redirect lands on `localhost`, tunnels back in, and nothing is ever public.

  **Only if a tunnel isn't possible** (for example, browser-console access, no SSH), expose OneCLI publicly
  as a fallback: use the VM's public-proxy for port `10254`, keep it **behind the provider's login**,
  do it with a **test account** and only for the minutes it takes, then make it private again. Gotcha
  for this path: after they approve, Google may redirect to OneCLI's *internal* host
  (`172.17.0.1:10254`) and time out; have them **swap that host for their public address** in the
  browser bar (keeping the `?code=...`) to finish.

Then, in OneCLI → **Apps → Google Calendar → Connect**:

- It shows a **Redirect URL** plus fields for the Client ID/Secret.
- **Copy that Redirect URL into the Google app** (the OAuth client's Authorized redirect URIs); it
  must match **exactly**.
- Back in OneCLI, **paste the Client ID + Secret** and authorize; sign in with the **same account
  you connected Gmail to**.

When both are done, re-check the connectors and let the user know they're set.

## Multiple accounts (optional)

The default is one funneled account, but OneCLI can hold **more than one connection for the same
provider**, so a family that would rather not forward mail around can connect **each parent's own
Gmail** (the same idea works for Calendar). This is opt-in; only reach for it if they ask.

**Connecting a second account.** Connect the Gmail app in OneCLI again and sign in with the *other*
account. Each sign-in becomes its own **connection** with an id (like `conn_9f2c1b`) and a **label**;
give each a clear one ("Mum", "Dad") so they're easy to tell apart later.

**Using them.** Once two accounts of the same provider are connected, a normal Gmail call can come
back with a **`409 multiple_connections`**, the gateway asking *which* account you mean. It lists
each connection's id and label. Retry the **same** request with a header naming the one you want:

```
x-onecli-connection-id: conn_9f2c1b
```

To read across **both** inboxes (as the morning brief and week-ahead want to), make the call once
per connection id and merge the results. If you only ever connect one account, none of this fires;
the gateway just injects that one credential and you never see a 409.

## Common snags

- **`redirect_uri_mismatch`**: the redirect URL in Google doesn't exactly match OneCLI's. Re-copy
  OneCLI's value, character for character.
- **Sign-in hangs / nothing happens after Approve**: it often completed silently; have them refresh
  the callback and the OneCLI Connections page before retrying.
- **Wrong Google account**: disconnect and connect again with the right one, and make sure Calendar
  and Gmail use the same account.
- **Tunnel or public proxy can't reach OneCLI on a VM**: it's bound to the Docker bridge
  (`172.17.0.1:10254`), not `localhost`. Point the SSH tunnel straight at that address. If you must
  use the VM's public proxy instead, bridge a host port to it first with
  `socat TCP-LISTEN:10255,fork,reuseaddr TCP:172.17.0.1:10254`, then expose `10255`.
