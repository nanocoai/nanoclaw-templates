# Maintainer

An issue-triage assistant for people who maintain GitHub repositories.

It watches the repos you name, and when an issue arrives it classifies it,
searches for duplicates, checks whether a bug report is actually reproducible,
and sends you a proposed label set plus a draft reply. Nothing reaches GitHub
until you say yes.

**The watching costs nothing.** A gate script polls the public GitHub API with no
credentials at all, and the agent is only woken when something new actually
appeared. A GitHub token is needed only to act — to comment and to label.

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

Approval is per action. Saying yes to one issue does not approve the next one.

## What it deliberately does not do

- **It does not close, reopen, lock, merge, or assign anything.** Ever, even if
  asked. Those are one-click actions in the GitHub UI and they are not worth the
  blast radius of an agent getting them wrong.
- **It does not touch pull requests.** Code review is a different job.
- **It does not post without an explicit yes** for that specific action.
- **It does not claim to reproduce bugs.** It cannot run your code and it says so.
- **It does not create labels.** If nothing in your taxonomy fits, it tells you.
- **It does not act on repositories outside the list you configured.**

## Install

```bash
ncl groups create --template engineering/maintainer --name "Maintainer"
```

Then wire it to a channel and say hello. On first contact it runs its onboarding:
which repos, which labels, what tone, and anything it should never do. It writes
your answers to `memory/conventions/` and to the watcher's config, so triage is
reproducible rather than improvised.

### Add the GitHub tools

The template ships **no `mcp.json`**, on purpose. Register the GitHub MCP server
yourself, once, with your own token:

```bash
ncl groups config add-mcp-server \
  --id <group-id> \
  --name github \
  --url https://api.githubcopilot.com/mcp/x/issues \
  --headers '{"Authorization": "Bearer <your-token>"}'
ncl groups restart --id <group-id>
```

That URL is GitHub's remote MCP server scoped to the **issues toolset only**, not
the full server. The agent needs issue tools, so it gets issue tools and nothing
else.

#### Why the server is not in the template

An earlier version declared this server in `mcp.json` with
`"Authorization": "placeholder"`, expecting the OneCLI Agent Vault to substitute
the real token by API host. It does not: the vault does not inject into the
headers of a plugin-owned server, and the ownership guard then refuses
`remove-mcp-server` because the entry would reappear on the next restamp. Reading
issues worked (the public API needs no auth) but every write hung.

This matches the documented position that static header credentials on a
plugin-owned server are unsupported, and that the operator should register a
user-owned server with `--headers` instead. Rather than ship a server that cannot
authenticate, this template ships none and asks for one command.

The endpoint itself is fine — a direct `initialize` call against
`https://api.githubcopilot.com/mcp/x/issues` with a real bearer token returns a
valid JSON-RPC handshake.

### Token scopes

| Field | Value |
|-------|-------|
| Service | GitHub |
| API host | `api.githubcopilot.com` |
| Auth style | `Authorization: Bearer <token>` |
| Scopes | A fine-grained PAT limited to the repositories you watch, with **Issues: read and write** and **Metadata: read**. Nothing else. |
| Where to get it | GitHub → Settings → Developer settings → Personal access tokens |
| Cost | Free. No paid service is required. |

The gate script does **not** use this token. It calls the public
`api.github.com` unauthenticated — 60 requests per hour per IP, which covers a
30-minute poll over five repositories with room to spare.

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

It also lets the task run every 30 minutes at all: ungated template tasks are
capped at four firings per 24 hours.

## When things fail

The agent follows a written playbook rather than improvising retries.

| Failure | Behaviour |
|---------|-----------|
| Token missing, expired, or under-scoped | Reports once. No retry loop. |
| Rate limited | Watcher stays quiet; the agent stops calling and names the reset time. |
| Repository renamed, private, or deleted | Watcher wakes the agent, which tells you and leaves your config alone. |
| Network or 5xx during a poll | Watcher stays quiet and does **not** advance its cursor, so issues that arrived during an outage are still picked up on the next successful poll. |
| Issue closed between the proposal and your approval | Does not post. Tells you and asks. |
| Issue edited between read and approval | Re-reads and re-proposes before posting. |
| A proposed label no longer exists | Does not create it. Reports the mismatch. |
| Onboarding has not run yet | Refuses to triage rather than inventing labels, and names which convention files are missing. |
| 8 consecutive script failures | The runtime auto-pauses the series. `ncl tasks get issue-watch` shows the run log. |

## Files it writes

| Path | Contents |
|------|----------|
| `memory/conventions/repos.md` | The repositories you watch |
| `memory/conventions/labels.md` | Your label taxonomy, mapped to its categories |
| `memory/conventions/voice.md` | Reply tone and your never-do list |
| `/workspace/agent/maintainer-state/repos.txt` | Same repo list, read by the gate script |
| `/workspace/agent/maintainer-state/issue-watch.cursor` | Last successful poll timestamp |

Edit them by asking the agent, or by hand.

## Updating

Re-stamping brings a newer version of the template to the agent it created:

```bash
ncl groups create --template engineering/maintainer --name "Maintainer" --yes
ncl groups restart --id <group-id>
```

Persona and skill changes need the restart to take effect. Task series and their
paused/resumed state survive the restamp.

## Layout

```
engineering/maintainer/
├── plugin.json
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

## Verified

Stamped and run end to end against a live repository before submission:

- Stamps with an empty `templateReport`; re-stamps cleanly and removes a
  plugin-owned MCP server that a hand-run `remove-mcp-server` refuses to touch.
- Gate script ran 7 times with 0 failures across both paths — quiet when nothing
  changed, waking the agent when a watched repo had 9 new issues.
- The container reaches `api.github.com` through the egress lockdown.
- Woken before onboarding had run, the agent refused to triage and named the
  three missing convention files instead of inventing labels.
- Triaged three issues: classified `bug` / `unclear` / `bug`, declined to confirm
  a duplicate because both bodies were empty, and named the missing repro
  elements one by one.
- Approving one proposal posted one comment and applied `bug` + `needs-info`,
  leaving the other two waiting.

## License

MIT, in line with the rest of the NanoClaw template registry.
