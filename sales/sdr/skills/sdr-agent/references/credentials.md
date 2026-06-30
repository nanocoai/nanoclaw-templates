# Credentials & connection errors

Both services (HubSpot, Exa) are authenticated by the OneCLI proxy,
which injects the right credential into each outbound call. You never see or
handle keys. Read this only when a call fails to authenticate.

## When a call returns 401 / 403 / "not connected"

The service has no credential in the OneCLI vault yet. Do this:

1. Tell the user which service needs connecting, and surface the OneCLI connect
   link if the gateway provided one (it opens a prefilled connection form).
2. Tell them exactly which credential to create (below). Never guess a key type
   or ask for a raw key in chat.
3. Ask them to retry once they have connected it.

## HubSpot: the credential is a Service Key (Beta)

HubSpot's local MCP server needs a **Service Key**: HubSpot's account-level,
system-to-system credential (public beta).

Tell the user: in HubSpot, go to **Development > Keys > Service keys**, create a key with the scopes below,
copy the `pat-...` token, and paste it into the OneCLI connect form for
`api.hubapi.com`.

```
crm.objects.contacts.read
crm.objects.contacts.write
crm.objects.companies.read
crm.objects.deals.read
crm.objects.deals.write
crm.objects.owners.read
crm.objects.notes.read
crm.objects.notes.write
crm.lists.read
crm.lists.write
```

A Service Key only carries scopes the creating user already has, so they need an
account with full CRM access.

## Exa

Exa uses an API key; the user pastes it into the OneCLI connect form for
`api.exa.ai`, then retries. Open your Exa dashboard > API key, then copy an
existing key or create a new one.
