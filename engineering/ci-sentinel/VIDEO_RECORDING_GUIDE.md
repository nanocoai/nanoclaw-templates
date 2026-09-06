# CI Sentinel Demo Video Recording Guide

**Target:** 4-5 minute screen recording showing the agent investigating a CI failure end-to-end.

**Setup time:** ~15 minutes  
**Recording time:** ~5 minutes (can do multiple takes)  
**Upload:** YouTube (unlisted or public) → link in PR

---

## Pre-Recording Setup (Do This First)

### 1. Prepare Your Environment

You need:
- NanoClaw running locally with CI Sentinel template stamped
- GitHub account with test repo (or use Ben-levi/ci-sentinel-testbed)
- Terminal window (PowerShell or WSL Bash)
- Browser with GitHub open
- Screen recording software (OBS, ScreenFlow, built-in screen recorder)

### 2. Set Up NanoClaw

```bash
# Stamp the template (if not already done)
ncl groups create --template engineering/ci-sentinel --name "CI Sentinel"

# Configure for test repo
# Edit: ~/.nanoclaw/agents/<ci-sentinel-id>/additional_context/ci-sentinel.config.md
# Set: REPOS=Ben-levi/ci-sentinel-testbed or your-org/your-test-repo
# Set: AUTONOMY_CEILING=issue

# Verify setup
bash ~/.nanoclaw/agents/<ci-sentinel-id>/plugins/ci-sentinel/skills/ci-triage/scripts/probe_env.sh
```

Expected output:
```
✓ curl: OK
✓ bash: OK
✓ GitHub API token: authenticated
✓ Log blob egress: reachable
✓ Config: REPOS=Ben-levi/ci-sentinel-testbed
Ready to investigate failures.
```

### 3. Prepare GitHub

- **Tab 1:** GitHub Actions page for your test repo (ready to trigger a run)
- **Tab 2:** GitHub Issues (watch for new issue to appear)
- **Have a test failure ready:** A failing workflow you can point to, or trigger one

### 4. Prepare Terminal

Set up TWO terminal windows side-by-side:

**Left terminal (Agent logs):**
```bash
# Watch the agent task logs
ncl tasks logs --follow ci-watch

# Or tail the agent container logs if available
tail -f ~/.nanoclaw/agents/<ci-sentinel-id>/state/decisions.jsonl
```

**Right terminal (Manual trigger, if needed):**
```bash
# Keep available to manually trigger the agent if needed
# (in case the scheduled task doesn't fire during recording)
```

### 5. Test Recording Software

- **Resolution:** 1920x1080 or higher (scales well on YouTube)
- **Framerate:** 30 FPS
- **Audio:** Optional (narrate separately or use text overlay)
- **Format:** MP4, WebM, or MOV

Do a **30-second test recording** to check audio/video quality.

---

## Recording Script (5 minutes total)

### SCENE 1: Introduction (0:00–0:30)

**What to show:**
- Title screen or text overlay:
  ```
  CI SENTINEL
  Automated GitHub Actions Failure Investigation
  ```
- Show NanoClaw CLI version
- Brief intro (can narrate or use text)

**Action:**
```bash
echo "CI Sentinel is watching for overnight CI failures..."
ncl --version
```

**Timing:** 30 seconds

---

### SCENE 2: Setup & Configuration (0:30–1:15)

**What to show:**
- Agent group setup
- Configuration file
- Environment probe passing

**Action:**
```bash
# Show the agent group
ncl groups list

# Show the config file
cat ~/.nanoclaw/agents/<ci-sentinel-id>/additional_context/ci-sentinel.config.md
# Output should show:
# REPOS=Ben-levi/ci-sentinel-testbed
# AUTONOMY_CEILING=issue
# BRANCHES=main

# Probe environment
bash ~/.nanoclaw/agents/<ci-sentinel-id>/plugins/ci-sentinel/skills/ci-triage/scripts/probe_env.sh

# Output:
# ✓ curl: OK
# ✓ bash: OK
# ✓ GitHub API token: authenticated (5000/hr limit)
# ✓ Log blob egress: reachable
# Ready to investigate failures.
```

