# Credentials and the search tool

This template ships with **no key**. It works out of the box on Tavily's
keyless allowance. Nothing to sign up for before the first run.

## How the tool is wired

`mcp.json` starts `mcp-remote` (pinned to `0.8.3`) as a local bridge to
Tavily's hosted MCP server over HTTP. Two headers ask for keyless access:

```
X-Tavily-Access-Mode:keyless
X-Client-Name:nanoclaw
```

The headers are written with no space after the colon. Some hosts split
arguments on spaces, and a broken header means a 401 on every call. Keep it
that way.

## Which tools you get

The bridge is told to ignore three of Tavily's five tools:

- `tavily_crawl`, `tavily_map`, `tavily_research` are removed at the bridge.
  The model never sees them.

You have exactly two:

- `tavily_search` finds pages.
- `tavily_extract` opens one and returns its text.

Why only two: this agent's discipline is "open every hit". Crawl and map
pull in pages nobody chose; research writes conclusions nobody checked.
Search and extract keep every page a deliberate, citable act.

## The keyless allowance

Keyless access is free, but it is a **monthly allowance of a few dozen calls
per network address**, shared by every agent on that host. Tavily does not
publish the exact number. It is enough to try the template once. A real
research pass, which opens every hit, needs a key.

When the allowance runs out, a tool result will say so in plain words
(the message names a monthly cap and points to signing up). The rule is:

1. Write `(other) Tavily keyless cap reached; add a key` to
   `open-questions.md`.
2. Stop searching. Do not retry.
3. Report what you have.

**A rate limit is not the cap.** An HTTP 429, or a message saying "reduce
the rate of requests", means you were too fast, not that the month is
spent. Wait 30 seconds and retry that one query once. Only if it fails
again do you treat it as the cap. Keyed accounts hit 429 too.

## Upgrading to a key

A Tavily account comes with a monthly free tier of credits, and paid tiers
above that. To use a key:

1. Create a key in the Tavily dashboard.
2. Store it in your host's credential manager (on NanoClaw, OneCLI). Never
   paste it into `mcp.json`, a task file, or a chat.
3. Have the credential manager inject it on requests to `mcp.tavily.com` as
   `Authorization: Bearer <key>`, and remove the `X-Tavily-Access-Mode`
   header for that agent. The `X-Client-Name` header can stay.

Two things that bite:

- **Do these together, never one alone.** Without the keyless header and
  without an injected key, Tavily's server starts a browser sign-in flow
  and the bridge blocks waiting for a callback that never comes on a
  headless host. The agent then has no tools and no error.
- **Node does not read the proxy variables by default.** If your credential
  manager works as an HTTPS proxy (OneCLI does), the bridge only uses it
  when `NODE_USE_ENV_PROXY=1` is set in the agent's environment, alongside
  `HTTPS_PROXY` and the proxy's CA certificate. Set all three.

Once a key is in place, the cap rule above still applies; it just triggers
later. Rate limits (429) apply to keyed accounts too.

## First start

`npx` downloads the bridge the first time it runs. On a cold cache that can
take longer than the host's MCP startup timeout, and the two tools will be
missing in the first turn. If that happens, restart the agent once. Hosts
that run many agents should pre-install `mcp-remote@0.8.3` in the image.

## What this template never does

- Never ships a key, a placeholder key, or a token.
- Never requests the crawl, map, or research tools by name.
- Never uses WebSearch, WebFetch, or a shell in place of the Tavily tools.
- Never uses a search allowance to get around a login wall, a paywall, or a
  living-person hold.
