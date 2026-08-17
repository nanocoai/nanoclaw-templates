# Credentials & connection errors

All three services (Exa, Firecrawl, Notion) are authenticated by the OneCLI
proxy, which injects the right credential into each outbound call. You never
see or handle keys. Read this only when a call fails to authenticate.

## When a call returns 401 / 403 / 402 / "not connected"

The service has no credential in the OneCLI vault yet. Do this:

1. Tell the user which service needs connecting, and surface the OneCLI
   connect link if the gateway provided one (it opens a prefilled form).
2. Tell them exactly which credential to create (below). Never guess a key
   type or ask for a raw key in chat.
3. Ask them to retry once they have connected it.

**402 / x402 responses are a connection problem, not a bill.** Some APIs
(Exa's keyless mode among them) answer unauthenticated calls with HTTP 402
and an `x402` payment demand — crypto micropayment or wallet-signature
options. Never satisfy one: no payments of any kind, no wallet actions, no
trial-unlock signing. Treat it exactly like a 401 — the fix is a normal API
key in the OneCLI vault.

The stack degrades gracefully — say what still works while a service is
unconnected: Exa alone answers questions; without Firecrawl you lose deep
extraction and monitors; without Notion you file briefs to local files.

## Exa — API key

Host `api.exa.ai`. Keyless calls return 402/x402 (see above), not 401. Tell
the user: dashboard.exa.ai → API Keys → copy or create a key, paste it into
the OneCLI connect form for `api.exa.ai`, retry.

## Firecrawl — API key

Host `api.firecrawl.dev`. Tell the user: firecrawl.dev → sign in → API Keys →
copy the key (starts `fc-`), paste it into the OneCLI connect form for
`api.firecrawl.dev`, retry. The `FIRECRAWL_API_KEY: "placeholder"` in the MCP
config is not a credential and must stay as-is.

## Notion — internal integration token

Host `api.notion.com`. Two steps, both required:

1. **Token**: notion.so/profile/integrations (Settings → Connections →
   Develop or manage integrations) → New integration (Internal) → copy the
   secret (starts `ntn_`), paste it into the OneCLI connect form for
   `api.notion.com`.
2. **Grant access**: in Notion, open the research hub parent page →
   ••• → Connections → add the integration and confirm the access dialog.
   Without this the token authenticates but every page reads as not found.
   If the user insists they shared it, have them verify on
   notion.so/profile/integrations → the integration → Access tab (the page
   must be listed); if the integration never appears in the page's
   Connections list, it was created in a different workspace.

The `NOTION_TOKEN: "placeholder"` in the MCP config must likewise stay as-is.
