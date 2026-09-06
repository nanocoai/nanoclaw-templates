#!/bin/bash
# CI Sentinel Demo — End-to-end workflow showcase
# This script demonstrates the agent's investigation and triage pipeline

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CI SENTINEL DEMO: Automated GitHub Actions Failure Investigation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
DEMO_REPO="${1:-Ben-levi/ci-sentinel-testbed}"
WATCH_WINDOW="20:00-08:30"
AUTONOMY_CEILING="${2:-digest}"

echo "📋 SCENARIO: GitHub Actions workflow fails overnight"
echo "   Repository: $DEMO_REPO"
echo "   Watch window: $WATCH_WINDOW"
echo "   Autonomy ceiling: $AUTONOMY_CEILING (chat reports only, no GitHub writes)"
echo ""

# Step 1: Setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Initialize CI Sentinel agent"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ ncl groups create --template engineering/ci-sentinel --name 'CI Sentinel Demo'"
echo ""
echo "✅ Agent stamped with:"
echo "   • Skills: ci-triage, ci-report"
echo "   • Scheduled tasks: ci-watch (every 10 min), morning-digest, weekly-self-audit"
echo "   • Status: paused (resume manually after configuration)"
echo ""

# Step 2: Configure
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Configure for target repository"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Config: additional_context/ci-sentinel.config.md"
echo ""
cat << 'EOF'
REPOS=Ben-levi/ci-sentinel-testbed
WATCH_WINDOW=20:00-08:30
BRANCHES=main,develop
AUTONOMY_CEILING=digest
MAX_RERUNS_PER_NIGHT=2
EOF
echo ""
echo "✅ Configuration saved"
echo ""

# Step 3: Vault setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Inject GitHub credential via OneCLI vault"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ onecli secrets create \\"
echo "    --name 'GitHub (CI Sentinel)' \\"
echo "    --type api_key \\"
echo "    --value 'github_pat_***' \\"
echo "    --host-pattern api.github.com"
echo ""
echo "✅ Token injected; container never sees plaintext"
echo ""

# Step 4: Probe environment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Verify environment (vault injection, rate limits, egress)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ bash ./skills/ci-triage/scripts/probe_env.sh"
echo ""
cat << 'EOF'
Checking environment...
✓ curl: OK
✓ bash: OK (version 5.2.21)
✓ GitHub API token: authenticated (5000/hr limit)
✓ Log blob egress: reachable (objects.githubusercontent.com)
✓ Config: REPOS=Ben-levi/ci-sentinel-testbed
✓ JQ: present (JSON parsing enabled)

Ready to investigate failures.
EOF
echo ""

# Step 5: Start watching
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Resume polling tasks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "$ ncl tasks resume ci-watch"
echo "$ ncl tasks resume morning-digest"
echo ""
echo "✅ Polling begins: check every 10 minutes, morning summary at 08:00 UTC"
echo ""

# Step 6: Failure scenario
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SCENARIO: Overnight failure detected"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "CI workflow 'test-matrix' failed at 2026-09-06 22:45:23 UTC"
echo "Run: https://github.com/Ben-levi/ci-sentinel-testbed/actions/runs/7382941"
echo ""

# Step 7: Investigation pipeline
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "INVESTIGATION PIPELINE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Phase 1: Claim run in ledger"
echo "  → Records run_id=7382941, repo=Ben-levi/ci-sentinel-testbed, status=investigating"
echo "  → Crash-safe: if agent restarts, resumes instead of duplicate-filing"
echo ""

echo "Phase 2: Collect evidence"
echo "  → Download job logs (redacted): removed tokens, paths, hashes"
echo "  → Runner environment: ubuntu-latest, node 20.x, npm 10.x"
echo "  → Primary fingerprint: npm_resolution_error_dedent"
echo ""

echo "Phase 3: Check for recurrence"
echo "  → Look up: memory/ci/fingerprints/npm_resolution_error_dedent.md"
echo "  → Not found → first occurrence of this failure"
echo ""

echo "Phase 4: Diff against last green run"
echo "  → Branch: main"
echo "  → Last green: commit abc1234 (Sep 5 14:30:23)"
echo "  → Current red: commit abc1234 (Sep 6 22:45:23)"
echo "  → ⚠️  SAME COMMIT"
echo ""
echo "  → Code did NOT change. Cause is external."
echo "  → This is the classic overnight failure (humans waste hours here)"
echo ""

echo "Phase 5: Analyze external factors"
echo "  → package-lock.json: unchanged"
echo "  → Runner image: ubuntu-latest"
echo "     - Last green runner: ubuntu-22.04-20260905"
echo "     - Current red runner: ubuntu-22.04-20260906"
echo "  → Verdict: Runner image drifted (minor patch)"
echo "  → Error: npm ERR! ERESOLVE unable to resolve dependency tree"
echo ""

echo "Phase 6: Classify"
echo "  → Class 4: Toolchain / runner-image drift"
echo "  → Required evidence:"
echo "       ✓ Same commit passing then failing"
echo "       ✓ Runner version changed (demonstrated in logs)"
echo "  → Confidence: HIGH"
echo ""

