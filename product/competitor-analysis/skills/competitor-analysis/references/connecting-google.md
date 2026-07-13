# Reference: Connecting Google (Docs + Sheets)

Use this when the user needs help connecting Google — offered by the bold line in the
intro. Read their **intent**, not exact words: "yes", "idk how", "help me", "google's
confusing" all mean *walk me through it*. Docs and Sheets are **one** Google
connection, so this hooks up both at once.

Go **one step at a time** and wait for the user after each:

1. **Send the link.** Get the `connect_url` from the Google probe's error body and
   give it as a plain clickable link: "Click here to connect Google → {connect_url}".
   It's one-click OAuth — there's no API key to find or paste.
2. **Tell them what to expect.** They'll land on Google's own sign-in/consent screen.
   Have them pick the Google account the docs should live in, then approve.
3. **Grant the access.** On the consent screen they approve **Docs and Sheets**. (If
   they also want new docs auto-filed into a specific Drive folder, they can grant
   **Drive** too — optional; skip it and you'll just create the doc shells yourself.)
4. **Have them come back and say "done."**
5. **Re-probe to confirm**, then report back: ✅ "Google's connected — we're good to
   go" or, if it still fails, name what's missing (e.g. Sheets scope not granted) and
   walk the relevant step again.

## Common snags

- **Wrong Google account** — redo the link and have them pick the right one.
- **Closed the tab before approving** — the connect just doesn't complete; resend the
  link.
- **Only Docs or only Sheets working** — they missed a scope on the consent screen;
  reconnect and approve both.

Be patient and encouraging — this is the one genuinely fiddly part of setup for a
non-technical user.
