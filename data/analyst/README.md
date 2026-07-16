# Data Analyst Template

A NanoClaw agent template for data analysis: turn a business or product question
into a measurable one, pull the numbers from the right system, transform them
into a clean analysis table, compute the metric with a real comparison, chart it,
and write up the finding with its caveats.

The agent explains what the data says and why it matters — it surfaces the
finding, the caveat, and a recommendation, and leaves the decision to you.

## Layout

NanoClaw stamps an agent from the few things its template parser reads. Nothing
else in this folder is loaded by the parser.

```
analyst/
├── .mcp.json                       # MCP servers (Mixpanel, HubSpot, BigQuery): no secrets
├── context/
│   └── instructions.md             # REQUIRED: the agent's standing brief
├── skills/
│   └── data-analyst/               # one skill: the analysis operating system (auto-triggers)
│       ├── SKILL.md                #   entry: operating logic + routing to the plays below
│       └── references/             #   the mechanics, read on demand
│           ├── data-extraction.md
│           ├── transform-modeling.md
│           ├── analysis-visualization.md
│           └── reporting.md
└── README.md                       # this file
```

Optional, if you need them: extra `context/additional_context/*.md` files,
referenced from `instructions.md` by plain relative path (e.g.
`additional_context/<file>.md`).

## Stamp an agent from this template

```bash
ncl groups create --template data/analyst --name "Data Analyst"
```

Then wire it to a channel as usual (`/manage-channels`). The skill auto-triggers
by task; it is not pre-loaded.

## Fill these in before first run

Two values in `.mcp.json` are **not** secrets — they are project identifiers that
go in the request path, so OneCLI has no reason to inject them. Replace them with
your own or the servers will point at nothing:

| Placeholder | Where to find it |
|-------------|------------------|
| `YOUR_MIXPANEL_PROJECT_ID` | Mixpanel > Project Settings > Project ID |
| `YOUR_GCP_PROJECT_ID` | Google Cloud console project selector, or `gcloud config get-value project` |

Also set BigQuery's `--location` to your dataset's region (`US`, `EU`,
`us-central1`, …). A mismatched location is the usual cause of "dataset not
found" on a dataset that plainly exists.

The agent's standing brief also ships with bracketed defaults to tailor —
default time window, timezone / week start, and fiscal calendar. See the
"Metric & analysis defaults" section of `context/instructions.md`.

## MCP servers

`.mcp.json` wires three real, installable npm packages. All three were verified
to start and list tools before this template was submitted.

| Server | Package | Role | Tools |
|--------|---------|------|-------|
| `mixpanel` | `@mattgreathouse/mixpanel-mcp@1.0.2` | Product / behavioral analytics | 19 read tools: funnels, retention, cohorts, segmentation, JQL |
| `hubspot` | `@hubspot/mcp-server@0.4.0` | CRM | Contacts, companies, deals, properties, engagements |
| `bigquery` | `@ergut/mcp-bigquery-server@1.0.4` | Data warehouse (SQL) | One `query` tool, read-only |

The Mixpanel server is read-only, which suits the analyst role: it queries
events data but cannot write back to your project.

The BigQuery server is **read-only by design** — only `SELECT` survives; every
query is validated by BigQuery's own dry-run planner, so `INSERT`, `UPDATE`,
`DELETE`, `DROP`, `TRUNCATE`, `MERGE`, and `EXPORT DATA` are rejected. Nothing in
the standing brief is what stops a warehouse write; the server does, at the API.

## Credentials: via OneCLI, not env vars

**No API keys live in this template.** NanoClaw never passes secrets into agent
containers as env vars. The OneCLI gateway holds your credentials in its vault
and injects them into outbound HTTPS calls at the proxy boundary, so the MCP
servers reach their APIs authenticated without the key ever sitting in
`.mcp.json`, the container env, or chat context.

**About the `"placeholder"` values (leave them as-is).** Both
`@mattgreathouse/mixpanel-mcp` and `@hubspot/mcp-server` refuse to start unless
their auth variables are *present* — they check for the variable before any API
call, and exit immediately if it is missing. So `.mcp.json` sets them to the
dummy string `"placeholder"`. It is not a credential: once the service is
connected, the real key is injected automatically at request time. Keep the
placeholder and **never** replace it with a real token. The BigQuery server needs
no such stub and gets none.

### 1. Register each credential in the OneCLI vault (manual route)

Use the OneCLI web UI at **http://127.0.0.1:10254** (or `onecli secrets --help`).
Create one secret per service, matched to that service's API host:

| Service | API host to match | Auth style* | Where to get the key |
|---------|-------------------|-------------|----------------------|
| Mixpanel | `mixpanel.com` (or `eu.mixpanel.com` / `in.mixpanel.com` on those residencies) | `Authorization: Basic` (service account `username:password`) | Organization Settings > Service Accounts |
| HubSpot | `api.hubapi.com` | `Authorization: Bearer` | **Service Key** (Beta), see below |
| BigQuery | `bigquery.googleapis.com` | Google OAuth — **see the caveat below** | Service account key or ADC |

\* Confirm the exact header/param against each provider's current API docs when
you configure the vault entry.

#### Mixpanel: create a Service Account

The Mixpanel server authenticates with a **service account**, which is a
username/password pair sent as HTTP Basic auth against Mixpanel's query API.

1. In Mixpanel, go to **Organization Settings > Service Accounts**.
2. Create one and give it at least **Analyst** access to the project you want
   queried (read is all this template needs).
3. Copy the username and the secret — the secret is shown **once**, at creation.
4. Give the pair to OneCLI for host `mixpanel.com` as Basic auth, and put the
   project ID in `.mcp.json` (it is not a secret — see the table above).

