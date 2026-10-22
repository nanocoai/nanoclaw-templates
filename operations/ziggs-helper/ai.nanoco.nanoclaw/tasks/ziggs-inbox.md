---
schedule: '*/1 * * * *'
script: |
  set -eu
  API="https://api.ziggsai.com"
  STATE_DIR="${PLUGIN_DATA:-${HOME:-/tmp}/.ziggs-helper}"
  mkdir -p "$STATE_DIR"
  ID_FILE="$STATE_DIR/instance"
  if [ ! -f "$ID_FILE" ]; then
    host=$(hostname 2>/dev/null | tr -cd 'A-Za-z0-9.-' | cut -c1-48)
    [ -n "$host" ] || host="helper"
    printf 'ziggs-helper:%s\n' "$host" > "$ID_FILE"
  fi
  INSTANCE=$(tr -d '\n\r' < "$ID_FILE" | cut -c1-64)
  [ -n "$INSTANCE" ] || INSTANCE="ziggs-helper"
  tmp=$(mktemp)
  trap 'rm -f "$tmp"' EXIT
  code=$(curl -sS -o "$tmp" -w '%{http_code}' --max-time 30 \
    -H "Accept: application/json" \
    -H "X-Ziggs-Instance: ${INSTANCE}" \
    "${API}/inbox?wait=20" || true)
  if [ -z "$code" ] || [ "$code" = "000" ]; then
    echo '{"wakeAgent":false}'
    exit 0
  fi
  if [ "$code" = "409" ]; then
    echo '{"wakeAgent":false}'
    exit 0
  fi
  if [ "$code" != "200" ]; then
    echo '{"wakeAgent":false}'
    exit 0
  fi
  curl -sS -o /dev/null --max-time 5 -X DELETE \
    -H "X-Ziggs-Instance: ${INSTANCE}" \
    "${API}/inbox/host" || true
  body=$(cat "$tmp")
  wake=0
  if printf '%s\n' "$body" | grep -Eq '"hasActionable"[[:space:]]*:[[:space:]]*true'; then
    wake=1
  elif printf '%s\n' "$body" | grep -Eq '"deliveries"[[:space:]]*:[[:space:]]*\[[[:space:]]*\{'; then
    wake=1
  elif printf '%s\n' "$body" | grep -Eq '"tasksAwaitingMe"[[:space:]]*:[[:space:]]*\[[[:space:]]*\{'; then
    wake=1
  fi
  if [ "$wake" -eq 1 ]; then
    echo '{"wakeAgent":true,"data":{"source":"ziggs-inbox"}}'
  else
    echo '{"wakeAgent":false}'
  fi
---

Ziggs inbox has mail. Call ziggs_inbox, then read → act → ack. If hasActionable,
paste sessionChatCard for the person before other work. Do not start a device-code
flow. Do not ask for a key.
