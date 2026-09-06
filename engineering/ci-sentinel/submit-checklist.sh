#!/bin/bash
# CI Sentinel Hackathon Submission Checklist
# Verifies all required files are present before PR

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CI SENTINEL — NanoClaw Hackathon Submission Checklist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR"

check_file() {
  local file="$1"
  local description="$2"

  if [ -f "$TEMPLATE_DIR/$file" ]; then
    echo "✅ $file"
    echo "   $description"
    return 0
  else
    echo "❌ $file (MISSING)"
    echo "   $description"
    return 1
  fi
}

check_dir() {
  local dir="$1"
  local description="$2"

  if [ -d "$TEMPLATE_DIR/$dir" ]; then
    echo "✅ $dir/"
    echo "   $description"
    return 0
  else
    echo "❌ $dir/ (MISSING)"
    echo "   $description"
    return 1
  fi
}

MISSING=0

echo "📋 Root files:"
check_file "README.md" "Full setup and architecture guide" || MISSING=$((MISSING+1))
check_file "SUBMISSION.md" "Hackathon submission details" || MISSING=$((MISSING+1))
check_file "HACKATHON_SUBMISSION.md" "PR and submission instructions" || MISSING=$((MISSING+1))
check_file "demo.sh" "Executable end-to-end demo" || MISSING=$((MISSING+1))
check_file "plugin.json" "Agent plugin manifest (v1.0.0)" || MISSING=$((MISSING+1))
echo ""

echo "📂 Skills structure:"
check_dir "skills/ci-triage" "Investigation pipeline and scripts" || MISSING=$((MISSING+1))
check_dir "skills/ci-report" "Morning digest and weekly audit" || MISSING=$((MISSING+1))
check_dir "ai.nanoco.nanoclaw" "Agent persona, config, and tasks" || MISSING=$((MISSING+1))
echo ""

echo "📄 CI Triage skill files:"
check_file "skills/ci-triage/SKILL.md" "Investigation pipeline (9 phases)" || MISSING=$((MISSING+1))
check_dir "skills/ci-triage/scripts" "Bash scripts (poll, evidence, fingerprint, diff, etc.)" || MISSING=$((MISSING+1))
check_dir "skills/ci-triage/references" "Classification taxonomy and formats" || MISSING=$((MISSING+1))
echo ""

echo "📄 CI Report skill files:"
check_file "skills/ci-report/SKILL.md" "Morning digest and weekly audit" || MISSING=$((MISSING+1))
check_dir "skills/ci-report/references" "Digest format and metrics" || MISSING=$((MISSING+1))
echo ""

echo "📄 Key reference files:"
check_file "skills/ci-triage/references/classification.md" "8-class failure taxonomy" || MISSING=$((MISSING+1))
check_file "skills/ci-triage/references/github-api.md" "GitHub API endpoints" || MISSING=$((MISSING+1))
check_file "skills/ci-triage/references/output-formats.md" "Issue/comment/PR formatting" || MISSING=$((MISSING+1))
echo ""

echo "📄 NanoClaw config:"
check_dir "ai.nanoco.nanoclaw/context/additional_context" "Config and operating limits" || MISSING=$((MISSING+1))
check_dir "ai.nanoco.nanoclaw/tasks" "Scheduled tasks (ci-watch, morning-digest, audit)" || MISSING=$((MISSING+1))
check_file "ai.nanoco.nanoclaw/context/instructions.md" "Agent persona and constraints" || MISSING=$((MISSING+1))
echo ""

# Check for critical scripts
echo "🔧 Critical scripts:"
check_file "skills/ci-triage/scripts/poll_failed_runs.sh" "Gate script (curl+grep)" || MISSING=$((MISSING+1))
check_file "skills/ci-triage/scripts/run_evidence.sh" "Evidence collector" || MISSING=$((MISSING+1))
check_file "skills/ci-triage/scripts/fingerprint.sh" "Failure fingerprinter" || MISSING=$((MISSING+1))
check_file "skills/ci-triage/scripts/delta_since_green.sh" "Commit range differ" || MISSING=$((MISSING+1))
check_file "skills/ci-triage/scripts/redact.sh" "Log redactor" || MISSING=$((MISSING+1))
check_file "skills/ci-triage/scripts/probe_env.sh" "Environment validator" || MISSING=$((MISSING+1))
echo ""

# Verify demo.sh is executable
if [ -x "$TEMPLATE_DIR/demo.sh" ]; then
  echo "✅ demo.sh is executable"
else
  echo "⚠️  demo.sh is not executable"
  echo "   Run: chmod +x $TEMPLATE_DIR/demo.sh"
  MISSING=$((MISSING+1))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $MISSING -eq 0 ]; then
  echo "✅ All files present and ready for submission!"
  echo ""
  echo "Next steps:"
  echo "1. Fork: https://github.com/nanocoai/nanoclaw-templates"
  echo "2. Copy engineering/ci-sentinel/ to your fork"
  echo "3. Create PR with title:"
  echo "   'Add CI Sentinel template for NanoClaw hackathon'"
  echo "4. After merge, fill out submission form:"
  echo "   https://hackathon.nanoclaw.dev/submit"
  echo ""
  echo "Deadline: September 6, 2026, 8:59 p.m. UTC"
else
  echo "❌ Missing $MISSING file(s) or component(s)"
  echo ""
  echo "Before submitting, ensure all files above are present."
  echo "See HACKATHON_SUBMISSION.md for the complete file structure."
  exit 1
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
