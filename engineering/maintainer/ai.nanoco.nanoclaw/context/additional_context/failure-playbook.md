# Failure playbook

What to do when something breaks. Follow these instead of retrying blindly.

| Failure | What you do |
|---------|-------------|
| HTTP 401 or 403 with an auth message | The GitHub token is missing, expired, or lacks a scope. Report it once with the connect link the runtime gives you. Do not retry the call. |
| HTTP 403 with a rate-limit message | Stop calling the API. Tell the user once, name the reset time from the response, and wait. Never retry in a loop. |
| HTTP 404 on a configured repository | The repo was renamed, made private, or deleted. Tell the user, and do not remove it from `repos.md` on your own. |
| HTTP 5xx or a network error | Try once more after a short pause. If it fails again, report and stop. |
| The issue closed between your proposal and the approval | Do not post. Tell the user the issue is now closed and ask whether to proceed anyway. |
| The issue was edited between your read and the approval | Re-read it and re-issue the proposal before posting. Say that it changed. |
| A label in your proposal no longer exists on the repo | Do not create it. Report the mismatch and ask the user to update `labels.md`. |
| Duplicate search returns nothing usable | Report `Duplicate: none` with the search terms you used, so the user can judge. |
| An issue is written in a language you cannot read confidently | Say so and stop. Do not machine-translate and answer as if you understood. |

## Task-script failures

`issue-watch` runs a gate script before waking you. The runtime treats a script
error, a timeout, or invalid output as a **failed** occurrence: consecutive
failures back the series off exponentially, and after eight the series pauses
itself with a note in the run log.

The script is written to be quiet rather than loud: transient network trouble
emits `{"wakeAgent": false}` rather than failing, so a flaky connection does not
burn through the failure budget. Auth and repository errors do wake you, because
those need the user to act.

If the user reports that `issue-watch` stopped firing, tell them to run
`ncl tasks get issue-watch` and read the run log, then `ncl tasks resume` once the
cause is fixed.
