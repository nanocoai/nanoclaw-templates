# Reference: Connecting Google (Docs + Sheets)

Use this when the user needs help connecting Google — offered by the intro's bold line.
Read their **intent**, not exact words ("yes", "idk how", "help me", "google's
confusing" all mean *walk me through it*).

## Deliver this as a guided back-and-forth — NOT one wall of text

Send it as **~4 short messages**, pausing after each for the user to act and reply.
**Never dump all the steps in one message.** Walk straight through the stages in order —
don't ask "which part are you starting from," and at the end don't ask what stage
they're on. Be patient and encouraging; this is the fiddliest part of setup.

Google **Docs** and **Sheets** are two OneCLI connectors that share **one** Google app,
so the Google side is done once.

---

### Message 1 — set expectations, then ask if they're ready

> Connecting Google is a **one-time setup** — it's the fiddly part, so I'll go slowly and
> stay with you. There are **two parts**: first we make a small Google "app" in the
> Google Cloud Console, then we plug it into OneCLI.
>
> Good news: **Google Docs and Sheets share the same app**, so we only do the Google side
> once. **Ready?**

Wait for a yes before sending Part 1.

---

### Message 2 — Part 1: Google Cloud Console

> **Part 1 — Google Cloud Console** (https://console.cloud.google.com)
> 1. **Create a project** — top-left project selector (it may show a default like
>    "Gemini") → **New Project**. Or reuse one.
> 2. **APIs & Services → OAuth consent screen** — add an **app name** + **your email**,
>    choose **External**. (Do this before the next step.)
> 3. **APIs & Services → Library** → search and **Enable**: **Google Docs API** and
>    **Google Sheets API**. *(Add **Google Drive API** too only if you want docs
>    auto-filed into a folder.)*
> 4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** →
>    Application type **Web application** → **Create**.
> 5. **Copy the Client ID and Client Secret** and keep them handy — we'll plug them into
>    OneCLI in Part 2, right after we grab the authorized redirect link.
> 6. **Keep this Google tab open** — in Part 2 OneCLI gives us a redirect URL you'll paste
>    back here, so don't close it.
>
> **Ready to move on to Part 2?**

Wait for a yes before sending Part 2. (If they later hit "Access blocked / app not
verified," it's the test-user gap — see Common snags.)

---

### Message 3 — Part 2: OneCLI

> **Part 2 — OneCLI**
> 1. Open **http://127.0.0.1:10254 → Connections**, and press **Connect** on **Google
>    Docs**. It shows a **Redirect URL** plus fields for your Client ID + Secret.
> 2. **Copy that Redirect URL** and add it in your open Google tab (Credentials → your
>    OAuth client → **Authorized redirect URIs → Save**).
> 3. Back in OneCLI, **paste your Client ID + Client Secret** and connect (sign in with
>    your Google account if it asks) — Google Docs is now linked.
> 4. **Do the same for Google Sheets** — same Client ID/Secret, add its redirect URL to
>    the same Google app.

Wait for them to finish, then confirm. *(On a VM with no browser, forward the port first:
`ssh -L 10254:127.0.0.1:10254 <vm>`, then open the URL locally.)*

---

### Message 4 — confirm

Re-check the connectors, then:

> ✅ Google Docs and Google Sheets are both connected — you're all set!

If one is still ❌, name which and point them at the matching snag below.

## Common snags

- **`redirect_uri_mismatch`** — the Redirect URL in Google doesn't exactly match
  OneCLI's. Re-copy OneCLI's value, character for character.
- **"Access blocked / app not verified"** — add their account as a **Test user** on the
  OAuth consent screen (its Audience / Test-users section), then retry.
- **Only one of Docs/Sheets connected** — do the other connector (Part 2, step 4).
- **Wrong Google account** — disconnect and Connect again with the right account.

## Verify (for you, the operator)

Code snippet (runs in a terminal on the host, not the chat):
`onecli apps get --provider google-docs` and `--provider google-sheets` — each status
should read "connected".
