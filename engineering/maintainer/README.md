# Maintainer

An issue-triage assistant for people who maintain GitHub repositories.

It watches the repos you name, and when an issue arrives it classifies it,
searches for duplicates, checks whether a bug report is actually reproducible,
and sends you a proposed label set plus a draft reply. Nothing reaches GitHub
until you say yes.

## Who it's for

Maintainers of one to five repositories who get more issues than they can answer
the same day, and who want the reading and drafting done for them without handing
over write access to their project's public face.

If you maintain nothing, or you already triage within the hour, this will not
help you.

## What it does

| Step | Behaviour |
|------|-----------|
| Watch | A gated task polls the public GitHub API every 30 minutes and wakes the agent only when something new appeared. |
| Classify | One category per issue — `security`, `duplicate`, `bug`, `feature`, `docs`, `support`, `unclear` — using a fixed decision table, evaluated in a fixed order. |
| Deduplicate | Searches open and closed issues, compares observable behaviour rather than titles, and reports its confidence as `confirmed`, `possible`, or `none`, always with the search terms it used. |
| Check repro | Scores bug reports against four required elements and names the missing ones individually. |
| Draft | Writes the reply in your voice, under 150 words, with no promises about timelines. |
| Wait | Sends you a proposal in a fixed format and stops. |

## What it deliberately does not do

- **It does not close, reopen, lock, merge, or assign anything.** Ever, even if
  asked. Those are one-click actions in the GitHub UI and they are not worth the
  blast radius of an agent getting them wrong.
- **It does not touch pull requests.** Code review is a different job.
- **It does not post without an explicit yes** for that specific action. An
  approval never carries forward to the next issue.
- **It does not claim to reproduce bugs.** It cannot run your code and it says so.
- **It does not create labels.** If nothing in your taxonomy fits, it tells you.
- **It does not act on repositories outside the list you configured.**

## Services and credentials

| Field | Value |
|-------|-------|
| Service | GitHub |
| API host to match | `api.githubcopilot.com` |
| Auth style | `Authorization: Bearer <token>` |
| Scopes | Fine-grained PAT limited to the repositories you watch, with **Issues: read and write** and **Metadata: read**. Nothing else. |
| Where to get it | GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens |
| Cost | Free. No paid service is required. |

The template ships **no credentials**. `mcp.json` carries the literal
`placeholder`, and the real token is held by the OneCLI Agent Vault and injected
by API host at request time. The first time the agent calls GitHub it will reply
with a connect link; paste the token there.

The watcher's gate script calls the **public** `api.github.com` unauthenticated
(60 requests per hour per IP, which covers a 30-minute poll over five repos with
room to spare). The token is only needed to act, not to watch.

### If the vault does not cover the remote server

The remote GitHub MCP server authenticates with a request header. If your install
cannot inject into a plugin-owned server's headers, delete `mcp.json` from your
copy and register the server yourself instead:

```bash
ncl groups config add-mcp-server \
  --id <group-id> \
  --name github-issues \
  --url https://api.githubcopilot.com/mcp/x/issues \
  --headers '{"Authorization": "Bearer <your-token>"}'
ncl groups restart --id <group-id>
```

Everything else in the template works unchanged.

The URL is the `issues` toolset specifically, not the default server. The agent
only needs issue tools, so it only gets issue tools.

## Running it

```bash
ncl groups create --template engineering/maintainer --name "Maintainer"
```

Then talk to it. On first contact it runs its onboarding: which repos, which
labels, what tone, and anything it should never do. It writes your answers to
memory and to the watcher's config.

### Turning on the routines

Both tasks arrive **paused**, as all template tasks do.

```bash
ncl tasks list --status paused
ncl tasks resume issue-watch
ncl tasks resume weekly-digest
```

| Task | Schedule | Gated |
|------|----------|-------|
| `issue-watch` | every 30 minutes | yes — a script decides whether to wake the agent |
| `weekly-digest` | Mondays at 09:00 | no |

To see the watcher work without waiting for the cron slot:

```bash
ncl tasks run issue-watch
ncl tasks get issue-watch
```

### What the gate actually saves

The container still spawns on every firing — the host sweep cannot know the
script's verdict in advance. What the gate saves is the **model invocation**,
which is the expensive part. A quiet week costs 336 container wakes and zero
agent calls.

## When things fail

The agent follows a written playbook rather than improvising retries.

| Failure | Behaviour |
|---------|-----------|
| Token missing, expired, or under-scoped | Reports once with the connect link. No retry loop. |
| Rate limited | Watcher stays quiet; the agent stops calling and names the reset time. |
| Repository renamed, private, or deleted | Watcher wakes the agent, which tells you and leaves your config alone. |
| Network or 5xx during a poll | Watcher stays quiet and does **not** advance its cursor, so issues that arrived during an outage are still picked up on the next successful poll. |
| Issue closed between the proposal and your approval | Does not post. Tells you and asks. |
| Issue edited between read and approval | Re-reads and re-proposes before posting. |
| A proposed label no longer exists | Does not create it. Reports the mismatch. |
| 8 consecutive script failures | The runtime auto-pauses the series. `ncl tasks get issue-watch` shows the run log. |

## Configuration files it writes

| Path | Contents |
|------|----------|
| `memory/conventions/repos.md` | The repositories you watch |
| `memory/conventions/labels.md` | Your label taxonomy, mapped to its categories |
| `memory/conventions/voice.md` | Reply tone and your never-do list |
| `/workspace/agent/maintainer-state/repos.txt` | Same repo list, read by the gate script |
| `/workspace/agent/maintainer-state/issue-watch.cursor` | Last successful poll timestamp |

Edit them by asking the agent, or by hand.

## Layout

```
engineering/maintainer/
├── plugin.json
├── mcp.json                                  # github-issues, streamable-http
├── README.md
├── skills/
│   ├── welcome/                              # onboarding
│   ├── triage-issue/                         # + duplicate-check, repro-checklist
│   └── draft-response/                       # + response-templates
└── ai.nanoco.nanoclaw/
    ├── context/
    │   ├── instructions.md                   # persona
    │   └── additional_context/
    │       ├── triage-rules.md               # categories, repro threshold, labels
    │       ├── approval-policy.md            # safe / ask / never
    │       └── failure-playbook.md           # what to do when calls fail
    └── tasks/
        ├── issue-watch.md                    # */30, script-gated
        └── weekly-digest.md                  # Mondays 09:00
```

## License

MIT, in line with the rest of the NanoClaw template registry.