Pick the host that matches your project's data residency: EU projects answer on
`eu.mixpanel.com`, India on `in.mixpanel.com`. A vault entry matched to the wrong
host means the key never gets injected.

#### HubSpot: create a Service Key (Beta)

The local HubSpot MCP server authenticates with a **Service Key**, HubSpot's
account-level credential for system-to-system integrations (public beta). It is
not a Personal Access Key, not a Developer API Key, and not the OAuth flow the
hosted `mcp.hubspot.com` server uses.

1. In HubSpot, go to **Development > Keys > Service keys** (you need Super Admin
   or "Developer tools access").
2. Create a key. This template only reads CRM data, so these scopes are enough:

   ```
   crm.objects.contacts.read
   crm.objects.companies.read
   crm.objects.deals.read
   crm.objects.owners.read
   crm.lists.read
   crm.schemas.contacts.read
   crm.schemas.companies.read
   crm.schemas.deals.read
   ```

   Add the matching `.write` scopes only if you intend to let the agent write
   back to the CRM. HubSpot is the one server here that *can* write, so
   withholding the scope is what keeps the agent read-only, enforced at the API.
3. Copy the key (a `pat-...` Bearer token) and give it to OneCLI for host
   `api.hubapi.com`.

A Service Key only carries scopes the creating user already has, so use an
account with full CRM access. HubSpot suggests rotating the key about every six
months.

#### BigQuery: the one that doesn't fit the vault pattern

**Worth knowing before you wire this up.** Mixpanel and HubSpot use a static key
in a header, which is exactly what the OneCLI vault injects. Google does not:
`@ergut/mcp-bigquery-server` uses the Google Cloud client library, which mints a
short-lived OAuth access token locally (~1 hour) by signing a JWT with a service
account key, then refreshes it. There is no long-lived header value to park in
the vault, so the injection route above does not apply cleanly here.

In practice that means authenticating the container the Google way:

- **ADC** — `gcloud auth application-default login`, with the resulting
  credentials reachable by the agent; or
- **Service account key file** — grant `roles/bigquery.dataViewer` and
  `roles/bigquery.jobUser` on the project, then point
  `GOOGLE_APPLICATION_CREDENTIALS` at the key file.

Both put a credential file on the host rather than in the vault. Reviewers: this
is the open question in this template — if there's a preferred NanoClaw pattern
for Google-style OAuth credentials, say so and I'll rework this section. Mixpanel
and HubSpot are unaffected and work through the vault as normal.

Cost control: the server accepts `--maximum-bytes-billed` to cap a single query's
scan. Set it. The agent is not told to estimate cost before running a job, so
this flag is what stands between an open-ended question and an expensive scan.

### Easiest path: let the agent hand you a connect link

You don't have to set anything up before the agent runs. The first time it calls
a service that isn't connected, it replies with a ready-to-open OneCLI link,
prefilled with that service's host and path, for example:

```
http://127.0.0.1:10254/p/<project-id>/connections/custom?create=generic&host=mixpanel.com&path=/*&name=Mixpanel%20Service%20Account
```

Open it, paste that service's key, and ask the agent to retry. The key lands in
the OneCLI vault the same way as the manual route, so the proxy injects it on
every later call. (This path suits Mixpanel and HubSpot; BigQuery needs the
Google-side setup above.)

### 2. Let the agent see the secrets

Auto-created agents default to `all` secret mode, so every vault secret whose
host pattern matches is injected automatically; usually nothing more to do.
If the agent is in `selective` mode (a `401` from an API whose key *is* in the
vault is the tell), assign them:

```bash
onecli agents list                                       # check secretMode
onecli agents set-secret-mode --id <agent-id> --mode all # inject all matching secrets
```

No container restart needed; the gateway looks up secrets per request.

### Require human approval before sensitive actions

**This template has no behavioral approval layer.** The standing brief is
deliberately short — it scopes, extracts, analyzes, and reports, and it does not
tell the agent to stop and ask before a write, an expensive scan, or a PII
export. Do not rely on the persona to hold it back. What constrains this agent is
structural, and worth setting up on purpose:

| Risk | What actually stops it |
|------|------------------------|
| Warehouse writes | The BigQuery server rejects everything but `SELECT` |
| Mixpanel writes | The Mixpanel server exposes read tools only |
| CRM writes | Withholding HubSpot `.write` scopes — the only writable surface here |
| Runaway query cost | `--maximum-bytes-billed` on the BigQuery server |
| PII exposure | BigQuery `preventedFields` (Protected Mode), plus the scopes above |

If you want a human in the loop on a specific call, use the gateway:

**OneCLI gateway.** OneCLI can *hold* an outbound credentialed request and
require a human to approve it before it leaves the proxy: enforcement the agent
can't talk its way around. It's a two-sided flow:

- **Server-side (OneCLI):** decide *which* requests to hold. Approval policies are
  configured in the OneCLI web UI at **http://127.0.0.1:10254**. As of
  `onecli@1.3.0` the CLI's `rules create --action` only supports `block` and
  `rate_limit`, not `approve`, so use the web UI for approval rules.
- **Host-side (NanoClaw):** already wired. When the gateway emits a pending
  approval, NanoClaw DMs an approver (scoped admin → global admin → owner) for a
  yes/no. Nothing to configure in this template.

Gating is matched on the **outbound HTTP request** (host + method + path), not on
the MCP tool name. To require approval before a HubSpot write, target the
corresponding `api.hubapi.com` endpoint in the rule (confirm the exact path
against HubSpot's API docs). Caveat: if a server-side rule exists but the
NanoClaw host isn't running to answer it, the gated call hangs until the gateway
times out.