**Narration (optional):**
> "CI Sentinel is configured to watch Ben-levi/ci-sentinel-testbed on the main branch. GitHub token is authenticated and scoped for write access to issues. Ready to investigate failures."

**Timing:** 45 seconds

---

### SCENE 3: A Failure Appears (1:15–1:45)

**What to show:**
- GitHub Actions page showing a red workflow
- The failure run details
- Job logs (briefly)

**Action:**
1. Switch to **GitHub browser window**
2. Go to **Actions** tab → **Failed run**
3. Click the failing job
4. Show the error in the logs (first ~20 lines)
5. Note the timestamp

**Narration (optional):**
> "A workflow failed overnight at 22:45 UTC. The test-matrix job is red. Let's see what happened..."

**Example failure to show:**
```
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! 
npm ERR! While resolving: my-app@1.0.0
npm ERR! Found: node@20.10.0
npm ERR!
npm ERR! Could not resolve dependency:
npm ERR! peer node@">=18.0.0,<20.0.0" from dedent@2.0.0
```

**Timing:** 30 seconds

---

### SCENE 4: Agent Investigates (1:45–3:45)

**What to show:**
- Terminal shows agent waking up
- Investigation phases happening
- Progress through the pipeline

**Action:**
1. Switch to **left terminal (Agent logs)**
2. Manually trigger the agent (or wait for scheduled task):
   ```bash
   ncl tasks run ci-watch --wait
   ```
3. Watch the logs stream as the agent:
   - Claims the run
   - Collects evidence
   - Fingerprints the failure
   - Diffs against last green
   - Classifies the cause
   - Files the issue

**Expected output (in sequence):**
```
[ci-watch] Starting investigation...
[run_evidence] Collecting logs from run #7382941
[run_evidence] Redacting sensitive data...
[fingerprint] Normalizing and hashing failure...
[delta_since_green] Comparing against last green (abc1234)
[delta_since_green] ⚠️  Same commit: abc1234
[delta_since_green] Code did not change. External cause likely.
[classify] Analyzing failure...
[classify] Class: runner-image-drift (HIGH confidence)
[output] Filing issue...
[output] Issue filed: #42
[complete] Investigation done. 2.3s elapsed.
```

**Narration (optional):**
> "The agent woke up, collected logs, fingerprinted the failure as 'npm_resolution_error'. It compared the current commit against the last green run — same commit, different outcome. That tells us the code didn't change. Something external drifted. Looking at the runner environment: the image changed from ubuntu-22.04-20260905 to ubuntu-22.04-20260906. That's the culprit. High confidence. Filing the issue now..."

**Timing:** 2 minutes

---

### SCENE 5: Issue Filed (3:45–4:30)

**What to show:**
- GitHub Issues page
- The newly filed issue
- Evidence citations in the issue
- Labels and classification

**Action:**
1. Switch to **GitHub browser (Issues tab)**
2. Show the **new issue** (it should appear in real-time or refresh)
3. Click into the issue and show:
   - **Title:** `[CI] ubuntu-latest image drifted — npm resolution failed`
   - **Body:**
     ```
     **Classification:** runner-image-drift
     **Confidence:** HIGH
     
     **Evidence:**
     - Run: https://github.com/Ben-levi/ci-sentinel-testbed/actions/runs/7382941
     - Failure: npm ERR! ERESOLVE unable to resolve dependency tree
     - Same commit as last green: abc1234 (Sep 5 vs Sep 6)
     - Runner image drifted: ubuntu-22.04-20260905 → ubuntu-22.04-20260906
     
     **Recommended fix:**
     Pin runner image to ubuntu-22.04-20260905 as stopgap.
     ```
   - **Labels:** `ci-sentinel`, `runner-image-drift`
   - **Mentions:** The run URL, evidence links

4. Scroll to show the **citations** and **evidence**

