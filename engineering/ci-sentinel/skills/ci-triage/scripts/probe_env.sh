#!/usr/bin/env bash
# Verify the container can actually do what CI Sentinel needs. Run this once
# after stamping, and again whenever something stops working.
#
#   bash /workspace/agent/plugins/ci-sentinel/skills/ci-triage/scripts/probe_env.sh
#
# Read-only: makes a handful of GET requests and writes one temp file.

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
. "$SELF_DIR/gh_api.sh" 2>/dev/null || { echo "FAIL  cannot source gh_api.sh"; exit 1; }

pass=0; fail=0; note=0
ok()   { echo "  ok    $1"; pass=$((pass+1)); }
bad()  { echo "  FAIL  $1"; fail=$((fail+1)); }
info() { echo "  note  $1"; note=$((note+1)); }

echo; echo "CI Sentinel environment probe"; echo

echo "tools"
command -v curl >/dev/null 2>&1 && ok "curl $(curl --version 2>/dev/null | head -1 | cut -d' ' -f2)" \
  || bad "curl missing - REQUIRED. Add it: ncl groups config update --packages-apt curl"
command -v bash >/dev/null 2>&1 && ok "bash present" || bad "bash missing"
have_jq && ok "jq present (optional)" || info "jq absent - node is used for JSON instead"
command -v node >/dev/null 2>&1 && ok "node $(node --version 2>/dev/null)" \
  || info "node absent - JSON parsing falls back to grep, which is less reliable"
command -v sha256sum >/dev/null 2>&1 || command -v shasum >/dev/null 2>&1 || command -v openssl >/dev/null 2>&1 \
  && ok "a sha256 implementation is available" \
  || info "no sha256 - fingerprints fall back to cksum (weaker, still stable)"
date -u -d "-1 hours" +%Y-%m-%dT%H:%M:%SZ >/dev/null 2>&1 && ok "date supports -d (GNU)" \
  || { date -u -v-1H +%Y-%m-%dT%H:%M:%SZ >/dev/null 2>&1 && ok "date supports -v (BSD)" \
       || bad "date supports neither -d nor -v; the lookback window cannot be computed"; }

echo; echo "paths"
[ -d "$WORKSPACE" ] && ok "workspace $WORKSPACE" || bad "workspace $WORKSPACE missing"
if ensure_state && touch "$STATE_DIR/.probe" 2>/dev/null; then
  ok "state dir writable ($STATE_DIR)"; rm -f "$STATE_DIR/.probe"
else
  bad "state dir NOT writable ($STATE_DIR) - the ledger and dedup cannot work"
fi
if [ -r "$SELF_DIR/poll_failed_runs.sh" ]; then ok "plugin scripts readable at $SELF_DIR"
else bad "plugin scripts not readable"; fi
[ -r "$CONFIG_FILE" ] && ok "config found ($CONFIG_FILE)" \
  || bad "config NOT found at $CONFIG_FILE - the agent will never wake"
r=$(cfg REPOS ""); [ -n "$r" ] && ok "REPOS = $r" || bad "REPOS is empty - nothing is being watched"

echo; echo "egress"
if [ -n "${HTTPS_PROXY:-}${https_proxy:-}" ]; then
  ok "HTTPS_PROXY set (${HTTPS_PROXY:-$https_proxy}) - vault can inject credentials"
else
  info "no HTTPS_PROXY - if this is a NanoClaw container, credential injection will NOT happen"
fi

echo; echo "github"
body=$(gh_api GET "/rate_limit")
if [ $? -eq 0 ]; then
  rem=$(printf %s "$body" | json_get '.resources.core.remaining')
  lim=$(printf %s "$body" | json_get '.resources.core.limit')
  # An authenticated caller gets 5000/hr; unauthenticated gets 60. A limit
  # of 60 is the clearest possible sign the vault is NOT injecting the token,
  # which otherwise stays invisible until log downloads start failing.
  if [ "${lim:-0}" -gt 100 ] 2>/dev/null; then
    ok "api.github.com authenticated (limit $lim/hr, $rem remaining)"
  else
    bad "api.github.com reachable but UNAUTHENTICATED (limit ${lim:-?}/hr).
        The vault is not injecting a token. Check that the secret exists with
        --host-pattern api.github.com and is granted to this agent group."
  fi
  rem=$(printf '%s' "$body" | json_get '.resources.core.remaining')
else
  st=$(last_status)
  case "$st" in
    401|403) bad "HTTP $st - token missing, expired, or not granted to this agent group" ;;
    "")      bad "no response - egress blocked, or the proxy is unreachable" ;;
    *)       bad "HTTP $st from /rate_limit" ;;
  esac
fi

first_repo=$(printf '%s' "$r" | cut -d, -f1)
if [ -n "$first_repo" ]; then
  runs=$(gh_api GET "/repos/$first_repo/actions/runs?per_page=1")
  if [ $? -eq 0 ]; then
    ok "can list workflow runs for $first_repo"
    jid=$(gh_api GET "/repos/$first_repo/actions/runs?status=failure&per_page=1" \
          | json_get '.workflow_runs[0].id')
    if [ -n "$jid" ]; then
      job=$(gh_api GET "/repos/$first_repo/actions/runs/$jid/jobs?per_page=1" | json_get '.jobs[0].id')
      if [ -n "$job" ]; then
        # The real test: logs 302 to a different host. Under egress lockdown
        # that host must be reachable separately from api.github.com.
        if [ -n "$(fetch_job_log "$first_repo" "$job" 2000 2>/dev/null)" ]; then
          ok "job log download works (redirect to the blob host succeeded)"
        else
          bad "job log download FAILED - metadata works but logs do not.
        Almost always the redirect target (objects.githubusercontent.com or
        Azure blob storage) is blocked by egress lockdown, or the log expired."
        fi
      else info "no jobs found to test log download"; fi
    else info "no failed runs in $first_repo to test log download"; fi
  else
    bad "cannot list runs for $first_repo - check the repo name and the token's Actions:Read scope"
  fi
fi

echo; echo "budget"
info "$(budget_used) API calls used today (cap $(cfg MAX_API_CALLS_PER_NIGHT 400))"

echo
echo "$pass passed, $fail failed, $note notes"
[ "$fail" -eq 0 ] && echo "Environment looks good." || echo "Fix the failures above before resuming tasks."
echo
exit 0
