# ForkCheck

**Turn disagreements into tests, not guesses.**

ForkCheck is a NanoClaw agent that converts conflicting claims into competing
hypotheses, finds the safest observation capable of distinguishing them,
produces an evidence-backed verdict, and automatically rechecks volatile
conclusions when reality changes. Every result becomes a versioned evidence
receipt instead of a disposable answer.

```text
Conflict
↓
Hypotheses
↓
Decisive question
↓
Safest discriminating test
↓
Evidence
↓
Verdict
↓
Evidence receipt
↓
Scheduled recheck
↓
Reaffirm / invalidate
```

Search can locate evidence. Confidence, source counts, and persuasive prose do
not decide the verdict. The decisive observation does.

## Why this is an Overall entry

ForkCheck targets the hackathon's **Overall** category. `product/forkcheck` is
the separate registry path: `product` describes where the template belongs in
the NanoClaw catalog, not the hackathon track.

| Overall criterion | What ForkCheck demonstrates |
|---|---|
| Originality | An agent that resolves disagreement by designing a falsifying observation, not summarizing or voting on claims. |
| Usefulness | Reproducible decisions for software behavior, product claims, operations, research, and any scoped testable dispute. |
| Broad appeal | The hypothesis → test → receipt loop is domain-neutral and understandable without specialist infrastructure. |
| Implementation quality | Safe-test gates, explicit evidence mapping, atomic JSON ledger updates, preserved history, deterministic tests, and paused-by-default scheduling. |
| Documentation | A runnable showcase, exact install and validation commands, service disclosures, limitations, and sample receipt. |

