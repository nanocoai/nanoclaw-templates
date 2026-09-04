# The Code Architect

A NanoClaw template for two expert-panel workflows:

- Architecture Planning for systems, features, refactors, and technology choices.
- Architecture Review for existing systems and codebases.

![NanoClaw architects in a library](../../assets/nanoclaw-architects-library.jpg)

## Expert selection

The compact expert index covers design principles, pragmatic engineering,
systems, data, reliability, testing, algorithms, change management, security,
cloud, AI, and ML. Each skill selects the minimal book-guided panel the task
requires — the coordinator understands the request and decides who sits at the
roundtable — and always adds a Tech lead for current source-backed context.
The Tech lead uses query-driven web research, not books or a fixed source
list. Reports state the selected panel and reasoning at the top. The template
spawns programming-language experts only for languages or DSLs that materially
affect the requested scope.

Agent definitions live once under `references/agents/`, a sibling of the
skills tree shared by both skills — an edit there changes every skill, so
review changes against both. The shared workflow document
(`references/workflow.md`) maps the flow the skills own as a mermaid diagram
and the JSON Schema contracts every role exchanges — assignments, book
requests, selected book lists, Tech lead source evidence, and per-skill expert
outputs. The shared
`references/agents/expert-protocol.md` defines book-guided expert exchanges;
the Tech lead uses its own current-source contract. Only the coordinator writes
user-facing recommendations and prose. The per-skill `evals/evals.json` files are
maintainer test material; a running agent never reads them. The coordinator
requires an isolated Librarian and non-inheriting expert-agent contexts and
stops if the platform cannot provide them.

## Book-guided practice use

One shared Librarian selects two to four books for both the expert's field and
the specific architecture problem. It provides exact book identity and fit,
not copies, sections, verification sources, summaries, or principles. It
privately accepts a book only when it recognizes the exact title, author, and
edition and can recall distinctive book-specific ideas from pretrained
knowledge. The check and recalled material never reach the expert. This filters
for familiarity but cannot prove exact training-set membership.
Experts then use their pretrained knowledge of every selected book. Their
responses name the chapters, sections, and practices used and trace each
practice to concrete architecture evidence. The coordinator verifies book
identity, chapter and section association, practice association, and application
before using it. This works
with familiar books whether or not a free digital copy exists; it proves a
verified book-grounded trace, not runtime reading or training-set membership.
The Tech lead is the exception: it verifies live technical sources and reports
source-backed insights, technologies, and tradeoffs separately. Each source
note includes a date, version, commit, or `not stated`, and every source id
used by an insight, technology, or tradeoff must match that source list.

Reports also separate architecture direction from production proof. Major
recommendations carry confidence (`direction`, `provider`, or `operational`),
the evidence behind that level, missing proof, and the next smallest delegated
proof spec: owner, acceptance evidence, observations to capture, and pass/fail
conditions.

## Evals

Each skill ships example evaluations in `skills/<name>/evals/evals.json`:
prompts with expected behavior, used to spot-check that a skill selects a
minimal panel and produces the intended shape of report.

## Harnesses

The root `plugin.json` follows the Agent Plugins standard. NanoClaw stamps the
whole plugin into the agent workspace, so the skills and the shared
`references/` library ship together. A harness that loads the plugin in place
finds `references/` beside `skills/`.

## Stamp an agent

```bash
ncl groups create --template engineering/code-architect --name "The Code Architect"
```

Wire it to a channel with `/manage-channels`, then ask it to plan a new
architecture or review an existing one.

The template has no MCP servers, scheduled tasks, paid services, credentials,
hardcoded source list, or bundled books.

Created by [zvi-fried](https://github.com/zvi-fried).
