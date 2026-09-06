#!/usr/bin/env bash
# Reduce a log excerpt on stdin to a stable failure fingerprint.
#
# Two runs that failed the SAME way must hash identically even though their
# timestamps, paths, durations, run ids, object hashes and pass-counts all
# differ. That equality is what lets the agent comment on an existing issue
# instead of filing the hundredth duplicate.
#
#   cat log.txt | fingerprint.sh            -> 16-char hex id
#   cat log.txt | fingerprint.sh --explain  -> the normalized lines that were hashed
#
# Deliberately NOT normalized: exit codes and small standalone integers, which
# carry signal ("exit code 1" and "exit code 137" are different failures).

set -uo pipefail
MODE="${1:-}"
MAX_LINES="${FINGERPRINT_LINES:-12}"

# Lines worth hashing. Error keywords alone are not enough: the failing TEST
# NAME must be captured too, or two different tests in one file collide and the
# agent wrongly reports an unrelated failure as "recurring". Hence the runner
# markers (Jest/Vitest bullets, Go --- FAIL:, pytest E, TAP not ok).
SIGNAL_RE='error|fail|fatal|exception|panic|assert|traceback|cannot|unable|refused|timed? ?out|not found|npm ERR|Process completed with exit code'
SIGNAL_RE="$SIGNAL_RE"'|##\[error\]|--- FAIL:|^E |not ok |expect\(|Expected:|Actual:|●|✕|✗|✘'

normalize() {
  sed -E \
    -e 's/\x1b\[[0-9;]*[a-zA-Z]//g' \
    -e 's/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z?[[:space:]]*//' \
    -e 's/[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}([.,][0-9]+)?(Z|[+-][0-9:]{2,5})?/<TS>/g' \
    -e 's/\b[0-9]{2}:[0-9]{2}:[0-9]{2}([.,][0-9]+)?\b/<TS>/g' \
    -e 's/\b[0-9]+m[0-9]+(\.[0-9]+)?s\b/<DUR>/g' \
    -e 's/\b[0-9]+(\.[0-9]+)?[[:space:]]?(ms|s|m|h)\b/<DUR>/g' \
    -e 's/\b[0-9]+[[:space:]]+(passed|failed|skipped|pending|todo|errors?|warnings?|tests?|assertions?)\b/<N> \1/g' \
    -e 's/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/<UUID>/g' \
    -e 's/0x[0-9a-fA-F]+/<ADDR>/g' \
    -e 's/\b[0-9a-fA-F]{7,}\b/<HEX>/g' \
    -e 's#(/[A-Za-z0-9._-]+){2,}/([A-Za-z0-9._-]+)#<PATH>/\2#g' \
    -e 's/:[0-9]+:[0-9]+/:<LINE>:<COL>/g' \
    -e 's/:[0-9]+\b/:<LINE>/g' \
    -e 's/\b[0-9]{4,}\b/<N>/g' \
    -e 's/[[:space:]]+/ /g' \
    -e 's/^ //; s/ $//'
}

buf=$(cat)

normalized=$(
  printf '%s\n' "$buf" | normalize \
  | grep -aiE "$SIGNAL_RE" \
  | grep -avE '^<PATH>/?$|^$' \
  | awk '!seen[$0]++' \
  | head -n "$MAX_LINES"
)

# No recognizable error line: fall back to the tail so we still get a stable id
# rather than hashing the empty string, which would collide every unknown
# failure into one bogus "recurring" issue.
if [ -z "$normalized" ]; then
  normalized="UNCLASSIFIED
$(printf '%s\n' "$buf" | normalize | grep -av '^[[:space:]]*$' | tail -n 5)"
fi

if [ "$MODE" = "--explain" ]; then printf '%s\n' "$normalized"; exit 0; fi

hash_it() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum | cut -c1-16
  elif command -v shasum   >/dev/null 2>&1; then shasum -a 256 | cut -c1-16
  elif command -v openssl  >/dev/null 2>&1; then openssl dgst -sha256 | sed -E 's/.*= ?//' | cut -c1-16
  else cksum | tr -d ' ' | cut -c1-16
  fi
}
printf '%s' "$normalized" | hash_it
