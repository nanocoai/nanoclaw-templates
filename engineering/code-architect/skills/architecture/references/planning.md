# Architecture planning

Set `task_type` to `planning` in the scope and assignments.

## Workflow

1. Scope: establish goals, non-goals, users, constraints, scale, data,
   security, SLOs, budget, existing systems, migration needs, and decision
   deadlines. State material unknowns instead of inventing requirements, and
   record it all as a scope record per
   [contracts/scope.json](contracts/scope.json).
2. Panel: seat it per [workflow.md](workflow.md#scope-and-panel). Add
   Algorithmic, Cloud, AI, or ML only when the planned system materially uses
   that domain.
   Identify languages from the planned runtime, libraries, interfaces, data,
   infrastructure, and existing system.
3. Run the shared expert execution with `output_contract` set to
   [contracts/expert-planning-proposal.json](contracts/expert-planning-proposal.json)
   for book-guided experts. Ask experts to propose options independently,
   covering strengths, failure modes, change costs, and
   the smallest viable form.
4. Compare confirmed options against the constraints and recommend one design.
   Deliver the recommendation; implement only when the user separately asks.
   For missing operational evidence, record the smallest delegated proof spec
   instead of creating implementation code, manifests, deployments, or proof
   harnesses during planning.

## Output

After the [shared report sections](workflow.md#report--coordinator-to-user), add:

- Context, goals, non-goals, constraints, and assumptions.
- Recommended architecture: components, interfaces, data, and key flows.
- Alternatives and tradeoffs, including why they were not selected.
- Failure handling, security, observability, capacity, and cost.
- Testing and evaluation strategy.
- Migration, rollout, compatibility, and rollback plan.
- Open decisions suitable for architecture decision records.

Prefer reversible choices and the smallest architecture that meets known needs.
