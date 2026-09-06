# Credentials & connection errors

The Apify actors (Google Maps, Google Maps Reviews, TripAdvisor) are authenticated by the OneCLI
proxy, which injects the credential into each outbound call. You never see or handle keys. Read
this when the traveler opts into Apify at first contact ([onboarding.md](onboarding.md)) or when a call fails
to authenticate.

## When a call returns 401 / 403 / "not connected"

The service has no credential in the OneCLI vault yet. Do this:

1. Deliver the web-search answer first; Apify is the extra, not the plan.
2. Tell the user Apify needs connecting, then run "Apify: connect it" below.
3. Ask them to retry once they have connected it.

A 401 after `memory/index.md` says `Apify: connected ...` means the vault entry was removed. Don't
trust the fact over the error: replace it with `Apify: declined <today>` (or `connected` again once
they re-save it), then proceed as above.

## Apify: connect it

The vault entry is created through a form in the OneCLI dashboard, in the **user's browser**. You
cannot see the dashboard's address from inside this container, so ask for it (if the gateway
already put a connect link in an error response, use that instead and skip to step 3):

> *"Can you open the OneCLI dashboard in a browser? If yes, what URL do you use for it?"*

On a local install it is usually `http://127.0.0.1:10254`; on a remote or Docker-bridge install it
is something else. **Do not guess it, and do not proceed on an assumed one.**

**If they can:**

1. Build the link from **their** OneCLI URL and send it:

   ```
   <their-onecli-url>/connections/secrets?create=generic&host=api.apify.com&name=Apify&header=Authorization&format=Bearer%20%7Bvalue%7D
   ```

   It opens a prefilled form for host `api.apify.com`; the token is sent as `Authorization: Bearer`.
2. Sign in at **console.apify.com**, go to **Settings > API & Integrations**, copy the personal API
   token.
3. Paste it into the value field of that form and save.
4. When they say it's saved, write the core fact `Apify: connected <YYYY-MM-DD>` to
   `memory/index.md` per your memory system's core-memory rules, replacing any earlier `Apify:`
   fact. Credentials are per agent, so other channels read this and won't ask again.
5. Retry the failed call (or, at first contact, carry on with onboarding).

**If they cannot:** someone with access to the NanoClaw host has to create the entry there. Say so
and move on; never ask for the token in chat, and never try to write the vault entry yourself.

One caution: [mcp.json](../../../mcp.json) sets `APIFY_TOKEN: "placeholder"` only so the MCP server can boot. That
placeholder is not the credential and must never be replaced with a real token; the real token
lives only in the OneCLI vault.

Plan limits: the Google Maps scraper runs on Apify's free plan at the small caps this skill uses.
The Reviews and TripAdvisor actors are pay-per-result and may refuse to run on the free plan (the
token authenticates, the actor declines). If that happens, say it plainly, point to
https://apify.com/pricing, and carry on with the web-search answer instead of retrying.
