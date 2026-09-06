---
schedule: "0 8 * * *"
script: |
  DATA=/workspace/agent/plugin-data/lit-gate
  mkdir -p "$DATA"
  CATS="$DATA/cats.txt"
  SEEN="$DATA/seen.txt"
  touch "$SEEN"
  if [ ! -s "$CATS" ]; then
    printf '%s\n' '{"wakeAgent": true, "data": {"reason": "onboard"}}'
    exit 0
  fi
  Q=""
  while IFS= read -r line || [ -n "$line" ]; do
    c=$(printf '%s' "$line" | tr -d ' \t\r')
    [ -z "$c" ] && continue
    case "$c" in \#*) continue ;; esac
    if [ -z "$Q" ]; then Q="cat:${c}"; else Q="${Q}+OR+cat:${c}"; fi
  done < "$CATS"
  if [ -z "$Q" ]; then
    printf '%s\n' '{"wakeAgent": true, "data": {"reason": "onboard"}}'
    exit 0
  fi
  XML=$(curl -fsS -A "nanoclaw-lit-gate/1.0" --max-time 20 \
    "https://export.arxiv.org/api/query?search_query=${Q}&sortBy=submittedDate&sortOrder=descending&max_results=40") || {
    printf '%s\n' '{"wakeAgent": true, "data": {"reason": "arxiv_error"}}'
    exit 0
  }
  printf '%s\n' "$XML" | grep -oE 'arxiv.org/abs/[0-9]{4}\.[0-9]{4,5}' | sed 's#.*abs/##' | sort -u > "$DATA/latest.txt" || true
  : > "$DATA/new.txt"
  if [ -s "$DATA/latest.txt" ]; then
    while IFS= read -r id || [ -n "$id" ]; do
      [ -z "$id" ] && continue
      if ! grep -qxF "$id" "$SEEN"; then
        printf '%s\n' "$id" >> "$DATA/new.txt"
      fi
    done < "$DATA/latest.txt"
  fi
  if [ ! -s "$DATA/new.txt" ]; then
    printf '%s\n' '{"wakeAgent": false}'
    exit 0
  fi
  ids=""
  n=0
  while IFS= read -r id || [ -n "$id" ]; do
    [ -z "$id" ] && continue
    n=$((n + 1))
    if [ -z "$ids" ]; then ids="\"$id\""; else ids="$ids,\"$id\""; fi
  done < "$DATA/new.txt"
  printf '%s\n' "{\"wakeAgent\": true, \"data\": {\"new\": [$ids], \"count\": $n}}"
---

Run the harvest play from the lit-gate skill.

If the script data has `"reason": "onboard"`, onboard instead of harvesting.

If `"reason": "arxiv_error"`, tell the user the arXiv API failed, write nothing
to the ledger, and stop.

If `data.new` is a list of arXiv ids, judge only those ids. Do not re-query
the full category firehose. Fetch each id's metadata from the official arXiv
API (`id_list=`) as needed. Cap READ at the profile's daily_read_cap.
Deliver the phone-sized card, then persist the harvest file and append every
judged id to `plugin-data/lit-gate/seen.txt`.
