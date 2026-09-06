#!/usr/bin/env bash
# Shared GitHub REST helper for CI Sentinel.
#
# Credentials: this template NEVER contains a token. Requests carry the literal
# placeholder "onecli-managed"; the OneCLI vault gateway matches the host
# (api.github.com) and rewrites the header with the real token before egress.
# Set CI_SENTINEL_TOKEN only when running these scripts OUTSIDE a NanoClaw
# container (local development against a real PAT).
#
# Sourced by the other scripts:  . "$(dirname "$0")/gh_api.sh"

set -uo pipefail

GH_API_BASE="${GH_API_BASE:-https://api.github.com}"
GH_AUTH_VALUE="${CI_SENTINEL_TOKEN:-onecli-managed}"

# --- paths ------------------------------------------------------------------
# The group workspace is writable; the plugin mount is read-only. State must
# live in the workspace, never under the plugin root.
WORKSPACE="${CI_SENTINEL_WORKSPACE:-/workspace/agent}"
STATE_DIR="${CI_SENTINEL_STATE_DIR:-$WORKSPACE/ci-sentinel/state}"
CONFIG_FILE="${CI_SENTINEL_CONFIG:-$WORKSPACE/additional_context/ci-sentinel.config.md}"

ensure_state() { mkdir -p "$STATE_DIR" 2>/dev/null || return 1; }

# --- config -----------------------------------------------------------------
# cfg KEY DEFAULT
# Reads KEY=value lines out of the markdown config. Never sources the file:
# it is user-editable and must not be able to execute anything.
cfg() {
  local key="$1" default="${2:-}" val=""
  if [ -r "$CONFIG_FILE" ]; then
    val=$(grep -m1 -E "^[[:space:]]*${key}=" "$CONFIG_FILE" 2>/dev/null \
          | sed -E "s/^[[:space:]]*${key}=//" \
          | sed -E 's/[[:space:]]*(#.*)?$//' \
          | tr -d '"'"'"'\r')
  fi
  [ -n "$val" ] && printf '%s' "$val" || printf '%s' "$default"
}

# --- budget -----------------------------------------------------------------
# Every API call is counted. Exhausting the budget is a normal, expected end
# state: callers stop cleanly and report partial results rather than looping.
budget_file() { printf '%s/budget-%s.count' "$STATE_DIR" "$(date -u +%Y%m%d)"; }

budget_used() { local f; f=$(budget_file); [ -r "$f" ] && cat "$f" 2>/dev/null || echo 0; }

budget_check() {
  local max used
  max=$(cfg MAX_API_CALLS_PER_NIGHT 400)
  used=$(budget_used)
  [ "$used" -lt "$max" ]
}

budget_bump() {
  local f used
  f=$(budget_file); used=$(budget_used)
  ensure_state && printf '%s' "$((used + 1))" > "$f" 2>/dev/null
}

# --- request ----------------------------------------------------------------
# gh_api METHOD PATH [BODY_FILE] [EXTRA_HEADER...]
# stdout: response body.  Returns 0 on 2xx, 3 on 304, 1 otherwise.
# GH_STATUS and GH_ETAG are set for the caller.
GH_STATUS=""
GH_ETAG=""
gh_api() {
  local method="$1" path="$2" body_file="${3:-}"
  shift 3 2>/dev/null || shift $#
  local url hdr_file out_file rc

  case "$path" in
    http*) url="$path" ;;
    *)     url="${GH_API_BASE}${path}" ;;
  esac

  if ! budget_check; then
    GH_STATUS="budget"
    echo "ci-sentinel: API call budget exhausted for today" >&2
    return 1
  fi

  hdr_file=$(mktemp 2>/dev/null || printf '%s/h.$$' "${TMPDIR:-/tmp}")
  out_file=$(mktemp 2>/dev/null || printf '%s/b.$$' "${TMPDIR:-/tmp}")

  set -- -sS -X "$method" \
    --max-time "$(cfg HTTP_TIMEOUT_SECONDS 20)" \
    -o "$out_file" -D "$hdr_file" -w '%{http_code}' \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "User-Agent: nanoclaw-ci-sentinel" \
    "$@"
  # CI_SENTINEL_TOKEN=none omits auth entirely: local dry-runs against public
  # repos only. In a container the placeholder is always sent, so the vault
  # gateway has a header to rewrite.
  [ "$GH_AUTH_VALUE" != "none" ] && set -- "$@" -H "Authorization: Bearer ${GH_AUTH_VALUE}"
  [ -n "$body_file" ] && set -- "$@" -H "Content-Type: application/json" --data-binary "@$body_file"

  GH_STATUS=$(curl "$@" "$url" 2>/dev/null)
  rc=$?
  budget_bump

  GH_ETAG=$(grep -i '^etag:' "$hdr_file" 2>/dev/null | head -1 | sed -E 's/^[Ee][Tt][Aa][Gg]:[[:space:]]*//' | tr -d '\r')

  # gh_api is nearly always called as body=$(gh_api ...), and a command
  # substitution runs in a subshell: GH_STATUS/GH_ETAG assignments would be
  # lost. Persist them so the caller can actually read them back.
  if [ -d "$STATE_DIR" ] || ensure_state; then
    printf '%s' "$GH_STATUS" > "$STATE_DIR/.last_status" 2>/dev/null
    printf '%s' "$GH_ETAG"   > "$STATE_DIR/.last_etag"   2>/dev/null
  fi

  if [ $rc -ne 0 ]; then
    echo "ci-sentinel: curl failed (rc=$rc) for $method $path" >&2
    rm -f "$hdr_file" "$out_file"; return 1
  fi

  cat "$out_file" 2>/dev/null
  rm -f "$hdr_file" "$out_file"

  case "$GH_STATUS" in
    2*)  return 0 ;;
    304) return 3 ;;
    401|403)
      echo "ci-sentinel: HTTP $GH_STATUS on $path (token invalid, unscoped, or rate-limited)" >&2
      return 1 ;;
    *)
      echo "ci-sentinel: HTTP $GH_STATUS on $path" >&2
      return 1 ;;
  esac
}

