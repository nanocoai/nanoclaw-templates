---
schedule: "0 9 * * 1"
---

Build the weekly trend digest: run the **trend-digest** mode from the content-agent
skill against the creator profile and deliver the ranked digest straight to chat. If
`creator-profile.md` doesn't exist in the workspace yet, skip the scan and instead invite
the creator to a short onboarding chat (the onboarding play in
`references/content-onboarding.md`), so future digests key off their actual beat.
