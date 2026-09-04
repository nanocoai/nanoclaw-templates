---
name: architecture-review
description: Review the architecture of an existing codebase, system, or design through a small expert panel. Use only when the user explicitly asks for an architecture review, architecture assessment, design review, or system health review. Do not use for PR review, debugging, implementation, or planning a new design.
---

# Architecture Review

Assess how well an existing system follows sound engineering practices. Report
strengths as well as gaps.

The shared library is this plugin's `references/` folder. On NanoClaw the
whole plugin is stamped into your workspace, so the library is at
`plugins/code-architect/references/` under your workspace, which is
`/workspace/agent/plugins/code-architect/references/` in the container. On a
harness that loads the plugin in place, the same folder is ``
relative to this file. Paths below are relative to that library.

## Workflow

1. Read `workflow.md`,
   `agents/expert-protocol.md`, the shared expert index at
   `agents/index.md`, `agents/tech-lead.md`,
   and every selected expert definition completely.
2. Resolve the repository, system boundary, current design, important runtime
   paths, tests, documentation, constraints, and known concerns, and record it
   all as a scope record per `contracts/scope.json`. Stay read-only.
   For a change review, read local contribution and CI files first and record
   the exact relevant check command before seeking external context.
3. Select the minimal book-guided panel the task requires from the index; the
   coordinator understands the request and decides who sits at the roundtable,
   and seats a lens only with specific evidence from the scope, recorded in
   that expert's assignment `justification`. Always add the Tech lead as the
   standing current-source role; it supplies source-backed insights,
   technology signals, and tradeoffs, not recommendations. Add a specialist
   only when the system contains evidence for that domain.
4. Identify materially involved languages or DSLs from implementation,
   imports, manifests, build files, schemas, configuration, and documentation,
   judging by content rather than file suffixes alone. Record each language's
   evidence and seating decision in the scope record. A language or file format
   does not earn a seat merely because it appears. Add a programming-language
   expert only when language-specific semantics materially affect a concrete
   risk and the primary lens cannot cover them.
5. Run the shared expert execution in `workflow.md` with
   `output_contract` set to `expert-review-analysis.json` for book-guided
   experts and `tech-lead-current-brief.json` for the Tech lead. Experts inspect
   relevant tests, work read-only, and report only to the coordinator.
6. Verify claims against the code and evidence. When the scope record names
   a test command and the environment allows it, run it and cite the output.
   When the change removes or edits a manifest or configuration for an installed
   local tool, run that tool's read-only validation command when discoverable;
   prefer this direct evidence over web research.
   For a commit or diff, resolve the actual review base before running any
   base-sensitive check. Do not substitute the commit parent for a pull-request
   merge base unless repository evidence shows they are the same; when the base
   is unknown, keep the result conditional rather than confirming a failure.
   Prefer local remote-tracking refs and `git merge-base`; use a hosting API only
   when local repository evidence cannot identify the base.
   Re-grade each severity
   from the finding's risk text against the contract's P0-P3 definitions,
   treating a check that safely blocks release as a gate working, not a P0
   main-path failure by itself,
   demote any grade the risk alone fails to justify, and report only items
   with confirmed entries; label unverifiable ones as assumptions.
   Do not create implementation code, manifests, deployments, or proof
   harnesses during an architecture review unless the user separately asks.
   For missing operational evidence, record the smallest delegated proof spec.
7. Stop after one full review cycle (verification reads included) unless the
   user asks for another.

## Output

- Panel: the seated experts and one line on why each was included; lenses
  excluded at selection and experts dropped at synthesis, each with its
  reason. Attribute each finding below to its lens.
- If the user requested specific questions, headings, score names, or ordering,
  preserve that shape and answer each requested item directly.
- Executive assessment: aligned, mixed, or at risk, with the main reason.
- Practices worth preserving: concrete strengths and why they help.
- Gaps and risks: only meaningful P0-P3 items with evidence and impact.
- Book-practice trace: selected books, why each fit, verified chapters and
  sections used, practices applied, the architecture evidence and
  output each practice shaped, and verdicts.
- Source list and current-source trace: Tech lead `source_notes` first, then
  why each source was relevant, the insights, technology signals, tradeoffs,
  and architecture evidence each shaped, and verification verdicts.
- Standards conformance: for agent skills, plugins, MCP servers, and agent
  instruction files in scope, each standard checked, the clause, the verdict,
  and the evidence.
- Production proof: for each major recommendation, confidence
  (`direction`, `provider`, or `operational`), evidence, missing proof, and the
  next smallest delegated proof spec with owner, acceptance evidence,
  observations to capture, and pass/fail conditions.
- Recommended evolution: now, next, and later; include the smallest useful step.
- Tradeoffs and assumptions: disagreements, missing facts, and decisions that
  could change the recommendation.

Assess boundaries, data, reliability, security, operability, changeability,
algorithms, and technology idioms where relevant. Respect repository
confidentiality and local contribution rules.