The [Official Rules](https://nanoclaw.dev/hackathon/september-2026-rules)
require substantive sponsor-product use only for Partner Track entries. An
integration is not mandatory for Overall. Tavily is included because current web
discovery is genuinely useful to ForkCheck; it is not being used to imply a
Tavily Track entry.

## The two-act demo

Run the judge-friendly showcase from the repository root:

```bash
node product/forkcheck/demos/showcase.mjs
```

**Demo B is the hero.** Two claims disagree about the exact Node runtime.
ForkCheck ignores version-general rhetoric and executes one read-only capability
probe: `typeof Array.prototype.toSorted`. The observed value selects the
hypothesis and produces a receipt tied to this environment.

**Demo C is the reveal.** A controlled capability record changes from
`streaming=false` to `streaming=true`. ForkCheck repeats the same decisive test,
preserves both receipts, appends the transition history, and prints:

```text
⚠ VERDICT INVALIDATED
```

The fixture is deliberately labeled and deterministic. It proves the
invalidation mechanism; it is never presented as an external event that happened
to change during judging.

Individual machine-readable demos remain available:

```bash
node product/forkcheck/demos/run-demo.mjs --demo a
node product/forkcheck/demos/run-demo.mjs --demo b
node product/forkcheck/demos/run-demo.mjs --demo c
```

## What ships

- `resolve-disagreement` scopes the conflict and coordinates the full loop.
- `design-test` predicts observations and ranks safe candidate tests.
- `evaluate-evidence` maps every evidence item to every hypothesis before
  issuing a verdict.
- `recheck-verdict` repeats the stored test and preserves every transition.
- Tavily Search and Extract provide optional current-evidence discovery.
- `forkcheck-ledger.mjs` writes dependency-free JSON state and Markdown receipts.
- `recheck-volatile-verdicts` is a daily, script-gated task that stamps paused.
- Three deterministic scenarios and Node tests exercise receipts, due checks,
  and invalidation.

## Architecture and durable state

The stamped plugin is read-only. Runtime state uses NanoClaw's plugin-owned
writable directory:

```text
/workspace/agent/plugins/forkcheck/             read-only template
/workspace/agent/plugin-data/forkcheck/         durable state
├── ledger.json
└── receipts/
    └── FC-0001/
        ├── 001-created.md
        ├── 002-verified-again.md
        └── latest.md
```

Each record stores the scoped question, hypotheses, predicted observations,
selected test, evidence classifications, verdict, confidence, limitations,
volatility, recheck time, and append-only transition history. Old receipts are
never silently replaced.

## Requirements and service disclosure

- A current NanoClaw v2 checkout with Agent Plugins 1.0.0 template support.
- Node.js 22+ and a working Linux container runtime supported by NanoClaw.
- WSL2 when the NanoClaw host is Windows.
- Network access only when Tavily discovery is used.

No provider, model, credential, API key, or user-specific configuration is
stored in the template. No paid service is required.

### Tavily Search and Extract

| Requirement | Exact value |
|---|---|
| API host | `mcp.tavily.com` |
| Transport | Remote MCP bridged over stdio by pinned `mcp-remote@0.1.38` |
| Default auth | Keyless IP-based allowance via `X-Tavily-Access-Mode:keyless` |
| Exposed access | `tavily_search` and `tavily_extract` only; Crawl, Map, and Research are filtered out |
| OAuth scopes | Not applicable; the keyless endpoint does not request OAuth scopes |
| Optional key | Create it at [Tavily](https://app.tavily.com) and store it as an `Authorization: Bearer` credential for `mcp.tavily.com` in NanoClaw's OneCLI vault |

The keyless allowance is shared and can be exhausted. An optional user-supplied
key can use Tavily's free account allowance; paid Tavily tiers are optional, not
a template dependency. Never put a key in `mcp.json`, source control, an agent
prompt, or a receipt.

## Install into NanoClaw

From a current NanoClaw checkout:

```bash
mkdir -p templates/product
cp -R /path/to/forkcheck/product/forkcheck templates/product/forkcheck
ncl groups create --template product/forkcheck --name "ForkCheck"
```

The bare ref is relative to NanoClaw's local `templates/` directory. It is not a
Git URL. The command stamps a group but does not wire a messaging channel; use
NanoClaw's channel-management flow to connect one.

For an existing ForkCheck agent, inspect the restamp plan before applying it:

```bash
ncl groups create --template product/forkcheck
ncl groups create --template product/forkcheck --yes --id <group-id>
ncl groups restart --id <group-id>
```

Restamping resets plugin-owned surfaces while preserving sessions, memory,
wiring, task pause/resume state, and `plugin-data/forkcheck`.

## Scheduled living verdicts

Stamping creates `recheck-volatile-verdicts` in a paused state. Inspect it before
enabling it:

```bash
ncl tasks list --group <group-id> --status paused
ncl tasks run <task-id> --group <group-id>
ncl tasks get <task-id> --group <group-id>
ncl tasks resume <task-id> --group <group-id>
```

The gate reads only ledger timestamps. With nothing due it returns
`wakeAgent: false`, so it consumes no model turn. A due ID is handed to
`recheck-verdict`. Unchanged checks remain quiet by default; weakened,
unresolved, or invalidated checks notify the user.

## Verdict contract

ForkCheck labels each item `OBSERVED`, `INFERRED`, `CLAIMED`, or `NOT TESTED`.
A fresh resolution uses only `SUPPORTED`, `REFUTED`, `MIXED`, or `UNRESOLVED`,
plus qualitative `LOW`, `MEDIUM`, or `HIGH` confidence.

A receipt looks like this:

```text
FORKCHECK VERDICT FC-0001

Question: Does this exact runtime provide Array.prototype.toSorted?
H1: The capability is present.
H2: The capability is absent.
Test: Evaluate typeof Array.prototype.toSorted in the current runtime.
Executed: yes
Observed: function
Verdict: SUPPORTED — H1
Confidence: HIGH
Volatility: HIGH
Recheck: 14 days
Limit: Applies only to the recorded runtime and environment.
```

## Safety boundaries

A live experiment must be legal, authorized, bounded, read-only or safely
reversible, free of meaningful financial cost, and unable to harm people,
systems, data, or third parties. ForkCheck does not bypass controls or request
secrets in chat.

Destructive writes, production mutations, purchases, load tests, exploit
attempts, and high-stakes real-world experiments are out of bounds. If no safe
decisive observation exists, the result is `UNRESOLVED` and the experiment is
labeled `NOT TESTED`.

## Limitations

- Inaccessible evidence, provider failures, permissions, and rate limits can
  leave a dispute unresolved.
- Direct observations can still be mis-scoped by runtime, version, region,
  feature flag, or authentication state; receipts record those limits.
- The JSON ledger is designed for one NanoClaw agent group, not concurrent
  high-throughput writers.
- Tavily keyless availability is external and not guaranteed.
- The recurring task remains inactive until an operator resumes it.
- Demo C uses a controlled fixture and proves mechanics, not a live vendor
  change.

## Validate before submission

Run ForkCheck's deterministic suite:

```bash
node --test product/forkcheck/tests/forkcheck.test.mjs
```

Then copy the template into a fresh checkout of the official registry and run
the same zero-dependency validator used by CI:

```bash
git clone https://github.com/nanocoai/nanoclaw-templates.git
cp -R /path/to/forkcheck/product/forkcheck nanoclaw-templates/product/forkcheck
cd nanoclaw-templates
node scripts/check-templates.mjs
```

Finally, stamp the bare ref into a working NanoClaw install, confirm the task is
paused, send one real disagreement through the agent, and inspect the generated
ledger and receipt. The official [template contribution guide](https://github.com/nanocoai/nanoclaw-templates/blob/main/CONTRIBUTING.md)
is the source of truth for the registry PR.

## Third-party and open-source components

| Component | Use | License / terms |
|---|---|---|
| [NanoClaw](https://github.com/nanocoai/nanoclaw) | Host runtime and template extension | MIT |
| [Agent Plugins 1.0.0](https://agent-plugins.org) | Portable plugin and MCP manifest format | Open standard; no code vendored |
| [`mcp-remote@0.1.38`](https://github.com/geelen/mcp-remote) | Stdio-to-remote-MCP bridge, installed by `npx` at runtime | MIT |
| [Tavily Remote MCP](https://docs.tavily.com/documentation/mcp) | Optional Search and Extract service | External service terms apply; no code or credential vendored |

ForkCheck itself is submitted to the MIT-licensed NanoClaw template registry.
The template contains no copied proprietary data, confidential information, or
third-party credentials.

## Hackathon submission facts

- Entry category: **Overall**.
- Registry path: **`product/forkcheck`**.
- Deadline: **September 6, 2026 at 20:59 UTC**; NanoCo's clock controls.
- Required path: open a template PR, then provide the requested entry details
  and a short video showing the agent or workflow running through the official
  form.
- The published page and rules do not state a numeric maximum video duration or
  a required video host. Verify the live form before recording the final cut.
- Official judging criteria: originality, usefulness, broad appeal,
  implementation quality, and documentation.

Sources: [hackathon page](https://nanoclaw.dev/hackathon/),
[Official Rules](https://nanoclaw.dev/hackathon/september-2026-rules), and
[template submission documentation](https://docs.nanoclaw.dev/templates/submitting).
