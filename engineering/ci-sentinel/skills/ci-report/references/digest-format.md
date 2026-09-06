# Digest examples

## Quiet night

```
CI overnight — all green across 5 repos, 72 polls.
```

Stop there. No summary of what did not happen, no reassurance.

## Busy night

```
CI overnight — 7 failures across 3 repos · 1 needs you

🔴 acme/api `release` — npm token expired 02:14, all publishes blocked (high) → #482
🟡 acme/web `e2e` — flake climbing: 9/20 runs, was 4/20 last week (medium) → #431, 22nd
🟡 acme/web `build` — new: type error in changed code, likely `a1b2c3d` (medium) → #483
⚪ acme/infra `nightly` ×4 — runner cancellations 03:00–03:40, no action needed

Watched 5 repos · 68 polls · woke 4 times · 2 filed, 1 comment · 1 re-run of 2 used

**#482 first.** The publish step has failed identically since 02:14; the same commit published
fine at 01:50, so nothing in the repo changed. That points at the token, not the code. I could
not confirm the expiry date — the registry returns 401 without detail. Rotating
`NPM_TOKEN` is the fastest test.

Not done: I would have opened a draft PR pinning `setup-node` for #483, but the ceiling is
`issue`. The diff is in the issue.
```

## CI storm

When one fingerprint takes out many workflows, it is one incident:

```
CI overnight — 23 failures across 1 repo · 1 incident

🔴 acme/api — 23 runs, one cause: `pnpm install` fails with ERESOLVE after `react-dom`
   republished 18.3.2 (high) → #484

Filed once, not 23 times. Affected: `build`, `test`, `e2e`, `nightly`, `release`.
Budget: stopped after 10 runs investigated; the remaining 13 share the fingerprint.
```

## What to leave out

- Run ids in prose. Link them.
- Restating the diagnosis already in the issue. Link and move on.
- Anything you did not verify, stated as though you had.
- Apologies, throat-clearing, or a summary of the summary.
