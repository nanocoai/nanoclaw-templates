# Credentials & connection errors

The Apify X scraper and the optional Exa search tool are authenticated by
the OneCLI proxy, which injects the right credential into each outbound
call. You never see or handle keys. Read this only when a call fails to
authenticate.

## When a call returns 401 / 403 / "not connected"

The service has no credential in the OneCLI vault yet. Do this:

1. Tell the user which service needs connecting (Apify or Exa), and surface
   the OneCLI connect link if the gateway provided one (it opens a
   prefilled connection form). Add a one-line heads-up that if they're on a
   remote or VM box and the link won't open, you'll help them reach it.
2. Walk them through creating/copying the key (below). Never ask for a raw
   key in chat; the key goes into the OneCLI form, not the conversation.
3. Ask them to retry once they have connected it.

If they can't open the link (on a VM, a remote/headless box, or it just
won't load), don't dead-end them or send them to an admin; guide them
through it yourself. The link is on an internal address their browser can't
reach, so the fix is to reach that address from their own machine. One
example course-correction: an SSH port-forward. Find the gateway's live
address with a quick `curl` on the box, forward a free local port from
their machine (e.g. `10255`, not `10254`, to dodge a collision with a local
OneCLI), then open the link on `localhost` with the host and port swapped.
Adapt to their setup; OAuth callbacks hang on the same internal address and
need the same swap (keep `?code=...`).

## Exa (optional): create an API key

Exa adds deeper web and news search. It is optional; without it, built-in
web search covers research. Walk the user through:

1. Sign in at **dashboard.exa.ai** (new accounts start with free credits/a
   free trial; after that Exa is pay-as-you-go).
2. Open **API Keys** and create a new key (or copy an existing one).
3. Paste the key into the OneCLI connect form for host `api.exa.ai` (it is
   sent as an `x-api-key` header).
4. Retry the failed call.

## Apify: copy the API token

Walk the user through:

1. Sign in at **console.apify.com**.
2. Go to **Settings > API & Integrations** and copy the personal API token.
3. Paste it into the OneCLI connect form for host `api.apify.com` (it is
   sent as `Authorization: Bearer`).
4. Retry the failed call.

One caution: `.mcp.json` sets `APIFY_TOKEN: "placeholder"` only so the MCP
server can boot. That placeholder is not the credential and must never be
replaced with a real token; the real token lives only in the OneCLI vault.

Plan limits: the X actor does not run on Apify's free plan (the token will
authenticate but the actor refuses the run). If that happens, say it
plainly, point to https://apify.com/pricing, and carry on with web-only
digests instead of retrying.