echo "Phase 7: Generate triage report"
echo "  → Title: '[CI] ubuntu-latest image drifted — npm resolution failed'"
echo "  → Class: runner-image-drift"
echo "  → Confidence: high"
echo "  → Recommendation: Pinned ubuntu-22.04-20260905 as stopgap"
echo ""

# Step 8: Output
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESULT (with AUTONOMY_CEILING=$AUTONOMY_CEILING)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$AUTONOMY_CEILING" = "digest" ]; then
  echo "📊 CHAT REPORT ONLY (no GitHub writes)"
  echo ""
  cat << 'EOF'
🔴 CI Failure: ubuntu-latest image drifted

**Failure:** npm ERR! ERESOLVE unable to resolve dependency tree

**Run:** https://github.com/Ben-levi/ci-sentinel-testbed/actions/runs/7382941
**Branch:** main
**Commit:** abc1234 (same as last green run)

**Classification:** runner-image-drift (HIGH confidence)

**Evidence:**
• Identical commit abc1234 passed Sep 5 @ 14:30, failed Sep 6 @ 22:45
• Runner image drifted: ubuntu-22.04-20260905 → ubuntu-22.04-20260906
• package-lock.json unchanged
• Error in environment setup, not application code

**Recommended fix:**
```
- uses: actions/setup-node@v4
  with:
    node-version: 20.x
    cache: 'npm'
+ runs-on: ubuntu-22.04-20260905  # pin to last-good
```

**Next:** Review the diff above, decide the fix, and file an issue when ready.
EOF
  echo ""
  echo "💾 State saved:"
  echo "   • Ledger: ci-sentinel/state/ledger.jsonl (filed: Sep 6 22:50 UTC)"
  echo "   • Fingerprint: memory/ci/fingerprints/npm_resolution_error_dedent.md"
  echo "   • Decision: ci-sentinel/state/decisions.jsonl (logged for audit)"
  echo ""

elif [ "$AUTONOMY_CEILING" = "issue" ]; then
  echo "✅ ISSUE FILED (GitHub write enabled)"
  echo ""
  echo "Opening issue: '[CI] ubuntu-latest image drifted — npm resolution failed'"
  echo "URL: https://github.com/Ben-levi/ci-sentinel-testbed/issues/42"
  echo ""
  echo "Issue includes:"
  echo "  ✓ Failure classification (runner-image-drift)"
  echo "  ✓ Confidence level (high)"
  echo "  ✓ Cited evidence (linked to run logs)"
  echo "  ✓ Recommended fix (pinned runner version)"
  echo "  ✓ Label: ci-sentinel"
  echo ""
fi

# Step 9: Dedup demonstration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DEDUPLICATION: Same failure, next fire (40 seconds later)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Another workflow fails with identical fingerprint"
echo "  → Lookup fingerprint in memory: npm_resolution_error_dedent"
echo "  → Found: open issue #42"
echo "  → Action: Comment, do NOT file a new issue"
echo ""
cat << 'EOF'
Comment posted to #42:

15th occurrence in 8 days.
Workflow: test-matrix
Run: https://github.com/Ben-levi/ci-sentinel-testbed/actions/runs/7382950
Timestamp: 2026-09-06 22:50:31 UTC
Branch: main
Runner: ubuntu-latest (image: ubuntu-22.04-20260906)

Rate: 15 of 20 runs failed (75% failure rate)
Affected: main, develop (both on ubuntu-latest)

Flake trending: Consistent since image drift began.
EOF
echo ""
echo "💾 Fingerprint updated: occurrence count, last seen, affected branches"
echo ""

# Step 10: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Cost control:"
echo "   • Green nights cost $0 (gate runs, no model invoked)"
echo "   • Gated polling: every 10 minutes when red, no cap"
echo "   • Dedup: recurrences = comments, not duplicate issues"
echo ""
echo "✅ Evidence discipline:"
echo "   • Every claim carries a citation (commit, log line, timestamp)"
echo "   • Redaction: tokens, paths, hashes removed before storage"
echo "   • Fingerprinting: same failure on different runs hashes identically"
echo ""
echo "✅ Classification taxonomy:"
echo "   • 8 failure classes, each with required evidence"
echo "   • Avoids guessing: hypothesis without evidence → labeled, not asserted"
echo "   • Different class → different fix (humans don't waste time)"
echo ""
echo "✅ Morning digest:"
echo "   • Ranked summary by confidence and impact"
echo "   • Rate trending (flake count, which runners affected)"
echo "   • Feeds weekly audit: scores the diagnoses, learns from mistakes"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Next steps:"
echo "   1. Run on your own repo: edit REPOS in ci-sentinel.config.md"
echo "   2. Week 1: Keep AUTONOMY_CEILING=digest (chat reports, no writes)"
echo "   3. Week 2+: Measure accuracy, move to AUTONOMY_CEILING=issue"
echo "   4. Weekly audit score shows where it's wrong (feeds learning)"
echo ""
echo "See: README.md for full setup, skills/ci-triage/references/ for taxonomy"
echo ""
