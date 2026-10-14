---
schedule: "*/10 * * * *"
script: |
  node -e '
  const fs = require("fs");
  const path = "/workspace/agent/memory/checkin-session.json";
  function wake(v) { console.log(JSON.stringify({ wakeAgent: v })); }
  if (!fs.existsSync(path)) { wake(false); process.exit(0); }
  let s;
  try { s = JSON.parse(fs.readFileSync(path, "utf8")); }
  catch { wake(false); process.exit(0); }
  if (!s.active) { wake(false); process.exit(0); }
  const now = Date.now();
  const end = new Date(s.endTime).getTime();
  if (Number.isNaN(end) || now >= end) { wake(true); process.exit(0); }
  const last = s.lastCheckinSentAt ? new Date(s.lastCheckinSentAt).getTime() : 0;
  const intervalMs = (s.intervalMinutes || 30) * 60 * 1000;
  wake((now - last) >= intervalMs);
  '
---

Run the checkin-cycle skill. This task fires every 10 minutes but the
pre-check script above only wakes you when there is an active session
AND either the check-in interval has elapsed or the session's end time
has passed - it reads /workspace/agent/memory/checkin-session.json
directly and does pure time math, no LLM involvement, so the common
case (no active session) costs nothing. Follow checkin-cycle's
escalation discipline exactly - at most one action per wake.
