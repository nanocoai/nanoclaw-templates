# CI Sentinel

Watches GitHub Actions overnight. When a run goes red it investigates — logs, the commit range
since the last green run, lockfile and runner-image drift — deduplicates the failure against
what it has already seen, and files a triage issue where every claim carries a citation. By
morning you get one ranked digest instead of a red dashboard.

It is deliberately quiet. On a green night it costs nothing at all.

## Why it costs nothing when CI is green

Each scheduled fire runs a small `curl` + `grep` gate *before* any model is invoked. If no new
failure exists, the gate returns `{"wakeAgent":false}` and no container starts. The agent wakes
only on red. That is also what lets it poll every 10 minutes: NanoClaw caps ungated tasks at
four fires a day, but a script-gated task may run far more often.

Conditional requests (`If-None-Match`) mean an unchanged repo usually costs a 304.

## What it does with a failure

1. **Claims** the run in a ledger, so a crash resumes instead of double-filing.
2. **Skips fork PRs** by default — a stranger's branch can print anything into a log this agent
   reads while holding a write token.
3. **Collects evidence**: failed jobs, failed steps, a byte-capped log tail, runner environment.
   Everything is redacted before it is written to disk or quoted.
4. **Fingerprints** the failure — normalising timestamps, paths, durations, hashes and counts —
   so the same failure on a different run hashes identically. A recurrence becomes a comment
   with a rate ("6 of the last 20 runs, only on `macos-14`"), not a duplicate issue.
5. **Diffs against the last green run** of the same workflow on the same branch. An empty
   commit range is the loudest signal there is: the code did not change, so the cause is
   external — runner image drift, a floating action tag, an upstream republish, an expired
   credential. That is the overnight case humans lose the most time to, because the instinct is
   to read the diff and the diff is empty.
6. **Classifies** into one of eight classes, each with required evidence. Without that
   evidence the class can only be offered as a labelled hypothesis, never asserted.
7. **Files** an issue, a recurrence comment, or — only if you raise the ceiling — a draft PR.

## What it will not do

- Merge anything, or mark a PR ready for review. Draft only.
- Push to a protected branch.
- Edit `.github/workflows/`. It proposes diffs; the token is not scoped for it, deliberately.
- Disable, skip or retry a flaky test as a "fix". It reports the rate and lets you decide.
- Claim a failure was reproduced unless it actually re-ran the job.
- Open a second issue for a fingerprint that already has an open one.

## Setup

### 1. Stamp the template

```bash
ncl groups create --template engineering/ci-sentinel --name "CI Sentinel"
```

Check `templateReport` in the response. It should be empty; any entry means a component was
skipped.

### 2. Provide a GitHub credential

The template contains no secrets. Requests carry a literal placeholder; the OneCLI vault
matches the host and rewrites the header on the wire, so the container never holds the token.

```bash
onecli secrets create \
  --name GitHub \
  --type api_key \
  --value "$TOKEN" \
  --host-pattern api.github.com
```

Then grant it to the agent group (`onecli agents set-secrets` replaces the whole list, so merge
rather than overwrite).

| | |
|---|---|
| **Vendor** | GitHub |
| **API host** | `api.github.com` (plus the blob host logs redirect to — see Egress) |
| **Auth style** | `Authorization: Bearer <token>` |
| **Where to get it** | GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens |
| **Account role** | Write access to the watched repositories (needed to open issues) |
| **Cost** | Free. GitHub Actions minutes are billed by your existing plan; this agent only spends them for capped re-runs. |

**Exact scopes** — use a fine-grained PAT, not a classic one. Classic `repo` is far broader
than needed.

| Permission | Access | Why |
|---|---|---|
| Actions | Read | List runs, read jobs and logs |
| Contents | Read | Compare commit ranges, read lockfiles |
| Metadata | Read | Required by GitHub alongside the others |
| Issues | Read & Write | File and comment on triage issues |
| Pull requests | Read & Write | **Only** if you raise the ceiling to `draft-pr` |

Do **not** grant the `workflow` scope. An agent that can edit CI definitions can disable the
checks that would catch it being wrong.

For the first weeks, consider marking the secret as requiring manual approval so you see each
write before it happens.

### 3. Configure

Edit `additional_context/ci-sentinel.config.md` in your group folder. At minimum set `REPOS`.
With it empty the agent never wakes.

```
REPOS=acme/api,acme/web
WATCH_WINDOW=20:00-08:30
BRANCHES=main
AUTONOMY_CEILING=issue
```

### 4. Probe the environment

```bash
bash /workspace/agent/plugins/ci-sentinel/skills/ci-triage/scripts/probe_env.sh
```

Checks tools, paths, the config, and — most usefully — whether the vault is actually
injecting your token. An unauthenticated caller gets a 60/hr rate limit instead of
5,000, which is the clearest sign injection is silently not happening. It also tests the
log-download redirect, the one failure that otherwise looks like everything working.

### 4. Resume the tasks

Template tasks arrive **paused**. Nothing runs until you turn it on.

```bash
ncl tasks list --status paused
ncl tasks resume <ci-watch-id>
ncl tasks resume <morning-digest-id>
ncl tasks resume <weekly-self-audit-id>
```

| Task | Schedule | What it does |
|---|---|---|
| `ci-watch` | `*/10 * * * *` | Gated poll; wakes the agent only on a new failure |
| `morning-digest` | `0 8 * * 1-5` | One ranked summary of the night |
| `weekly-self-audit` | `0 9 * * 1` | Scores past diagnoses and records what misled it |

## Rolling it out

Start at `AUTONOMY_CEILING=digest` for a week. It writes nothing to GitHub and reports in chat,
so you can measure whether its diagnoses are any good before it files anything. Move to `issue`
once you trust them, and to `draft-pr` only if you want mechanical fixes (pinning a float,
re-pinning an action to a SHA) proposed as draft PRs.

The weekly self-audit exists to make that judgement with numbers rather than impressions: it
scores closed issues as correct, wrong-class, not-real or unresolved, tracks precision week over
week, and writes what fooled it to `memory/ci/lessons.md`, which it reads before every
investigation.

## Egress

If you run with `NANOCLAW_EGRESS_LOCKDOWN=true`, note that job logs are served from a **second**
host: `/actions/jobs/{id}/logs` returns a 302 to a signed blob URL on
`objects.githubusercontent.com` or Azure blob storage. If run metadata works but every log
reads "log unavailable", that redirect target is blocked.

## Requirements

`curl` and `bash` in the agent container. `jq` is used when present but never required — the
polling gate needs only `curl` and `grep`, and `node` (already present on a NanoClaw host) is
used for JSON parsing when `jq` is absent.

## Files

```
skills/ci-triage/     the investigation pipeline, the taxonomy, and the helper scripts
skills/ci-report/     morning digest and weekly self-audit
ai.nanoco.nanoclaw/   persona, config, operating limits, and the three scheduled tasks
```

State the agent keeps in your group folder:

```
ci-sentinel/state/ledger.jsonl      one line per run seen — dedup and crash safety
ci-sentinel/state/decisions.jsonl   one line per decision — feeds the audit
ci-sentinel/state/evidence/         redacted bundles
memory/ci/fingerprints/             per-failure history and rates
memory/ci/lessons.md                what past mistakes taught it
```

## Licence

MIT.
