---
name: architecture-planning
description: Plan the architecture of a new system, feature, refactor, or migration through a small expert panel. Use only when the user explicitly asks for architecture planning, system design, or technical strategy before implementation. Do not use for implementation, debugging, or reviewing existing code.
---

# Architecture Planning

Design a practical system and explain its tradeoffs.

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
2. Establish goals, non-goals, users, constraints, scale, data, security, SLOs,
   budget, existing systems, migration needs, and decision deadlines. State
   material unknowns instead of inventing requirements, and record it all as a
   scope record per `contracts/scope.json`.
3. Select the minimal book-guided panel the task requires from the index; the
   coordinator understands the request and decides who sits at the roundtable,
   and seats a lens only with specific evidence from the scope, recorded in
   that expert's assignment `justification`. Always add the Tech lead as the
   standing current-source role; it supplies source-backed insights,
   technology signals, and tradeoffs, not recommendations. Add Algorithmic,
   Cloud, AI, or ML only when the planned system materially uses that domain.
4. Identify materially involved languages or DSLs from the planned runtime,
   libraries, interfaces, data, infrastructure, and existing system. Record each
   language's evidence and seating decision in the scope record. Add a
   programming-language expert only when language semantics materially affect
   a risk the seated experts do not cover; a runtime or file format appearing
   in the plan is not enough evidence. Give each seated language expert an
   explicit watch list, and let one expert also cover a closely coupled
   framework when that keeps the panel smaller.
5. Run the shared expert execution in `workflow.md` with
   `output_contract` set to `expert-planning-proposal.json` for book-guided
   experts and `tech-lead-current-brief.json` for the Tech lead. Ask experts to
   propose options independently, covering strengths, failure modes, change
   costs, and the smallest viable form.
6. Compare confirmed options against the constraints and recommend one design.
   Deliver the recommendation; implement only when the user separately asks.
   For missing operational evidence, record the smallest delegated proof spec
   instead of creating implementation code, manifests, deployments, or proof
   harnesses during planning.

## Output

- Panel: the seated experts and one line on why each was included; lenses
  excluded at selection and experts dropped at synthesis, each with its
  reason. Attribute each finding below to its lens.
- If the user requested specific questions, headings, score names, or ordering,
  preserve that shape and answer each requested item directly.
- Context, goals, non-goals, constraints, and assumptions.
- Recommended architecture: components, interfaces, data, and key flows.
- Alternatives and tradeoffs, including why they were not selected.
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
- Failure handling, security, observability, capacity, and cost.
- Testing and evaluation strategy.
- Migration, rollout, compatibility, and rollback plan.
- Open decisions suitable for architecture decision records.

Prefer reversible choices and the smallest architecture that meets known needs.
