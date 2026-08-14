# Connecting Google (Calendar + Gmail)

Google is this agent's main external credential: **Calendar** holds the family's schedule; **Gmail**
is where the family's logistics land. Both connect the same way; whether the connect flow is a
plain sign-in or first asks for an OAuth client depends on the OneCLI instance, not the app.

## How to use this reference

This is **orientation**. Guide the user in your own words. **Expect the UI to have drifted**, so
adapt to what the user tells you they see on their screen.

Don't paste the whole setup as one wall. Send a small batch (two or three steps), let them reply
"done," then send the next. Keep the language plain and easy to follow.

## Connect in OneCLI (start here)

For each app, in the OneCLI web UI:

1. Open OneCLI: prefer the connect link the gateway put in the error response; otherwise it's
   usually at **http://127.0.0.1:10254** (the address is instance-configurable). Then **Apps →
   Gmail / Google Calendar → Connect**.
2. Sign in with the Google account the agent should act as: the one that receives (or gets
   forwarded) the school, appointment, and bill mail. **Same account for both apps.**
3. Approve the requested access, then retry the failed call.

Gmail should come back connected with `gmail.readonly`, `gmail.modify`, and `gmail.send`;
Calendar with `calendar.readonly` and `calendar.events`.

**If Connect asks for a Client ID + Secret** (an instance without platform Google credentials),
the family needs their own **Web-application OAuth client** from Google Cloud Console: next
section. **One client covers both apps.**

## Google Cloud Console (once, covers both apps)

At https://console.cloud.google.com, what has to be true along the way:

- A **project** exists (new or reused).
- The **OAuth consent screen** is set up; fill in the app info, then choose **External** (app name
  + their email).
- **The user is added as a Test user** on that consent screen; *skip this and they hit "Access
  blocked" later.* This is the step most setups miss.
- The **Gmail API and Google Calendar API are enabled**. **Do this first**: the scope picker only
  lists scopes for APIs that are already enabled.
- **Then** add the scopes on the consent screen (Gmail: `gmail.readonly`, `gmail.modify`,
  `gmail.send`; Calendar: `calendar.readonly`, `calendar.events`); *enabling an API is not the
  same as granting its scope; miss this and they hit "Access blocked: this app's request is
  invalid."* Usually **APIs & Services → Data access → Add or remove scopes** (may vary).
- An **OAuth client** of type **Web application** is created → this gives the **Client ID + Secret**.
  Keep them handy and keep the tab open; the connect flow shows a redirect URL to paste back here.

Then finish the Connect flow with the client:

- The OneCLI connect screen shows a **Redirect URL** plus fields for the Client ID/Secret.
- **Copy that Redirect URL into the Google app** (the OAuth client's Authorized redirect URIs); it
  must match **exactly**.
- **Paste the Client ID + Secret** into OneCLI and authorize; sign in with the same funneled
  account for both apps.

When both are done, re-check the connectors and let the user know they're set.

## Remote box?

If NanoClaw runs on a remote machine or VM, the connect link won't open as-is: Google's sign-in
has to reach OneCLI back, and the VM's local address won't work in their browser. Guide them
through an SSH tunnel from their own machine; never suggest exposing OneCLI publicly when a
tunnel is possible, and don't dead-end them or send them to an admin.

1. Find where OneCLI actually listens; on a VM it's often `172.17.0.1:10254` (the Docker
   bridge), not `localhost`.
2. From their own machine: `ssh -L 10255:172.17.0.1:10254 <user>@<vm-host>` (a local `10255`
   dodges any local OneCLI on `10254`).
3. They open `http://localhost:10255` in their browser and run the whole connect flow there;
   Google's redirect lands on `localhost` and tunnels back in, nothing goes public.

If a tunnel truly isn't possible, they can expose OneCLI through the VM's public proxy as a
fallback: behind the provider's login, with a test account, for the minutes it takes, then
private again. Gotchas on that path: Google may redirect to OneCLI's internal host and time out
(have them swap that host for their public address in the browser bar, keeping the `?code=...`),
and a proxy that can't reach OneCLI needs a bridge first:
`socat TCP-LISTEN:10255,fork,reuseaddr TCP:172.17.0.1:10254`, then expose `10255`.

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
