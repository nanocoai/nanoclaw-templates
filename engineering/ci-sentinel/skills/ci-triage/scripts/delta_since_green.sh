#!/usr/bin/env bash
# delta_since_green.sh <owner/repo> <workflow_id> <branch> <head_sha>
#
# Answers the question that decides most overnight triage: did OUR code change,
# or did the world change underneath it?
#
# Finds the last green run of the same workflow on the same branch, diffs that
# commit against the failing one, and highlights lockfiles, workflow files and
# floating action pins. An EMPTY commit range is the loudest possible signal:
# identical code, different result -> look outward (runner image, upstream
# dependency, expired credential, third-party outage), not at the diff.

set -uo pipefail
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
. "$SELF_DIR/gh_api.sh"

REPO="${1:-}"; WF="${2:-}"; BRANCH="${3:-}"; HEAD="${4:-}"; FAILED_AT="${5:-}"
if [ -z "$REPO" ] || [ -z "$WF" ] || [ -z "$BRANCH" ] || [ -z "$HEAD" ]; then
  echo "usage: delta_since_green.sh <owner/repo> <workflow_id> <branch> <head_sha> [failed_run_created_at]" >&2; exit 2
fi

# The last green run must predate the FAILING run. Taking the newest green
# run unfiltered picks up a later re-green and yields an empty, meaningless
# commit range that reads exactly like the "nothing changed" signal.
gq="status=success&branch=$BRANCH&per_page=1"
[ -n "$FAILED_AT" ] && gq="$gq&created=%3C%3D$FAILED_AT"
green=$(gh_api GET "/repos/$REPO/actions/workflows/$WF/runs?$gq") || {
  echo "## Delta since last green"; echo; echo "_could not query previous successful runs_"; exit 1; }

BASE=$(printf '%s' "$green" | json_get '.workflow_runs[0].head_sha')
GREEN_URL=$(printf '%s' "$green" | json_get '.workflow_runs[0].html_url')
GREEN_AT=$(printf '%s' "$green" | json_get '.workflow_runs[0].created_at')

echo "## Delta since last green"
echo
if [ -z "$BASE" ]; then
  echo "_no successful run of this workflow on \`$BRANCH\` in the retained history._"
  echo "This workflow may never have passed on this branch. Treat as first-run failure,"
  echo "not a regression."
  exit 0
fi

echo "- last green: $GREEN_URL ($GREEN_AT)"
echo "- base \`$BASE\` → head \`$HEAD\`"
echo

if [ "$BASE" = "$HEAD" ]; then
  cat <<'MSG'
> **Same commit passed and then failed.** The code is identical, so the cause is
> external by definition. Check, in order: runner image version drift, a floating
> `uses: action@vN` tag, an unpinned base image digest, an upstream dependency
> republished, an expired credential, a third-party outage, resource exhaustion.
MSG
  exit 0
fi

cmp_json=$(gh_api GET "/repos/$REPO/compare/$BASE...$HEAD?per_page=100") || {
  echo "_compare API unavailable_"; exit 1; }

TOTAL=$(printf '%s' "$cmp_json" | json_get '.total_commits')
echo "- commits in range: **${TOTAL:-unknown}**"
echo

files=$(printf '%s' "$cmp_json" | {
  if command -v node >/dev/null 2>&1; then
    node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{
      for(const f of (JSON.parse(s).files||[]))
        console.log([f.status,f.changes,f.filename].join("\t"));
    }catch(e){}});' 2>/dev/null
  elif have_jq; then
    jq -r '.files[]? | [.status,.changes,.filename] | @tsv' 2>/dev/null
  fi
})

LOCKFILES='package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Cargo\.lock|go\.sum|poetry\.lock|Gemfile\.lock|composer\.lock|requirements.*\.txt|uv\.lock|Pipfile\.lock'

echo "### Dependency surface"
lock_hits=$(printf '%s\n' "$files" | grep -aE "$LOCKFILES" || true)
if [ -n "$lock_hits" ]; then
  echo "Lockfiles changed in this range — a dependency moved with the code:"
  echo '```'; printf '%s\n' "$lock_hits"; echo '```'
else
  echo "_No lockfile changed._ If a dependency is implicated, it moved WITHOUT a"
  echo "lockfile edit, which means it is unpinned (a range, a floating tag, or a"
  echo "transitive resolution) — that is itself the finding."
fi
echo

echo "### CI definition surface"
wf_hits=$(printf '%s\n' "$files" | grep -aE '\.github/workflows/|action\.ya?ml|Dockerfile|\.tool-versions|\.nvmrc|renovate|dependabot' || true)
if [ -n "$wf_hits" ]; then
  echo "Workflow/toolchain files changed:"
  echo '```'; printf '%s\n' "$wf_hits"; echo '```'
else
  echo "_No workflow or toolchain file changed in this range._"
fi
echo

echo "### Changed files (top 40 by churn)"
echo '```'
printf '%s\n' "$files" | sort -t"$(printf '\t')" -k2 -rn | head -40
echo '```'
