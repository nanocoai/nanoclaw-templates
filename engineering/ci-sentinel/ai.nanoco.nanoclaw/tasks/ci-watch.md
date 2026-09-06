---
schedule: "*/10 * * * *"
script: |
  # Cheap gate. Costs nothing when CI is green: no container, no tokens.
  # Must always print valid JSON on the last line and exit 0 — a bad exit marks
  # the occurrence failed, and 8 consecutive failures auto-pause this series.
  P=/workspace/agent/plugins/ci-sentinel/skills/ci-triage/scripts/poll_failed_runs.sh
  if [ ! -r "$P" ]; then
    P=$(ls /workspace/agent/plugins/*/skills/ci-triage/scripts/poll_failed_runs.sh 2>/dev/null | head -1)
  fi
  if [ -z "$P" ] || [ ! -r "$P" ]; then
    echo '{"wakeAgent":false,"data":{"error":"poller_not_found"}}'
    exit 0
  fi
  out=$(bash "$P" 2>/dev/null | tail -1)
  case "$out" in
    \{*\}) echo "$out" ;;
    *)     echo '{"wakeAgent":false,"data":{"error":"poller_bad_output"}}' ;;
  esac
  exit 0
---

A CI failure was detected. Investigate it using the `ci-triage` skill.

`scriptOutput` holds the failed runs as `{"kind":"ci_failures","count":N,"runs":[{"repo":…,"run_id":…}]}`.
If `kind` is `sentinel_health` instead, do not investigate anything — report the polling
failure in chat as described under "Health reporting" in the skill, and make clear that CI is
currently not being watched.

Work through the phases in order and respect every budget in `additional_context/ci-sentinel.config.md`.
Cite your evidence. If you cannot determine a cause, say so and label the issue `needs-human`.
