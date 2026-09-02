# Connecting Google Calendar

Calendar is this agent's other credential: it's where you find a slot that actually works, and
where the confirmed booking lands. Whether the connect flow is a plain sign-in or first asks for an
OAuth client depends on the OneCLI instance, not the app.

## How to use this reference

This is **orientation**. Guide the owner in your own words, and **expect the UI to have drifted** —
adapt to what they tell you they see on their screen. Don't paste the whole setup as one wall: send
two or three steps, let them reply "done", then send the next.

## Connect in OneCLI (start here)

1. Open OneCLI: prefer the connect link the gateway put in the error response; otherwise it's
   usually at **http://127.0.0.1:10254** (the address is instance-configurable). Then **Apps →
   Google Calendar → Connect**.
2. Sign in with the Google account whose calendar the bookings should land in.
3. Approve the access, then retry the failed call.

Calendar should come back connected with `calendar.readonly` and `calendar.events`.

**If Connect asks for a Client ID + Secret** (an instance without platform Google credentials), the
owner needs their own **Web-application OAuth client** from Google Cloud Console: next section.

## Google Cloud Console (once)

At https://console.cloud.google.com, what has to be true along the way:

- A **project** exists (new or reused).
- The **OAuth consent screen** is set up; fill in the app info, then choose **External** (app name
  + their email).
- **The owner is added as a Test user** on that consent screen; *skip this and they hit "Access
  blocked" later.* This is the step most setups miss.
- The **Google Calendar API is enabled**. **Do this first**: the scope picker only lists scopes for
  APIs that are already enabled.
- **Then** add the scopes on the consent screen (`calendar.readonly`, `calendar.events`);
  *enabling an API is not the same as granting its scope; miss this and they hit "Access blocked:
  this app's request is invalid."* Usually **APIs & Services → Data access → Add or remove scopes**
  (may vary).
- An **OAuth client** of type **Web application** is created → this gives the **Client ID +
  Secret**. Keep them handy and keep the tab open; the connect flow shows a redirect URL to paste
  back here.

Then finish the Connect flow with the client:

- The OneCLI connect screen shows a **Redirect URL** plus fields for the Client ID/Secret.
- **Copy that Redirect URL into the Google app** (the OAuth client's Authorized redirect URIs); it
  must match **exactly**.
- **Paste the Client ID + Secret** into OneCLI and authorize.

## Remote box?

If NanoClaw runs on a remote machine or VM, the connect link won't open as-is: Google's sign-in has
to reach OneCLI back, and the VM's local address won't work in their browser. Guide them through an
SSH tunnel from their own machine; never suggest exposing OneCLI publicly when a tunnel is
possible.

1. Find where OneCLI actually listens; on a VM it's often `172.17.0.1:10254` (the Docker bridge),
   not `localhost`.
2. From their own machine: `ssh -L 10255:172.17.0.1:10254 <user>@<vm-host>` (a local `10255` dodges
   any local OneCLI on `10254`).
3. They open `http://localhost:10255` in their browser and run the connect flow there; Google's
   redirect lands on `localhost` and tunnels back in, nothing goes public.

## Which calendar

The default is the account's primary calendar. If the owner keeps a separate calendar for personal
bookings, ask **once** which one bookings should land in and record it in memory — then stop
asking.

## Common snags

- **`redirect_uri_mismatch`**: the redirect URL in Google doesn't exactly match OneCLI's. Re-copy
  OneCLI's value, character for character.
- **Sign-in hangs / nothing happens after Approve**: it often completed silently; have them refresh
  the callback and the OneCLI Connections page before retrying.
- **Wrong Google account**: disconnect and connect again with the right one.
- **`409 multiple_connections`**: more than one Google account is connected and the gateway is
  asking which. Retry the same request with `x-onecli-connection-id: <id>` naming the one they
  chose, and record that id in memory so you don't ask twice.
