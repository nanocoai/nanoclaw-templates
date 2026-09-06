#!/usr/bin/env bash
# Mask secret-shaped strings on stdin.
#
# Build logs leak tokens. Quoting a leaked token into a public issue turns a
# near-miss into an incident, so EVERY excerpt is piped through here before it
# is stored in memory or posted to GitHub. Fails closed: if a pattern is
# uncertain it is masked anyway.

set -uo pipefail

sed -E \
  -e 's/gh[pousr]_[A-Za-z0-9]{16,}/[REDACTED:github-token]/g' \
  -e 's/github_pat_[A-Za-z0-9_]{20,}/[REDACTED:github-pat]/g' \
  -e 's/sk-ant-[A-Za-z0-9_-]{16,}/[REDACTED:anthropic-key]/g' \
  -e 's/sk-[A-Za-z0-9]{20,}/[REDACTED:api-key]/g' \
  -e 's/xox[abprs]-[A-Za-z0-9-]{10,}/[REDACTED:slack-token]/g' \
  -e 's/AKIA[0-9A-Z]{16}/[REDACTED:aws-access-key]/g' \
  -e 's/ASIA[0-9A-Z]{16}/[REDACTED:aws-temp-key]/g' \
  -e 's/AIza[A-Za-z0-9_-]{30,}/[REDACTED:google-key]/g' \
  -e 's/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/[REDACTED:jwt]/g' \
  -e 's/-----BEGIN [A-Z ]*PRIVATE KEY-----/[REDACTED:private-key]/g' \
  -e 's#([a-zA-Z][a-zA-Z0-9+.-]*://)[^/[:space:]:@]+:[^/[:space:]@]+@#\1[REDACTED:userinfo]@#g' \
  -e 's/([Aa]uthorization|[Bb]earer|[Tt]oken)([[:space:]:=]+)[A-Za-z0-9._~+/=-]{12,}/\1\2[REDACTED]/g' \
  -e 's/((PASS|PASSWORD|PASSWD|SECRET|TOKEN|API_?KEY|CREDENTIAL|PRIVATE_?KEY)[A-Z_]*)([[:space:]]*[:=][[:space:]]*)[^[:space:]"'"'"']{6,}/\1\3[REDACTED]/gI' \
  -e 's/ghu_[A-Za-z0-9]{16,}/[REDACTED:github-token]/g'
