# Reference: Connecting the API-key services (Exa, SerpAPI, X)

These three are simple key entries in OneCLI (unlike Google's OAuth — see
`connecting-google.md`). Each is one secret the **user** adds; you never see or handle the
key. Hand the user a **pre-filled deep link** so the form fills itself — don't make them
add it by hand, because manual entry scrambles the fields (the header name lands in the
host box, and it defaults to `Authorization: Bearer`, so the key silently goes to the wrong
place).

## The connect link

Give the user this URL — they open it, paste their key, and Save:

```
<ONECLI>/p/<project>/connections/custom?create=generic&host=<HOST>&path=/*&<AUTH>&name=<LABEL>
```

- **`<ONECLI>`** = the user's OneCLI address. On their own machine that's
  **`http://127.0.0.1:10254`**. On a **remote/VM** setup they reach OneCLI at their own
  public URL — tell them to use that. **Never hand them the `172.17.0.1:10254` address you
  see internally** — that's the container's view; their browser can't reach it.
- **`path=/*`** — always `/*`, never `/`. `/` matches only the root path, so real API calls
  (`/search`, `/search.json`) don't match and the key **silently never works**.
- **`<project>`** = the project id in OneCLI's own URLs (e.g. `/p/abc123/...`).
- **`<AUTH>`** is either `header=<NAME>&format={value}` or `param=<NAME>` (see table).

## Per service

| Service | `host` | `<AUTH>` |
|---------|--------|----------|
| Exa | `api.exa.ai` | `header=x-api-key&format={value}` |
| SerpAPI | `serpapi.com` | `param=api_key` |
| X (Twitter) | `api.x.com` | `header=Authorization&format=Bearer%20{value}` |

Example (Exa):
`<ONECLI>/p/<project>/connections/custom?create=generic&host=api.exa.ai&path=/*&header=x-api-key&format={value}&name=Exa%20API%20Key`

## If they must enter it by hand

Only if the deep link won't prefill. Give the **exact** fields: host `<HOST>` (no
`https://`, no trailing slash), **Path `/*`**, the auth type/name from the table, value =
their raw key. Watch the two traps: the host box must hold the *host* (not the header
name), and the injection must match the table (not the default `Authorization: Bearer`).

## Verify

After they save, re-check (a real call that reaches the provider = connected). If a key
comes back **invalid** (not "not configured"), the plumbing works — that's the key
value/plan, not the setup.
