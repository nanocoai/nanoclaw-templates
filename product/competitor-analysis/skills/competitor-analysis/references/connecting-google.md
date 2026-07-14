# Reference: Connecting Google (Docs + Sheets)

Use this when the user needs help connecting Google — read their **intent**, not exact
words ("yes", "idk how", "help me", "google's confusing" all mean *walk me through it*).

## How to use this reference

This is **orientation** Guide the user in your own words, and
**expect the UI to have drifted** If
what's on their screen doesn't match what's below, trust the screen: adapt or look up the
current step rather than reading stale instructions or stalling. Only pull the user in
when they're the only one who can do a thing or there's a real decision — don't narrate every step. You're walking through it gradually, a few steps at a time, pausing for them to act before moving on. 

## The goal

Two OneCLI connectors — **Google Docs** and **Google Sheets** — connected via OAuth. They
**share one Google app**, so the Google side is done once. 

## Part 1 — Google Cloud Console (https://console.cloud.google.com)

The target is a **Web-application OAuth client** and its **Client ID + Secret**. What has
to be true along the way:

- A **project** exists (new or reused).
- The **OAuth consent screen** is set up (External; app name + their email).
- **The user is added as a Test user** on that consent screen — *skip this and they hit
  "Access blocked" later.* This is the step most setups miss.
- The **Google Docs API and Google Sheets API are enabled** (Drive API too, only if they
  want docs auto-filed into a folder).
- An **OAuth client** of type **Web application** is created → this gives the **Client ID
  + Secret**. Keep them handy and keep the tab open — Part 2 produces a redirect URL to
  paste back here.

## Part 2 — OneCLI

First, **where is OneCLI running?**

- **Local (their own computer):** it's at **http://127.0.0.1:10254**.
- **Remote machine / VM:** the local address won't work, and port-forwarding isn't enough
  — Google's sign-in has to reach OneCLI back, so it needs a **public web address** (behind
  a login). That's a one-time infrastructure change: tell the user this part needs a coding
  agent (e.g. Claude Code) to expose OneCLI publicly, then finish here using that address.

Then, in OneCLI → **Connections**:

- **Connect Google Docs.** It shows a **Redirect URL** plus fields for the Client ID/Secret.
- **Copy that Redirect URL into the Google app** (the OAuth client's Authorized redirect
  URIs) — it must match **exactly**.
- Back in OneCLI, **paste the Client ID + Secret** and authorize (sign in if asked).
- **Do the same for Google Sheets** — same Client ID/Secret, add its redirect URL to the
  same Google app.

When both are done, re-check the connectors and let the user know they're set.

## Common snags

- **`redirect_uri_mismatch`** — the redirect URL in Google doesn't exactly match OneCLI's.
  Re-copy OneCLI's value, character for character.
- **"Access blocked / app not verified"** — the user isn't a **Test user** on the consent
  screen. Add them, then retry.
- **Only one of Docs/Sheets connected** — do the other connector too (same app).
- **Wrong Google account** — disconnect and connect again with the right one.
