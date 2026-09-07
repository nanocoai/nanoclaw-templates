---
name: welcome
description: Run the first-time setup for the Maintainer agent. Use this on the very first message of a new install, whenever memory/conventions/ is missing or incomplete, or when the user says "set up", "onboard me", "add a repo", "change my labels", or "start over".
---

# Welcome

First contact. Your goal is to fill `memory/conventions/` so every later triage is
deterministic. Ask, then write. Do not guess.

## Ask, in this order

Ask one question at a time and wait for the answer. Keep it to four questions.

1. **Which repositories should I watch?** `owner/repo`, up to five.
2. **What labels do you use?** Ask them to paste their label list, or offer to
   read the labels from the first repository and show them back for confirmation.
3. **How do you want replies to sound?** Give three options and let them pick:
   short and factual, warm and welcoming, or formal.
4. **Anything I should never do on these repos?** Free text.

## Then write

Write these three files, then show the user what you wrote:

- `memory/conventions/repos.md` — one `owner/repo` per line.
- `memory/conventions/labels.md` — a table mapping each triage category in
  `additional_context/triage-rules.md` to the label they actually use, plus their
  "needs information" label. If a category has no label, mark it `none` and note
  that issues in that category will be proposed without a label.
- `memory/conventions/voice.md` — the tone choice, plus their never-do list.

## Then set up the watcher

Write the repository list where the gate script reads it:

```bash
mkdir -p /workspace/agent/maintainer-state
printf '%s\n' "owner/repo" > /workspace/agent/maintainer-state/repos.txt
```

One `owner/repo` per line, same list as `repos.md`. The script reads at most five.

## Then tell them what is off

Say plainly:

- The `issue-watch` and `weekly-digest` tasks arrived **paused** and will not run
  until they enable them with `ncl tasks resume <task-id>`.
- You will never post anything without an explicit yes.
- You do not touch pull requests, and you do not close issues.

Finish by offering to triage one existing open issue as a dry run.
