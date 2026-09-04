# The Code Architect

A NanoClaw template with one `architecture` skill and two modes:

- Architecture Planning for systems, features, refactors, and technology choices.
- Architecture Review for existing systems and codebases.

![NanoClaw architects in a library](../../assets/nanoclaw-architects-library.jpg)

## How it works

The coordinator reads the request, records the scope, and seats the smallest
panel the evidence justifies from thirteen lenses: design principles, pragmatic
engineering, systems, data, reliability, testing, algorithms, change
management, security, cloud, AI, ML, and one programming-language expert per
language whose semantics materially affect a risk. Every panel also seats a
Tech lead, which does query-driven web research instead of using books and
returns source-backed insights, technology signals, and tradeoffs rather than
recommendations.

A shared Librarian selects two to four exact book editions for each
book-guided expert, matched to both its field and the concrete problem, and
returns book identity and fit only. The experts then apply their pretrained
knowledge of those books, naming the chapters, sections, and practices used
and tracing each to architecture evidence. The coordinator verifies book
identity, chapter and practice association, every cited URL, and each
application before writing the only user-facing prose, and separates
architecture direction from production proof for every major recommendation.
The result is a verified book-grounded trace, not runtime reading or proof of
training-set membership; no books, copies, or fixed source lists are bundled.

## Layout

```
skills/architecture/
├── SKILL.md                # mode selection and shared entry point
├── references/
│   ├── planning.md         # planning scope, expert output, and report sections
│   ├── review.md           # review scope, checks, and report sections
│   ├── workflow.md         # shared flow, contracts table, report skeleton
│   ├── agents/             # expert index, protocol, Librarian, Tech lead, lenses
│   └── contracts/          # JSON Schema for every record the roles exchange
└── evals/evals.json        # maintainer test material; a running agent never reads it
ai.nanoco.nanoclaw/context/instructions.md   # persona: routing and delivery rules
```

All references live inside the skill and use file-relative links. Agent
definitions live once, so review shared changes against both modes. Only the
coordinator writes user-facing recommendations.
It requires an isolated Librarian and non-inheriting expert contexts and stops
if the platform cannot provide them.

## Stamp an agent

```bash
ncl groups create --template engineering/code-architect --name "The Code Architect"
```

Wire it to a channel with `/manage-channels`, then ask it to plan a new
architecture or review an existing one.

The template has no MCP servers, scheduled tasks, paid services, credentials,
hardcoded source list, or bundled books.

Created by [zvi-fried](https://github.com/zvi-fried).
