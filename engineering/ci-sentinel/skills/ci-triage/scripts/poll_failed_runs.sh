#!/usr/bin/env bash
# CI Sentinel task gate. Runs on every scheduled fire inside a 30s / 1MB budget.
#
# CONTRACT: the last line of stdout MUST be valid JSON and the script MUST
# exit 0. A non-zero exit, a timeout, or unparseable output marks the
# occurrence failed, and 8 consecutive failures auto-pause the whole series.
# Every failure path below therefore degrades to {"wakeAgent":false}.
#
# Diagnostics go to stderr only.

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
# shellcheck source=gh_api.sh
. "$SELF_DIR/gh_api.sh" 2>/dev/null || {
  echo '{"wakeAgent":false,"data":{"error":"helper_missing"}}'; exit 0; }

emit() { printf '%s\n' "$1"; exit 0; }

ERR_FILE="$STATE_DIR/consecutive-errors.count"
LEDGER="$STATE_DIR/ledger.jsonl"

err_count()  { [ -r "$ERR_FILE" ] && cat "$ERR_FILE" 2>/dev/null || echo 0; }
err_bump()   { ensure_state && printf '%s' "$(( $(err_count) + 1 ))" > "$ERR_FILE" 2>/dev/null; }
err_reset()  { ensure_state && printf '0' > "$ERR_FILE" 2>/dev/null; }

# Degrade quietly, but not forever: after N consecutive failures wake the agent
# once so an expired token surfaces as a message instead of silence.
degrade() {
  local reason="$1"
  err_bump
  local n; n=$(err_count)
  local threshold; threshold=$(cfg ALERT_AFTER_CONSECUTIVE_ERRORS 3)
  if [ "$n" -eq "$threshold" ] 2>/dev/null; then
    emit "{\"wakeAgent\":true,\"data\":{\"kind\":\"sentinel_health\",\"error\":\"$reason\",\"consecutiveErrors\":$n}}"
  fi
  emit "{\"wakeAgent\":false,\"data\":{\"error\":\"$reason\",\"consecutiveErrors\":$n}}"
}

# --- watch window -----------------------------------------------------------
# Outside the window this costs zero API calls. An overnight agent should be
# asleep at 14:00.
in_window() {
  local w start end now
  w=$(cfg WATCH_WINDOW "20:00-08:30")
  [ "$w" = "always" ] && return 0
  case "$w" in *-*) : ;; *) return 0 ;; esac
  start=$(printf '%s' "${w%%-*}" | tr -d ': '); end=$(printf '%s' "${w##*-}" | tr -d ': ')
  now=$(date +%H%M)
  case "$start$end$now" in *[!0-9]*) return 0 ;; esac
  now=$((10#$now)); start=$((10#$start)); end=$((10#$end))
  if [ "$start" -le "$end" ]; then [ "$now" -ge "$start" ] && [ "$now" -lt "$end" ]
  else [ "$now" -ge "$start" ] || [ "$now" -lt "$end" ]; fi
}

command -v curl >/dev/null 2>&1 || degrade "curl_missing"
ensure_state || degrade "state_dir_unwritable"

in_window || emit '{"wakeAgent":false,"data":{"reason":"outside_watch_window"}}'

REPOS=$(cfg REPOS "")
[ -z "$REPOS" ] && emit '{"wakeAgent":false,"data":{"reason":"no_repos_configured"}}'

LOOKBACK=$(cfg LOOKBACK_HOURS 12)
MAX_RUNS=$(cfg MAX_RUNS_PER_NIGHT 10)
BRANCH_FILTER=$(cfg BRANCHES "")

# ISO-8601 cursor. BusyBox and GNU date disagree on -d/-v, so try both.
since=$(date -u -d "-${LOOKBACK} hours" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null \
        || date -u -v-"${LOOKBACK}"H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null \
        || echo "")

found=""; total_new=0; errors=0; repos_seen=0

for repo in $(printf '%s' "$REPOS" | tr ',' ' '); do
  [ -z "$repo" ] && continue
  repos_seen=$((repos_seen + 1))
  [ "$total_new" -ge "$MAX_RUNS" ] && break

  q="status=failure&per_page=20&exclude_pull_requests=true"
  [ -n "$since" ] && q="$q&created=%3E%3D$since"
  [ -n "$BRANCH_FILTER" ] && case "$BRANCH_FILTER" in *,*) : ;; *) q="$q&branch=$BRANCH_FILTER" ;; esac

  etag_file="$STATE_DIR/etag-$(printf '%s' "$repo" | tr '/' '_')"
  extra=""
  [ -r "$etag_file" ] && extra="$(cat "$etag_file" 2>/dev/null)"

  if [ -n "$extra" ]; then
    body=$(gh_api GET "/repos/$repo/actions/runs?$q" "" -H "If-None-Match: $extra")
  else
    body=$(gh_api GET "/repos/$repo/actions/runs?$q")
  fi
  rc=$?

  [ $rc -eq 3 ] && continue                       # 304: nothing changed, free
  if [ $rc -ne 0 ]; then errors=$((errors + 1)); continue; fi

  new_etag=$(last_etag); [ -n "$new_etag" ] && printf "%s" "$new_etag" > "$etag_file" 2>/dev/null

  # Run ids come from html_url, which is unambiguous: nested actor/repository
  # objects never match /actions/runs/<id>. Avoids needing jq on this path.
  ids=$(printf '%s' "$body" \
        | grep -o '"html_url"[[:space:]]*:[[:space:]]*"https://github.com/[^"]*/actions/runs/[0-9]*"' \
        | grep -oE '[0-9]+"$' | tr -d '"')

  for id in $ids; do
    [ "$total_new" -ge "$MAX_RUNS" ] && break
    if [ -r "$LEDGER" ] && grep -q "\"run_id\":$id\b" "$LEDGER" 2>/dev/null; then continue; fi
    found="$found{\"repo\":\"$repo\",\"run_id\":$id},"
    total_new=$((total_new + 1))
  done
done

# Every repo errored -> treat as a real fault, not a quiet no-op.
if [ "$errors" -gt 0 ] && [ "$errors" -eq "$repos_seen" ]; then
  degrade "all_repos_failed"
fi

err_reset

if [ "$total_new" -eq 0 ]; then
  emit '{"wakeAgent":false,"data":{"reason":"no_new_failures"}}'
fi

emit "{\"wakeAgent\":true,\"data\":{\"kind\":\"ci_failures\",\"count\":$total_new,\"runs\":[${found%,}]}}"
