---
schedule: "*/30 * * * *"
script: |
  # Wake the agent only when a watched repo has issue activity since the last run.
  # Contract: the last line of stdout must be JSON carrying a "wakeAgent" boolean.
  # Deliberately dependency-free: curl, grep, sed. No jq, no python.
  set -u
  STATE=/workspace/agent/maintainer-state
  REPOS="$STATE/repos.txt"
  CURSOR="$STATE/issue-watch.cursor"
  mkdir -p "$STATE" 2>/dev/null || true

  if [ ! -s "$REPOS" ]; then
    echo '{"wakeAgent": false, "data": "no repos configured"}'
    exit 0
  fi

  SINCE=$(cat "$CURSOR" 2>/dev/null || date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "")
  NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  FOUND=""
  HARD_ERROR=""
  ANY_OK=0
  N=0

  while IFS= read -r REPO; do
    [ -z "$REPO" ] && continue
    [ "$N" -ge 5 ] && break
    N=$((N + 1))
    URL="https://api.github.com/repos/$REPO/issues?state=open&sort=created&direction=desc&per_page=10"
    [ -n "$SINCE" ] && URL="$URL&since=$SINCE"
    BODY=$(curl -sS --max-time 8 -w '\n%{http_code}' -H 'Accept: application/vnd.github+json' "$URL" 2>/dev/null) || continue
    CODE=$(printf '%s' "$BODY" | tail -n 1)
    case "$CODE" in
      200) ANY_OK=1 ;;
      404) HARD_ERROR="$REPO not found - renamed, made private, or deleted"; continue ;;
      401) HARD_ERROR="unauthorized on $REPO"; continue ;;
      *)   continue ;;
    esac
    # html_url ending in /issues/<n> excludes pull requests, which this agent ignores
    HITS=$(printf '%s' "$BODY" \
      | grep -o "https://github.com/$REPO/issues/[0-9]*" \
      | sed 's|.*/||' | sort -un | tr '\n' ' ')
    [ -n "$HITS" ] && FOUND="$FOUND$REPO: $HITS; "
  done < "$REPOS"

  # Only advance the cursor when at least one repo answered, so an outage
  # cannot silently swallow the issues that arrived during it.
  [ "$ANY_OK" -eq 1 ] && printf '%s' "$NOW" > "$CURSOR" 2>/dev/null

  if [ -n "$FOUND" ]; then
    echo "{\"wakeAgent\": true, \"data\": \"new or updated issues -> $(printf '%s' "$FOUND" | sed 's/"/\\"/g')\"}"
  elif [ -n "$HARD_ERROR" ]; then
    echo "{\"wakeAgent\": true, \"data\": \"watcher problem: $(printf '%s' "$HARD_ERROR" | sed 's/"/\\"/g')\"}"
  else
    # Rate limits, 5xx, and network trouble are transient: stay quiet rather than
    # burning the failure budget or paging the user every 30 minutes.
    echo '{"wakeAgent": false}'
  fi
---

The watcher found activity on a repository you maintain. The details are in
`scriptOutput`.

If it reports new issue numbers, triage each one with the `triage-issue` skill,
oldest first, one proposal per issue. Do not post anything — propose and wait.

If it reports a watcher problem instead, do not triage. Follow
`additional_context/failure-playbook.md` and tell the user what broke in one
message. Do not retry the watcher yourself.

If `memory/conventions/` is missing or incomplete, do not triage and do not
guess. Report that onboarding has not run yet, name which of the three files are
missing, and stop. Ask the user to message you directly so the `welcome` skill
can run.
