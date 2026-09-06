# CI Sentinel configuration

Edit the block below after stamping. It lives in your group folder and is yours to change;
the template never overwrites it.

Format is deliberately dumb — `KEY=value`, one per line. The task gate parses it with `grep`
and never `source`s it, so nothing here can execute.

```
# --- what to watch ---------------------------------------------------------
# Comma-separated owner/repo. REQUIRED: with this empty the agent never wakes.
REPOS=

# Local-time window to poll. Outside it the gate exits with zero API calls.
# Use "always" for round-the-clock.
WATCH_WINDOW=20:00-08:30

# Restrict to one branch, or leave empty for all. Multiple branches are
# filtered during triage rather than in the query.
BRANCHES=main

# How far back to look on a cold start.
LOOKBACK_HOURS=12

# --- trust -----------------------------------------------------------------
# Fork PRs let anyone write text into a log this agent reads while it holds a
# write token. Leave false unless you understand that trade.
INCLUDE_FORK_PRS=false

# --- autonomy --------------------------------------------------------------
# digest = report in chat only, write nothing to GitHub
# issue  = open and comment on issues (default)
# draft-pr = additionally open DRAFT pull requests for safe, high-confidence fixes
AUTONOMY_CEILING=issue

# --- budgets (hard stops) --------------------------------------------------
MAX_RUNS_PER_NIGHT=10
MAX_ISSUES_PER_NIGHT=5
MAX_RERUNS_PER_NIGHT=2
MAX_API_CALLS_PER_NIGHT=400
MAX_LOG_BYTES=200000
LOG_TAIL_LINES=120
HTTP_TIMEOUT_SECONDS=20

# Wake once to report after this many consecutive polling failures, so an
# expired token surfaces instead of the agent going quietly dark.
ALERT_AFTER_CONSECUTIVE_ERRORS=3

# --- labels applied to everything this agent files -------------------------
ISSUE_LABEL=ci-sentinel
```

## Notes on the budgets

`MAX_ISSUES_PER_NIGHT` is the anti-runaway control. A broken default branch can turn dozens of
workflows red at once; without a cap the tracker fills with near-duplicates and the agent gets
muted. When the cap is reached the agent files what it has, says what it skipped, and stops.

`MAX_RERUNS_PER_NIGHT` spends real CI minutes. It is only ever used to test a flake hypothesis —
never as a default reaction to a red run.
