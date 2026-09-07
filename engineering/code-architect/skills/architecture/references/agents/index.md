# Expert index

Select the minimal panel the task requires. The coordinator understands the
request in detail and decides who sits at the roundtable. Select an expert
only when the scope contains evidence for that lens, and let one expert cover
several concerns before adding another.

Always seat the [Tech lead](tech-lead.md) (`tech-lead`), the one standing,
non-book seat; its definition holds its rules.

A language, schema, or configuration format appearing in the scope is not
enough evidence for its own seat; language semantics must materially affect a
risk that the seated experts do not cover.

Each entry starts with the role id used in every contract's `role` field:

- `design-principles` — [Design principles](design-principles-architect.md):
  clarity, boundaries, responsibilities, contracts, dependency direction,
  maintainability.
- `pragmatic` — [Pragmatic engineering](pragmatic-architect.md): coupling,
  feedback, reversibility, accidental complexity.
- `systems` — [Systems](systems-architect.md): data flow, resources, failure,
  compatibility, operations.
- `data` — [Data](data-architect.md): schemas, storage, consistency,
  pipelines, retention, privacy.
- `reliability` — [Reliability](reliability-expert.md): SLOs, alerting,
  capacity, resilience, on-call and human factors.
- `testing` — [Testing](testing-expert.md): test strategy, behavior coverage,
  determinism, eval and regression gates.
- `algorithmic` — [Algorithmic](algorithmic-expert.md): algorithms,
  performance, numerical work.
- `change-management` — [Change management](change-management-expert.md):
  refactors, migrations, rollout, rollback.
- `security` — [Security](security-expert.md): adversaries, trust boundaries,
  abuse, defensive controls.
- `cloud` — [Cloud](cloud-architect.md): distributed, hosted, networked, or
  infrastructure systems.
- `ai` — [AI](ai-architect.md): foundation models, RAG, generative AI, agents,
  and conformance of skills, plugins, MCP servers, and agent instruction files
  to their published standards.
- `ml` — [ML](ml-architect.md): datasets, training, predictive models, drift,
  and experimentation.
- `language:<name>` — [Programming language](programming-language-expert.md):
  idioms and engineering practice for one materially involved language or DSL
  and its closely coupled ecosystem, for example `language:typescript`.

Every book-guided expert follows the
[shared expert protocol](expert-protocol.md). Spawn one isolated shared
[Librarian](librarian.md) for every workflow; it is a support role, not another
review lens. The shared [workflow](../workflow.md) defines coordinator
handoffs, validation, verification, and the report.

Selection hints:

- Planning usually needs Systems or Pragmatic plus Change management. Add a
  domain specialist only when the planned system uses that domain.
- Architecture review usually needs Systems plus the lens closest to the stated
  concern.

Treat every agent as a small service. Each receives only the contracts named
by its interface, and only the coordinator writes user-facing prose in the
selected mode's output format.
