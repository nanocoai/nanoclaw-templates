# Reference: Connecting Google (Docs + Sheets)

Use this when the user needs help connecting Google — offered by the bold line in the
intro. Read their **intent**, not exact words: "yes", "idk how", "help me", "google's
confusing" all mean *walk me through it*.

**Set expectations first.** This is a **one-time setup**, and it's the genuinely fiddly
part — it is **not** a single "click to connect" button. There are two parts:

1. **Google Cloud Console** — create a Google OAuth app (this is where the credentials
   come from).
2. **OneCLI** — paste that app's credentials in and authorize.

Google **Docs** and **Sheets** are **two separate OneCLI connectors**, but they can
share **one** Google OAuth app — so you do the Google Console part once, then plug it
into both connectors. Go one step at a time, wait after each, and be patient and
encouraging — this trips up non-technical users.

---

## Part 1 — Google Cloud Console (create the OAuth app)

Send them to **https://console.cloud.google.com** and walk these:

1. **Create or pick a project** — use the project selector in the **top-left** (next to
   the "Google Cloud" logo; it may currently show a default like *"Gemini"* or another
   project name) → *New Project*. Or reuse an existing one.
2. **Configure the OAuth consent screen** — *APIs & Services → OAuth consent screen*
   (may appear under *Google Auth Platform*). **Fill out the app information**: add an
   **app name** + **their email**, and select **External**. (Do this before enabling
   APIs — it's a prerequisite for creating the OAuth client in step 4.)
3. **Go back to *APIs & Services → Library*** and search for and **Enable** each of:
   - **Google Docs API**
   - **Google Sheets API**
   - **Google Drive API** *(only if they want new docs auto-filed into a Drive folder —
     optional)*
4. **Create the credential** — *APIs & Services → Credentials → Create Credentials →
   OAuth client ID*:
   - Application type: **Web application**.
   - **Authorized redirect URIs → Add URI**, and paste the **Redirect URL that OneCLI
     shows** (see Part 2, step 2). Redirect URIs are editable anytime, so it's fine to
     create the client now and add/adjust this after you've read it off OneCLI.
5. **Copy the `Client ID` and `Client secret`** Google gives you — these go into OneCLI
   next.

> If they later hit **"Access blocked / app not verified"** when signing in, it's the
> test-user gap — see Common snags below to add their account under the consent
> screen's Audience/Test-users section.

---

## Part 2 — OneCLI (plug it in and authorize)

1. **Open the OneCLI connections page** at **http://127.0.0.1:10254/connections**.
   - **On a VM with no browser?** Forward the port and use your own machine's browser:
     `ssh -L 10254:127.0.0.1:10254 <your-vm>`, then open
     http://127.0.0.1:10254/connections locally.
2. Find the **Google Docs** connector and **press Connect** — it reveals a **Redirect
   URL** plus fields for the **Client ID** and **Client Secret**.
3. **Copy that Redirect URL**, then go back to the Google tab: *Credentials* → under
   **OAuth 2.0 Client IDs** click **your client's name** → **Authorized redirect URIs →
   Add URI** → paste it → **Save**. It must match *exactly* (including any trailing
   slash).
4. Back in OneCLI, paste the **Client ID** and **Client Secret** (Part 1, step 5),
   finish connecting, and **sign in** with the Google account the docs should live in.
   Docs is now connected.
5. **Repeat for the Google Sheets connector** — reuse the **same** Client ID/Secret; add
   its Redirect URL to the same Google OAuth client's authorized list too, then Connect.

**CLI alternative** (same effect as pasting into the UI, then Connect in the browser):
```bash
onecli apps configure --provider google-docs   --client-id <ID> --client-secret <SECRET>
onecli apps configure --provider google-sheets  --client-id <ID> --client-secret <SECRET>
```

---

## Verify

```bash
onecli apps get --provider google-docs    # status should be "connected"
onecli apps get --provider google-sheets   # status should be "connected"
```
Then re-run the connectors check and report back: ✅ both connected, or name what's
still missing.

## Common snags

- **`redirect_uri_mismatch` (Error 400)** — the Redirect URL in Google doesn't exactly
  match OneCLI's. Copy OneCLI's value again, character for character, into the Google
  client's *Authorized redirect URIs*.
- **"Access blocked / app isn't verified"** — they weren't added as a **Test user** on
  the OAuth consent screen (Part 1, step 3). Add them, retry.
- **Only Docs *or* Sheets connected** — they configured/authorized just one connector;
  do the other (Part 2, step 4).
- **Wrong Google account** — disconnect and Connect again, picking the right account.
