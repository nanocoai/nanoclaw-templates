# Failure classification

Eight classes. Each has **required evidence** — the observations without which you may not
assert the class, only offer it as a labelled hypothesis. The point of the discipline is that
every class implies a *different* correct next action, so a wrong class wastes someone's
morning even when the summary sounds right.

Work top to bottom. The first class whose required evidence you actually hold is your answer.

---

## 1. Infrastructure / runner failure

The job never really ran. Nothing about the code is implicated.

**Signals:** `The runner has received a shutdown signal`, `The operation was canceled`, lost
communication with the runner, `##[error]The self-hosted runner: … lost communication`,
job killed at exactly the timeout, `Failed to download action`, 5xx from GitHub itself,
`docker: Error response from daemon`, network unreachable during setup.

**Required evidence:** an error in a *setup or infrastructure* step (checkout, setup-*, docker
login, cache restore) rather than a build or test step, **or** an explicit runner/cancellation
message.

**Action:** usually none. Note it and move on. Only file if it recurs — three or more times in
the window is an infrastructure trend worth someone's attention.

---

## 2. Expired or missing credential

**Signals:** 401/403 from a registry, `authentication required`, `invalid or expired token`,
`Error: Input required and not supplied: token`, `secret … not found`, `denied: requested
access to the resource is denied`, sudden failure of a publish or deploy step that has been
green for weeks.

**Required evidence:** an auth-shaped error **and** an empty commit range or no change to the
credential-consuming step.

**Action:** high confidence, file immediately, mark urgent — this blocks every subsequent run
and nobody can fix it but a human with access. **Never** print the secret name's value, and
never suggest a workaround that removes the auth check.

---

## 3. Resource exhaustion

**Signals:** exit code 137 (OOM kill) or 143, `JavaScript heap out of memory`,
`no space left on device`, `The runner has run out of disk space`, `Killed`, a job that dies
partway through with no error text at all.

**Required evidence:** the exit code or an explicit resource message. Exit 137 alone is
sufficient and is one of the few codes that identifies its own cause.

**Action:** file. Propose the narrow fix (larger runner, `--max-old-space-size`, a cache prune
step). Note whether the workload has been growing — a slow slide into OOM looks like a flake
until someone plots it.

---

## 4. Toolchain / runner-image drift

The world changed. This is the signature overnight failure.

**Signals:** an empty commit range or the identical commit passing earlier; the runner image
version in the log header differs from the last green run's; a preinstalled tool changed
version; `ubuntu-latest` moved to a new major; a system package or default compiler changed.

**Required evidence:** identical or empty commit range **and** a demonstrable environment
difference — most reliably the `Image: ` / `Version: ` lines the runner prints at the top of
every job. Compare the failing run's header against the last green run's.

**Action:** file with high confidence — this is the class humans lose the most time to, because
the instinct is to read the diff, and the diff is empty. Propose pinning the runner image to
the last-good version as a stopgap and name the drift explicitly.

---

## 5. Dependency drift

An upstream package moved, without your code moving.

**Signals:** `ERESOLVE`, `Could not resolve dependency`, a transitive package at an unexpected
version, a type error in code nobody touched, `npm ERR! notarget`, a yanked or republished
version, a base image tag that moved.

**Required evidence:** an empty or unrelated commit range **and** either an unpinned dependency
specification (a range, `latest`, a floating `uses: action@vN`, an untagged base image) or a
lockfile that changed. If the lockfile did *not* change and a dependency is still implicated,
the lack of pinning is itself the finding — say that.

**Action:** file. The fix is nearly always pinning, which is the one class where a `draft-pr`
is genuinely safe under the ceiling.

---

## 6. Flaky test

Nondeterministic. The same commit produces both outcomes.

**Signals:** timing and ordering language (`timeout`, `waited`, `race`, `intermittent`),
network calls inside a test, dependence on wall-clock time or timezone, a test that passes on
re-run, a fingerprint with a mixed pass/fail history at the same SHA.

**Required evidence:** the same fingerprint passing and failing at the **same commit**, from
history or from a re-run you actually performed. A test that merely *sounds* timing-dependent
is a hypothesis, not a classification.

**Action:** do not open a fresh issue per occurrence — this is what fingerprint dedup exists
for. Maintain one issue with the observed rate ("6 of the last 20 runs, only on `macos-14`").
A rate is what gets a flake fixed; a single report never does.

**Never** propose disabling, skipping, or retrying a test as the fix. Report the rate and let a
human decide — quarantining a test that catches a real intermittent bug is worse than the flake.

---

## 7. Code regression

A change in the range genuinely broke it. This is the *residual* class: reach it after the
others are excluded, not before.

**Signals:** the failing test or file is touched by the commit range; a new assertion; a
compile or type error in changed code; the failure appears at the first commit after a green run.

**Required evidence:** a non-empty commit range **and** a plausible link between a changed file
and the failing test or symbol. Narrow by intersecting the changed paths with the failing
test's imports rather than guessing from the commit message.

**Action:** file, naming the suspect commit and author, with the specific file and line. If the
range holds several commits, say which you suspect and why — and say which you could not
exclude. Do not `git bisect`; the range plus path intersection is nearly always enough and does
not spend CI minutes.

---

## 8. Pipeline misconfiguration / fixture default

A CI definition is misconfigured or a test fixture has a broken default, unrelated to application code.

**Signals:** `could not find action`, `invalid action path`, a permission error in a `run:` step writing to protected paths, timeout on a step that runs indefinitely without exit condition, a fixture failing to initialize (database connection refused, container won't start, mock server not responding), test assertions failing on default/mock data values.

**Required evidence:** an empty or unrelated commit range **and** either a visible error in the workflow/Dockerfile definition (syntax, path, permissions) or a reproducible failure on unchanged code using the same fixture.

**Action:** file with medium confidence. Name the misconfiguration explicitly and propose the fix. If it's a test fixture, check whether the failure occurs locally — that determines whether it's CI-specific (a secrets/access problem) or a real bug in the fixture.

---

## When nothing fits

Say so. Label `needs-human`, and record:

- what you observed, cited
- which classes you excluded, and the evidence that excluded them
- what evidence would have settled it (a log that had expired, a step with no output, a
  permission you lack)

That last line is the most valuable thing in an inconclusive report: it tells a human exactly
where to start, and over time it tells you what to instrument.

## Confidence

- **High** — required evidence present, all competing classes excluded by evidence.
- **Medium** — required evidence present, one or more competitors not excluded.
- **Low** — signals only; you are pattern-matching, not concluding. Say which observation
  would move you up a level.