**Narration (optional):**
> "The issue was filed automatically with all the evidence. Every claim is cited — the run URL, the commit comparison, the runner image drift. The agent classified it as runner-image-drift with high confidence, and proposed a fix. A human can now take action knowing exactly what went wrong."

**Timing:** 45 seconds

---

### SCENE 6: Deduplication Demo (4:30–5:00)

**What to show:**
- Same failure occurs again (40 seconds later)
- Agent comments on the existing issue instead of filing a new one
- Shows rate tracking

**Action:**
1. In right terminal, trigger another run with the same failure:
   ```bash
   # Or show a pre-recorded example
   ```
2. Switch to GitHub issues
3. Refresh the issue
4. Show the **new comment** posted by the agent:
   ```
   14th occurrence in 8 days.
   Workflow: test-matrix
   Run: https://github.com/Ben-levi/ci-sentinel-testbed/actions/runs/7382950
   Rate: 14 of 20 runs failed (70% failure rate)
   ```
5. Highlight: **One issue, many comments, not many issues**

**Narration (optional):**
> "The same failure occurs again. But CI Sentinel doesn't file a duplicate issue. It recognizes the fingerprint, finds the existing issue, and comments with an updated rate. One issue, many comments. No noise, just signal."

**Timing:** 30 seconds

---

## Recording Checklist

- [ ] NanoClaw running and configured
- [ ] GitHub authenticated and test repo ready
- [ ] Terminal windows set up and visible
- [ ] Screen recorder selected and tested
- [ ] Resolution 1920x1080 or higher
- [ ] No sensitive tokens visible in terminal
- [ ] A test failure is ready to show (or will trigger one)
- [ ] Audio/microphone working (if adding narration)
- [ ] Text editor or slide software ready for titles/overlays

---

## Recording Tips

1. **Do multiple takes.** One smooth 5-minute recording is better than a stuttering 15-minute one.

2. **Pre-load everything.** Have all windows open, commands ready to paste, GitHub issue page loaded before you hit record.

3. **Run commands in advance.** Copy and paste is faster than typing. Reduces gaps.

4. **Use text overlays.** Add titles or section labels in post-production:
   - "Setup & Configuration"
   - "Failure Detected"
   - "Investigation Pipeline"
   - "Issue Filed with Evidence"
   - "Deduplication"

5. **Optional narration.** Add voiceover or just captions. Silent recording with captions works great.

6. **Speed up boring parts.** 1.5x or 2x speed on the investigation phase (logs streaming) keeps it engaging.

7. **Disable notifications.** Silence Slack, Discord, etc. so popups don't distract.

8. **Dark theme terminal.** Better contrast, easier to read on video.

---

## Post-Recording

1. **Export as MP4** (universal format)
2. **Upload to YouTube:**
   - Title: `CI Sentinel — NanoClaw Hackathon Demo`
   - Description: Link to your PR + brief description
   - Visibility: Unlisted or Public
3. **Get the YouTube URL** (e.g., `https://youtu.be/abc123def456`)
4. **Add to PR description** and submission form

---

## Example Video Structure (5 minutes)

```
0:00–0:30    Introduction / Title
0:30–1:15    Setup & Configuration
1:15–1:45    Failure appears on GitHub
1:45–3:45    Agent investigates (2 minutes)
3:45–4:30    Issue filed with evidence
4:30–5:00    Deduplication demo
```

---

## Fallback: Text Demo

If recording is difficult:

1. Run the `demo.sh` script
2. Screenshot the terminal output
3. Create a slide deck showing the flow
4. Upload as a video (convert static images to video using ffmpeg or iMovie)

```bash
# Convert screenshots to video (60 seconds per slide)
ffmpeg -framerate 1/3 -i "slide_%02d.png" -c:v libx264 -pix_fmt yuv420p demo.mp4
```

---

## Support

Questions? Check:
- `engineering/ci-sentinel/README.md` — Full setup
- `engineering/ci-sentinel/demo.sh` — Automated demo flow
- NanoClaw docs: https://docs.nanoclaw.dev

---

**Ready to record?** Let's go! 🎬
