# Reference: Connecting Google Docs + Sheets (BYOC OAuth)

Two OneCLI connectors, **Google Docs** and **Google Sheets**, connected via
OAuth. They share one Google app, so the Google side is done once.

## Part 1: Google Cloud Console (https://console.cloud.google.com)

The target is a **Web-application OAuth client** and its **Client ID +
Secret**. What has to be true along the way:

- A **project** exists (new or reused).
- The **OAuth consent screen** is set up: fill in the app info, then choose
  **External** (app name + their email).
- **The user is added as a Test user** on that consent screen.
- The **Google Docs API and Google Sheets API are enabled** (Drive API too,
  only if they want docs auto-filed into a folder).
- The Docs + Sheets **scopes** are added on the consent screen. Usually APIs
  & Services → Data access → Add or remove scopes (may vary).
- The OAuth client of type Web application is created, providing **Client ID
  + Client Secret**.
- Part 2 produces a redirect URL to paste back here.

## Part 2: OneCLI

First, **where is OneCLI running?**

- Local (their own computer): probably `http://127.0.0.1:10254`.
- Remote machine / VM: the local address won't work. Google's sign-in has to
  reach OneCLI back, so it needs a public web address (preferably behind a
  login). Exposing OneCLI publicly is a one-time infrastructure change; this
  part may need a coding agent (e.g. Claude Code).

Then, in OneCLI → Connections:

- Connect Google Docs. It shows a Redirect URL plus fields for the Client ID
  and Client Secret.
- Copy that Redirect URL into the Google app (the OAuth client's Authorized
  redirect URIs); it must match **exactly**.
- Back in OneCLI, paste the Client ID + Secret and authorize (sign in if asked).
- Do the same for Google Sheets: same Client ID and Secret, add its redirect
  URL to the same Google app.

When both are done, re-check the connectors and let the user know they're set.

## Common snags

- **`redirect_uri_mismatch`**: the redirect URL in Google doesn't exactly
  match OneCLI's. Re-copy OneCLI's value, character for character.
- **"Access blocked: this app's request is invalid"**: usually the **scopes**
  aren't added on the consent screen (enabling the APIs isn't enough). Add
  the Docs + Sheets scopes.
- **"Access blocked / app not verified"**: the user isn't a **Test user** on
  the consent screen. Add them, then retry.
- **Sign-in hangs / nothing happens after Approve**: it often completed
  silently; refresh the callback and the OneCLI Connections page before
  retrying.
- **On a VM, the callback times out** on `172.17.0.1:10254`: swap that host
  for their public address in the browser bar.
- **Only one of Docs/Sheets connected**: do the other connector too (same app).
- **Wrong Google account**: disconnect and connect again with the right one.
