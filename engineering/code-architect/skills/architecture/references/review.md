# Architecture review

Set `task_type` to `review` in the scope and assignments.

## Workflow

1. Scope: resolve the repository, system boundary, current design, important
   runtime paths, tests, documentation, constraints, and known concerns, and
   record it all as a scope record per
   [contracts/scope.json](contracts/scope.json). Stay read-only.
   For a change-scoped review, read local contribution and CI files first and
   record the exact relevant check command before seeking external context.
2. Panel: seat it per [workflow.md](workflow.md#scope-and-panel). Add a
   specialist only when the system contains evidence for that domain. Identify
   languages from implementation, imports, manifests, build files, schemas,
   configuration, and
   documentation, judging by content rather than file suffixes alone.
3. Run the shared expert execution with `output_contract` set to
   [contracts/expert-review-analysis.json](contracts/expert-review-analysis.json)
   for book-guided experts. Experts inspect relevant tests, work read-only,
   and report only to the coordinator.
4. Verify claims against the code and evidence. When the scope record names a
   test command and the environment allows it, run it and cite the output.
   When the change edits a manifest or configuration for an installed local
   tool, run that tool's read-only validation command when discoverable, and
   prefer this direct evidence over web research. Confirm a base-sensitive
   check only against the actual review base, resolved from local
   remote-tracking refs and `git merge-base` before any hosting API; never
   assume a commit's parent is a pull request's merge base, and keep the result
   conditional while the base is unknown. Re-grade each severity from the
   finding's risk text against the contract's definitions, record
   `final_severity`, and report only items with confirmed entries; label
   unverifiable ones as assumptions. Do not create implementation code,
   manifests, deployments, or proof harnesses unless the user separately asks;
   for missing operational evidence, record the smallest delegated proof spec.
5. Stop after one full review cycle (verification reads included) unless the
   user asks for another.

## Output

After the [shared report sections](workflow.md#report--coordinator-to-user), add:

- Executive assessment: aligned, mixed, or at risk, with the main reason.
- Practices worth preserving: concrete strengths and why they help.
- Gaps and risks: only meaningful P0-P3 items with evidence and impact.
- Recommended evolution: now, next, and later; include the smallest useful step.
- Tradeoffs and assumptions: disagreements, missing facts, and decisions that
  could change the recommendation.

Assess boundaries, data, reliability, security, operability, changeability,
algorithms, and technology idioms where relevant. Respect repository
confidentiality and local contribution rules.
