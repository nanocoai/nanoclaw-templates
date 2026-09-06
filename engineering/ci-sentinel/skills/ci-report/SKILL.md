---
name: ci-report
description: Produce the morning CI digest of overnight failures, or run the weekly self-audit that scores how accurate past triage was. Use when the scheduled digest or audit task fires, or when someone asks for a summary of what broke overnight, how noisy CI has been, or how reliable this agent's diagnoses have proven.
---

# CI reporting

Two jobs: the morning digest, and the weekly self-audit.

## Morning digest

One message. Never one per failure — a person who wakes to nine notifications reads none.

Sources: `ci-sentinel/state/decisions.jsonl` (last 24h), the ledger, and
`memory/ci/fingerprints/`.

### Rank before you write

Order by what a human should look at first, not by time:

1. **Blocking** — a broken default branch, an expired credential, anything stopping releases
   or every downstream run.
2. **New and high-confidence** — a fresh failure you diagnosed confidently.
3. **Escalating** — a known flake whose rate is climbing, or a fingerprint that has returned
   after being closed.
4. **Known and stable** — recurring, already tracked, rate unchanged.
5. **Noise** — infra cancellations, no action needed.

### Shape

```
CI overnight — 3 failures across 2 repos · 1 needs you

🔴 acme/api `nightly` — npm token expired, every publish blocked since 02:14 (high) → #482
🟡 acme/web `test-macos` — flake, 6/20 runs, macos-14 only (medium) → #431, 14th occurrence
⚪ acme/api `build` — runner cancelled at 03:02, no action needed

Watched 5 repos · 34 polls · woke 3 times · 2 issues filed, 1 comment · 0 re-runs
```

Then, only if a decision is needed, one short paragraph on the top item: what you concluded,
what you could not determine, and what you would look at next.

End with what you did **not** do and why — budget reached, evidence missing, ceiling too low
to open the PR you would have opened. Silence about a gap reads as an absence of problems.

If nothing failed: one line. `CI overnight — all green across 5 repos, 72 polls.` Nothing more.
A quiet night should cost the reader two seconds.

## Weekly self-audit

The loop that keeps you honest. Without it, a systematic misdiagnosis repeats indefinitely and
nobody separates your good calls from your lucky ones.

1. Find issues labelled `ci-sentinel` closed in the last 7 days:
   `GET /search/issues?q=repo:{o}/{r}+label:ci-sentinel+state:closed+closed:>=<date>`
2. For each, classify the outcome from how it was closed and what was said:
   - **correct** — closed by a fix consistent with your diagnosis
   - **wrong class** — fixed, but the cause was not what you said
   - **not real** — closed as `not planned`, duplicate, or invalid
   - **unresolved** — closed without a fix, or stale
3. Compute precision: correct ÷ (correct + wrong class + not real). Track it week over week.
4. Append to `memory/ci/lessons.md` — **only patterns, never individual issues**:

```markdown
## 2026-09-06 — precision 7/9 (78%), up from 71%

- Twice classified `dependency-drift` where the real cause was runner-image drift. Both times
  the lockfile was unchanged and I did not compare the runner `Image:` header against the last
  green run. Compare image headers BEFORE concluding dependency drift.
- Flake rates on `macos-14` are consistently understated: re-runs go to a different runner, so
  a pass proves less than I have been claiming. Weaken that language.
```

5. Report the score in chat with the two most useful lessons. Be blunt about misses — an audit
   that always reports good news is not an audit.

Read `memory/ci/lessons.md` at the start of every investigation. That is the only thing that
makes this loop worth running.

## Reference

- `references/digest-format.md` — worked examples, and what to leave out