# --- tiny JSON helpers ------------------------------------------------------
# The gate runs with only curl + grep/sed guaranteed. jq is used by the agent
# when present, but nothing on the critical path may require it.
json_int() { grep -o "\"$1\":[[:space:]]*[0-9]*" | head -1 | grep -o '[0-9]*$'; }
json_str() { grep -o "\"$1\":[[:space:]]*\"[^\"]*\"" | head -1 | sed -E "s/.*:[[:space:]]*\"([^\"]*)\"/\1/"; }
have_jq()  { command -v jq >/dev/null 2>&1; }

# Read back values that gh_api set from inside a command substitution.
last_status() { [ -r "$STATE_DIR/.last_status" ] && cat "$STATE_DIR/.last_status" 2>/dev/null; }
last_etag()   { [ -r "$STATE_DIR/.last_etag"   ] && cat "$STATE_DIR/.last_etag"   2>/dev/null; }

# json_get '.head_branch' <<< "$body"
# jq when available; otherwise node (always present on a NanoClaw host) parses
# it properly. Never grep for top-level keys: "name" and "id" also appear on
# nested actor/repository objects and would silently return the wrong value.
json_get() {
  local path="$1"
  if have_jq; then
    jq -r "${path} // empty" 2>/dev/null
  elif command -v node >/dev/null 2>&1; then
    node -e '
      let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
        try {
          const o = JSON.parse(s);
          let v = o;
          for (const k of process.argv[1].split(".").filter(Boolean)) {
            const m = k.match(/^(.*?)\[(\d+)\]$/);
            v = m ? (v && v[m[1]] && v[m[1]][+m[2]]) : (v && v[k]);
            if (v === undefined || v === null) return;
          }
          process.stdout.write(typeof v === "object" ? JSON.stringify(v) : String(v));
        } catch (e) {}
      });' "$path" 2>/dev/null
  fi
}

# fetch_job_log REPO JOB_ID MAX_BYTES
# The logs endpoint 302s to a signed blob URL on a DIFFERENT host. curl -L
# would replay our Authorization header there, and signed blob URLs reject a
# second auth mechanism with a 400. So: read the Location, then fetch it clean.
fetch_job_log() {
  local repo="$1" job="$2" max="${3:-200000}" loc hdr
  hdr=$(mktemp 2>/dev/null || echo "${TMPDIR:-/tmp}/loc.$$")
  budget_check || { echo "ci-sentinel: budget exhausted before log fetch" >&2; rm -f "$hdr"; return 1; }

  set -- -sS -o /dev/null -D "$hdr" --max-time "$(cfg HTTP_TIMEOUT_SECONDS 20)" \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      -H "User-Agent: nanoclaw-ci-sentinel"
  [ "$GH_AUTH_VALUE" != "none" ] && set -- "$@" -H "Authorization: Bearer ${GH_AUTH_VALUE}"
  curl "$@" "${GH_API_BASE}/repos/${repo}/actions/jobs/${job}/logs" >/dev/null 2>&1
  budget_bump

  loc=$(grep -i '^location:' "$hdr" 2>/dev/null | head -1 | sed -E 's/^[Ll]ocation:[[:space:]]*//' | tr -d '\r')
  rm -f "$hdr"
  [ -z "$loc" ] && { echo "ci-sentinel: no redirect for job $job log" >&2; return 1; }

  # No Authorization header on this hop, and hard-capped so one runaway job
  # cannot blow the context window.
  curl -sS --max-time "$(cfg HTTP_TIMEOUT_SECONDS 20)" \
       -H "User-Agent: nanoclaw-ci-sentinel" "$loc" 2>/dev/null | head -c "$max"
  budget_bump
}

# ledger_append RUN_ID REPO STATE [NOTE]
# The ledger is the crash-safety and dedup record: the gate greps it so a run
# is never offered to the agent twice, and a container that dies mid-triage
# resumes instead of double-filing.
ledger_append() {
  ensure_state || return 1
  printf '{"run_id":%s,"repo":"%s","state":"%s","note":"%s","at":"%s"}\n' \
    "$1" "$2" "$3" "${4:-}" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    >> "$STATE_DIR/ledger.jsonl" 2>/dev/null
}
