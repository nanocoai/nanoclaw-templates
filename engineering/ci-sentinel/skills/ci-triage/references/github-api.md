# GitHub REST notes

Everything goes through `gh_api.sh`, which enforces the daily call budget, sends the vault
placeholder header, and records status and ETag. Do not hand-roll `curl` — an unbudgeted loop
is how a night turns into a rate-limit block.

```bash
. "$SC/gh_api.sh"
body=$(gh_api GET "/repos/o/r/actions/runs/123")
printf '%s' "$body" | json_get '.head_branch'
```

`gh_api` returns 0 on 2xx, 3 on 304, 1 otherwise. Because it is normally called inside
`$(...)`, variable assignments inside it cannot reach you — read status and ETag back with
`last_status` and `last_etag`.

## Endpoints used

| Purpose | Endpoint |
|---|---|
| Failed runs for the gate | `GET /repos/{o}/{r}/actions/runs?status=failure&per_page=20` |
| One run | `GET /repos/{o}/{r}/actions/runs/{run_id}` |
| Jobs and steps | `GET /repos/{o}/{r}/actions/runs/{run_id}/jobs?per_page=50` |
| Job log | `GET /repos/{o}/{r}/actions/jobs/{job_id}/logs` (302 — see below) |
| Last green run | `GET /repos/{o}/{r}/actions/workflows/{wf}/runs?status=success&branch=…&created=<=…` |
| Commit range | `GET /repos/{o}/{r}/compare/{base}...{head}` |
| Re-run failed jobs | `POST /repos/{o}/{r}/actions/runs/{run_id}/rerun-failed-jobs` |
| File an issue | `POST /repos/{o}/{r}/issues` |
| Comment | `POST /repos/{o}/{r}/issues/{number}/comments` |
| Find existing issue | `GET /search/issues?q=repo:{o}/{r}+label:ci-sentinel+state:open+{fingerprint}` |

## Quirks that will bite you

**Log download redirects to another host.** The logs endpoint answers 302 with a `Location`
pointing at a signed blob URL (`objects.githubusercontent.com`, or Azure blob storage). Two
consequences: `curl -L` would replay the `Authorization` header to that host, and a signed URL
rejects a second auth mechanism with a 400; and under egress lockdown that host must be
reachable separately from `api.github.com`. `fetch_job_log` handles both by reading the
`Location` and fetching it clean. If logs are consistently unavailable while metadata works,
this is why.

**`exclude_pull_requests=true` does not exclude PR runs.** It omits the `pull_requests` field
from the response. Fork-PR runs still appear; the trust gate in `run_evidence.sh` is what
actually filters them.

**`created=` needs URL encoding.** `>=` is `%3E%3D`, `<=` is `%3C%3D`.

**The last green run must predate the failure.** Query without `created=<=` and you will match
a later re-green, get an empty commit range, and mistake it for the "nothing changed" signal —
which points at an entirely wrong class.

**Logs expire.** Retention is 90 days by default and far less on many plans. A missing log for
an older run is normal, not a fault.

**Search is rate-limited separately** (30/min authenticated) and is eventually consistent. An
issue you just created may not appear for a minute — rely on the fingerprint file in memory,
not on search, to know what you already filed.

**Timestamps are UTC.** The watch window is local time. Do not compare them without converting.

## Rate limits

5,000 requests/hour authenticated. `MAX_API_CALLS_PER_NIGHT` is far stricter, deliberately: it
bounds a runaway loop long before GitHub does. Conditional requests with `If-None-Match` return
304 and cost almost nothing — the gate already stores an ETag per repo.

## Writing

Always send a JSON body from a file, never inline, so quoting cannot corrupt it:

```bash
cat > /tmp/issue.json <<'JSON'
{"title":"…","body":"…","labels":["ci-sentinel"]}
JSON
gh_api POST "/repos/o/r/issues" /tmp/issue.json
```

Build the body with a heredoc or `node -e` and JSON-encode it properly. Log excerpts contain
backticks, quotes and backslashes that will otherwise produce malformed JSON or, worse, an
issue body that renders as something you did not write.
