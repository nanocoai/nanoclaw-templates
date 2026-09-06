# Remote Hands Reviewer

Compare a hardware work order with returned images. See which labels match, what is missing, and what to ask for next. New images update the outstanding list while earlier evidence stays available.

**Requires a NanoClaw provider with native image inspection.** Tested with NanoClaw's Codex provider using operator-owned OpenAI authentication. Provider access may be paid. This template adds no API service, MCP server, account or billing. [Services and privacy](#services-and-privacy).

## Example

A work order requests serial `SN-4821` and cable label `UPLINK-B1`. The first image shows `SN-4281`; the cable label is absent.

The agent reports two outstanding items and drafts a precise follow-up. A clearer second image supports both requested labels. The next review shows what was resolved and preserves the first review. The owner can then record the evidence review in chat.

This does not establish that the equipment was installed correctly. Existing devices and expected replacements are tracked separately.

## Install

From this repository, copy the template into your NanoClaw installation:

```sh
mkdir -p <nanoclaw>/templates/it
cp -R it/remote-hands-reviewer <nanoclaw>/templates/it/
ncl groups create --template it/remote-hands-reviewer \
  --name "Remote Hands Reviewer" --timezone Europe/Riga --json
```

Inspect the returned `templateReport`, select your provider through NanoClaw's normal setup, and connect the new agent to your preferred channel. Preserve unrelated agent wirings. Re-copy the template before testing a later edit.

The `pending-evidence` task is created paused. Check with `ncl tasks list --status paused --json`; run it manually with `ncl tasks run --id TASK_ID`. Enable recurrence only when you want a daily summary.

## Use it in chat

1. Supply a text work order and ask: **“Start a remote-hands review.”** The agent proposes the exact identifiers and their roles. Confirm with `Start job JOB`.
2. Supply PNG/JPEG images or agent-visible file paths. Ask: **“Review these images.”** It retains the files, reads the labels and produces a report.
3. Add the technician's next images: **“Check whether these resolve the outstanding items.”** Earlier reports remain available.
4. Inspect the latest report. When all items are supported, use the exact `Record review REVIEW-ID` phrase shown by the agent. A stale review cannot be recorded.

Ask **“What is still outstanding?”** for one job or across your saved jobs. Follow-up messages are drafts; the template never contacts technicians, changes a ticket or operates hardware.

### Try the included sample

Use `examples/work-order.md`, then `examples/round-1.png`, followed by `examples/round-2.png`. These are original synthetic illustrations, not photographs of a real installation. They exercise a different serial, a missing label and a later resolution.

`examples/replacement-work-order.md` and `replacement-example.png` exercise a replacement whose serial legitimately differs from the removed device. The agent must distinguish their roles instead of comparing every serial to the old one.

The examples are for an operator to supply; the agent must inspect the images rather than use an answer file. The template contains no prewritten model observations.

## Reports and state

The helper runs on Node 22 with no package dependencies. It stores separate jobs under:

```text
/workspace/agent/plugin-data/remote-hands-reviewer/jobs/
```

Each job retains its original request, copied images, immutable review versions and local recording. SHA-256 checks detect changed stored content. Atomic publication keeps the preceding complete version readable after an interrupted write. These checks are not tamper-proof authorization against an agent with the same filesystem access.

The HTML report is self-contained: no JavaScript, remote fonts, external images or approval buttons. It shows its version and status when generated. Ask the agent for current status; an old report remains a snapshot.

The CLI channel prints the report path. Open the matching path under the **host group's** `plugin-data/remote-hands-reviewer` directory. If a response arrived after the terminal exited, inspect `ncl sessions history SESSION_ID --limit 100 --json`.

Do not delete a stale-looking lock automatically. Stop operations on that job, inspect `lock/owner.json` and the owning process, retain a copy, and remove the lock only after confirming it is unowned. Keep unreferenced version directories until recovery is complete. Back up the data directory before restamping or upgrading.

## Supported scope

- One UTF-8 work order per job, maximum 20 KiB.
- 1–12 owner-confirmed identifier requirements, with exact source passages.
- PNG/JPEG images, maximum 5 MiB each and 12 distinct images per job.
- Exact label matching, preserving punctuation and case; whitespace trimmed at the edges.
- Missing, unreadable and uncertain evidence stays unresolved.

Image reading can confuse characters or omit repeated digits. The agent reads identifiers twice and asks for clarification when readings disagree. A matching string does not establish the correct physical object; check its context and role. The helper validates structure, source membership and matching, not visual truth.

No PDFs, video parsing, hidden cable tracing, electrical tests, image authentication, NetBox integration or automatic ticket closure. Revised work orders start a new job. A locally hosted NanoClaw runtime does not by itself make model processing local.

## Services and privacy

The template uses the provider you configure in NanoClaw. Our runtime test used the [Codex provider](https://github.com/nanocoai/nanoclaw), with the operator signing in through the official setup. Check its current access requirements and [OpenAI plans](https://openai.com/chatgpt/pricing/). No author-owned credentials are included.

The helper itself makes **no network requests**. The configured model provider may process the work order, images and observations remotely. Review that provider's privacy terms before supplying sensitive site information. A local vision provider is an option only if your configured NanoClaw provider actually supports native image inspection; it is not verified by this template.

## Developer checks

From the repository root:

```sh
node --test it/remote-hands-reviewer/skills/remote-hands-reviewer/scripts/*.test.mjs
node scripts/check-templates.mjs
node scripts/build-index.mjs
node scripts/check-version-bump.mjs main
```

The deterministic tests cover exact matching, role separation, ambiguity, stale reviews, stored-content changes, atomic publication and job isolation. They do not measure vision accuracy. Native agent tests must inspect actual supplied images; developer-authored observation JSON only tests the helper.

The [skill](skills/remote-hands-reviewer/SKILL.md) describes the chat workflow. The [command contract](skills/remote-hands-reviewer/scripts/CONTRACT.md) documents inputs and recovery.

By Ahmed Rahimi. MIT, under the repository license.
