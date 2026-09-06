# Credentials & connection errors

All three services (Apify, Exa, Gmail) are authenticated by the OneCLI proxy, which
injects the right credential into each outbound call. You never see or handle keys.
Read this only when a call fails to authenticate.

## When a call returns 401 / 403 / "not connected"

The service has no credential in the OneCLI vault yet. Do this:

1. Tell the user which service needs connecting, and surface the OneCLI connect link
   if the gateway provided one (it opens a prefilled connection form).
2. Walk them through connecting it (below). Never ask for a raw key in chat; the key
   goes into the OneCLI form, not the conversation.
3. Ask them to retry once they have connected it.

## Exa: create an API key

Walk the user through:

1. Sign in at **dashboard.exa.ai** (create an account if they don't have one; new
   accounts start with free credits, and after that Exa is pay-as-you-go).
2. Open **API Keys** and create a new key (or copy an existing one).
3. Paste the key into the OneCLI connect form for host `api.exa.ai` (it is sent as an
   `x-api-key` header).
4. Retry the failed call.

## Apify: copy the API token

Walk the user through:

1. Sign in at **console.apify.com**.
2. Go to **Settings > API & Integrations** and copy the personal API token.
3. Paste it into the OneCLI connect form for host `api.apify.com` (it is sent as
   `Authorization: Bearer`).
4. Retry the failed call.

Note: some Apify Actors (X/Twitter especially, plus premium Reddit/YouTube/TikTok/
Instagram scrapers) bill a per-result fee beyond the free $5 credit. If a scan needs a
paid Actor, flag the rough cost before the user commits (see ground rule 4).

## Gmail: connect the account (OAuth)

Gmail uses Google OAuth, not a pasted key; there's nothing to copy by hand. The
OneCLI connect link opens Google's consent screen; the user signs in and grants
access, and the token lands in the vault. Walk them through:

1. Open the OneCLI connect link for Gmail (the gateway provides it).
2. Sign in to the Google account whose inbox they want triaged and approve the
   requested access.
3. Retry the failed call.

> TODO (verify at stamp time): the exact Gmail MCP package, OAuth scopes, and how
> OneCLI brokers the Google consent flow are not yet confirmed. Nail this down when the
> agent is first stamped, then tighten the steps above.

## One caution

`.mcp.json` sets each service's env value to `onecli-managed` only so the MCP server
can boot. That sentinel is not the credential and must never be replaced with a real
token or key; the real credentials live only in the OneCLI vault.
