# Cost Sentinel AWS bridge

A small Cloudflare Worker that holds your real AWS credentials and speaks
plain bearer-token-authenticated MCP to the `finops-cost-sentinel`
template. See the comment at the top of `src/worker.js` for why this
exists instead of talking to AWS Cost Explorer directly from inside
NanoClaw's container.

## Deploy your own instance

You need your own deployment - this is not a shared service, and the
AWS credentials you set are yours alone.

```bash
cd proxy
pnpm install
pnpm wrangler login          # opens a browser, authorizes Wrangler against your Cloudflare account
pnpm wrangler secret put AWS_ACCESS_KEY_ID
pnpm wrangler secret put AWS_SECRET_ACCESS_KEY
pnpm wrangler secret put PROXY_AUTH_TOKEN   # generate with: openssl rand -hex 32
pnpm run deploy
```

`wrangler deploy` prints your Worker's URL
(`https://finops-cost-sentinel-proxy.<your-subdomain>.workers.dev`).

## IAM policy for the credentials you set

Same minimum policy as documented in the template's top-level README:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "ce:GetCostAndUsage",
      "ce:GetCostForecast",
      "ce:GetAnomalies",
      "ce:GetRightsizingRecommendation"
    ],
    "Resource": "*"
  }]
}
```

## Wire it into the template

In the template's `mcp.json`, set the `aws-cost-explorer` server's `url`
to your deployed Worker's URL. Leave its `Authorization` header value as
the bare literal `"placeholder"` - that's required for the stamp-time
secret lint to pass, not a mistake. Grant the real token through the
vault instead:

```bash
onecli secrets create \
  --name aws-cost-explorer-proxy \
  --type api_key \
  --value "<your PROXY_AUTH_TOKEN>" \
  --host-pattern <your-worker-subdomain>.workers.dev \
  --header-name Authorization \
  --value-format 'Bearer {value}'
```

`--value-format` is what actually puts `Bearer ` on the wire - the vault
sends `Bearer <token>`, matching this Worker's auth check
(`Authorization: Bearer ${PROXY_AUTH_TOKEN}`) in `src/worker.js`.

Also update `ai.nanoco.nanoclaw/tasks/critical-spike-check.md`'s
`script:` field with your real Worker URL (the placeholder domain is
hardcoded there too, separately from `mcp.json` - see the comment in
that file).

## Local testing before deploying

```bash
pnpm run dev
```

This runs the Worker locally via Wrangler's dev server. You can exercise
the `initialize` / `tools/list` / `tools/call` JSON-RPC methods with
`curl` against `http://localhost:8787` before pointing a real agent at
it - useful for checking the protocol envelope independently of whether
your AWS credentials are set yet.

## Status

Written directly from the MCP Streamable HTTP transport spec and the AWS
Cost Explorer JSON API reference - not yet run against a live NanoClaw
agent or a live AWS account. Verify both before relying on this for a
demo recording.
