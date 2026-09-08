# Evidence Domino

**Catch supplier price changes before you send a proposal.**

Evidence Domino helps event operators and small agencies review supplier-price
changes before sending a proposal. It retrieves the approved source through
Tavily, calculates the remaining amount before other costs, and prepares a
cited repair. The owner confirms that the observed price applies before
adopting the displayed revision.

The optional [local workspace](workspace/README.md) adds chat over proposal
notes and supplier-price scenarios using an installed Ollama model. It shares
the template's calculation and approval engine. Public retrieval is optional;
local inference does not require changing NanoClaw's provider.

## What it supports

- One UTF-8 Markdown proposal up to 20 KB.
- One owner-selected public HTTPS source.
- One item, one whole-number quantity, and one USD unit price.
- One fixed customer quote and one minimum remaining amount.
- Three exact owner-confirmed proposal sentences: tracked cost, remaining
  amount, and minimum-condition statement.
- Manual checks plus one daily task that installs paused.

“Remaining” means the customer quote minus the one tracked supplier cost,
before other costs. Evidence Domino does not calculate profit, verify a whole
proposal, decide that a public listing applies to a contract, convert currency,
or publish changes.

## The three-minute example

The included fictional proposal starts with 100 display plinths at $40 each, a
$6,000 customer quote, $2,000 remaining before other costs, and a $1,500 target.
A controlled source replay observes $55. The review says:

> **At this listed price, your draft would miss its target by $1,000.**
>
> Applicability awaiting review.

The report shows the old and observed passages, $2,000 → $500, the affected
sentences, an unchanged event date, the calculation, and the proposed revision.

The example uses fictional supplier pages in `fixtures/`, retrieved through Tavily.

## Install

Copy this template into the `templates/product/` directory of a NanoClaw 2.3.0
installation, then create a group:

```sh
mkdir -p <nanoclaw>/templates/product
cp -R product/evidence-domino <nanoclaw>/templates/product/

ncl groups create \
  --template product/evidence-domino \
  --name "Evidence Domino" \
  --timezone Europe/Riga \
  --json
```

If `ncl` is not on `PATH`, run `pnpm ncl` from the NanoClaw checkout. Inspect
the returned `templateReport`; a created group does not by itself prove every
component stamped successfully. Some CLI versions omit `templateReport`; in that case inspect the group’s installed plugin, instructions, and paused task directly. If this plugin is already installed in another group, add `--new` to create an isolated group; use `--id <group-id>` to update an identified group.

The CLI channel ships with NanoClaw. If this agent is not connected to
`cli/local`, inspect the existing messaging group and wirings before changing
anything:

```sh
ncl messaging-groups list --channel-type cli --platform-id local --json
ncl wirings list --messaging-group-id <messaging-group-id> --json
```

Attach the Evidence Domino group only after identifying which existing wiring
should remain. Multiple agents on the same catch-all CLI pattern may all
respond.

For a dedicated CLI channel, save the existing wiring list, then remove only
the identified setup-agent wiring if it would also respond. Substitute the
actual IDs returned by the inspection commands:

```sh
ncl wirings list --messaging-group-id <messaging-group-id> --json > wiring-backup.json
ncl wirings delete --id <identified-setup-wiring-id> --json
ncl wirings create \
  --messaging-group-id <messaging-group-id> \
  --agent-group-id <evidence-domino-group-id> \
  --engage-mode pattern --engage-pattern '.' --session-mode shared --json
ncl wirings list --messaging-group-id <messaging-group-id> --json
```

Skip the delete command if there is no conflicting setup wiring. Preserve
unrelated agents and channels. The last command should show only the intended
agent matching your test messages on this dedicated CLI channel.

NanoClaw must have a working model provider connected through its official
setup. Provider selection belongs to the operator, not this template. On an
installation where Codex has already been installed and authenticated:

```sh
ncl groups config update --id <evidence-domino-group-id> --provider codex --json
ncl groups restart --id <evidence-domino-group-id> --json
```

From the NanoClaw checkout, send a readiness message:

```sh
pnpm run chat 'Read the Evidence Domino skill and tell me whether a project is active. Do not start a capture.'
```

The one-shot CLI stops after two seconds of silence following the first reply.
If a result arrives late, recover it through `ncl sessions list --json`, then
`ncl sessions history <session-id> --limit 100 --json`. An early acknowledgement
is not proof that the operation finished.

## Run the controlled example through chat

Use a fresh group with no active project. This example retrieves its fictional
supplier pages through Tavily.

Send this from the NanoClaw checkout:

```sh
pnpm run chat 'Start a Controlled source replay using the installed Evidence Domino fixtures/demo-proposal.md and fixtures/replay-manifest.json. Read the fictional supplier-v1.md as my proposed starting estimate. Propose the item, unit, inputs and three exact sentence mappings, and show the required baseline confirmation. Do not initialize until I confirm.'
```

Check the proposed mapping: 100 plinths, $40 per plinth, $6,000 customer quote,
and $1,500 minimum. Then send:

```sh
pnpm run chat 'I confirm this mapping uses a public-list-price estimate, not a locked supplier quotation, and start monitoring.'
pnpm run chat 'In this Controlled source replay, capture manifest version v1 through Tavily now and stage its interpretation. Check the declared version marker. Do not use an offline response.'
```

The v1 check should report no material change. Next:

```sh
pnpm run chat 'In this Controlled source replay, capture manifest version v2 through Tavily now, verify its marker, and stage the comparable interpretation. Show the review ID, conditional consequence and HTML report path. Do not approve it.'
```

Expected result: $5,500 supplier cost, $500 remaining before other costs,
and a conditional $1,000 shortfall. Open the report and check the evidence
before sending the exact approval phrase with the returned revision ID:

```sh
pnpm run chat 'Confirm that this observed price applies and adopt revision <returned-revision-id>.'
pnpm run chat 'Show current status and the adopted document path. Do not run another capture.'
```

The active baseline should now be version 2. The event date, customer quote,
and target should still be unchanged. Both captures, the review and the original
document remain available in plugin data.

To inspect a report on the host, find the group's `folder` in
`ncl groups get --id <group-id> --json`. Replace the container prefix
`/workspace/agent/` in the reported path with `<nanoclaw>/groups/<folder>/`.
For example, on macOS:

```sh
open '<nanoclaw>/groups/<folder>/plugin-data/evidence-domino/reviews/<review-id>/report.html'
```

On Linux use `xdg-open` or open that file with your browser. The HTML is a
read-only snapshot; approval happens in chat.

## Tavily access and data disclosure

Evidence Domino calls `https://api.tavily.com/extract` directly using Tavily's
documented keyless access mode. Keyless access is free and rate-limited. It can
be replaced with an operator-owned Tavily API key through NanoClaw's OneCLI
Agent Vault when higher limits are needed. Evidence Domino does not contain,
request, print, or store a credential.

The template adds its own guard of 20 HTTP transmissions per agent group per
UTC day. Every retry counts against that budget, and only one retry is allowed
for a transient timeout or server error. Tavily's effective provider quota can
still be lower or higher; the local budget is a safety limit, not a claim about
the provider account. There is no automatic paid upgrade.

Only the public source URL and neutral extraction parameters are sent to
Tavily. The proposal and customer identity are not included in that request.
The configured agent model may process proposal text and retrieved evidence as
part of the chat workflow; local artifact storage does not mean a model
provider never receives the content.

If OneCLI injects a valid Tavily credential, Tavily documents that keyed access
takes precedence over the requested keyless mode. Provider-reported usage is
retained when present. Evidence Domino does not claim to verify billing mode.

- API host: `api.tavily.com`
- Authentication: keyless header by default; optional Bearer API key supplied
  by the operator through the OneCLI vault
- Required endpoint: Extract only
- Account/key source: https://app.tavily.com
- Pricing and free-tier details: https://docs.tavily.com/documentation/api-credits
- Keyless behavior: https://docs.tavily.com/documentation/keyless

## Use it in chat

Start by giving the agent:

1. The proposal file or its Markdown text.
2. The public source URL.
3. The item and exact unit basis.
4. Confirmation that the proposal uses the public listing as an estimate and
   has no locked supplier quote.

The agent proposes the three sentence mappings and shows the initial evidence
and arithmetic. After you send the exact baseline confirmation shown by the
agent, `init` creates baseline version 1.

The cost and remaining sentences can use natural wording. The minimum sentence
must state only the condition and fixed target, for example “This meets our
minimum remaining amount of $1,500.” If it also mentions changing headroom or
a shortfall amount, the agent proposes a simpler sentence and asks you to
approve the edit before starting. This keeps a still-true condition from
retaining stale figures later. The helper returns the exact supported wording;
it never silently normalizes the original document.

Later, say **“Check now.”** A comparable observed rate produces a review with
**Applicability awaiting review**. To adopt it, explicitly say:

> Confirm that this observed price applies and adopt revision `<revision-id>`.

That approval adopts the displayed evidence interpretation and document
revision together. It does not alter the customer quote or minimum target.

Approval waits while a newer check is running or its evidence is unresolved.
An ambiguous observation must be recorded even though it creates no calculated
revision. A later validated identical observation may reuse the existing
review without another change alert.

The final chat response includes the review ID and immutable report path.
Reports show their status when generated. Ask for current status in chat rather
than treating an old browser tab as current state.

## Generated state

Template code is mounted read-only at:

```text
/workspace/agent/plugins/evidence-domino
```

Persistent project data is written under:

```text
/workspace/agent/plugin-data/evidence-domino
```

The helper defaults to that path. Its `--data-dir` option is intended only for
tests and local development. The exact five-command JSON contract is documented
in `skills/evidence-domino/SKILL.md`.

Each completed review includes immutable JSON evidence, a proposed Markdown
document, a Markdown review, and a self-contained `report.html`. On the host,
open the corresponding file under the group's
`plugin-data/evidence-domino/...` directory.

Every `capture` result returns paths to its immutable `capture.json`, extracted
`content.md` when successful, and the exact raw response for each HTTP attempt.

## Scheduled check

The included daily task is created **paused**. Inspect it before enabling:

```sh
ncl tasks list --status paused --json
ncl tasks get --id <task-id> --json
ncl tasks run --id <task-id> --json
```

Enable only when wanted:

```sh
ncl tasks resume --id <task-id> --json
```

The task saves a review and its task result. It never approves a changed price
or document revision. The basic CLI channel does not replay responses sent
while no terminal client is connected, so use chat status, task history, or the
saved report for later inspection.

## Known limits and failure behavior

- A quotation found in Tavily output is transformed extracted content, not an
  authenticated publisher snapshot.
- Retrieval time is not publisher modification time, and freshness is not
  guaranteed.
- Currency, product, unit, duration, quantity tier, region, tax, delivery, or
  other material uncertainty blocks the calculation until clarified.
- Multiple plausible listed prices produce a clarification request.
- Missing content, rate limits, quota errors, malformed output, stale
  approvals, changed documents, and concurrent checks retain the last approved
  baseline.
- An oversized response stops without an immediate retry. Its retained bytes
  are bounded and labelled incomplete; they are not claimed to be the entire
  response. Ordinary supported responses are preserved in full.
- Ambiguous signed-money notation, accounting parentheses and fractional or
  negative quantities require correction rather than being read as a positive
  number. USD amounts use no more than two decimal places.
- Generated reports escape retrieved text, contain no remote assets, and are
  read-only snapshots.
- Agent-written approval records document a private owner workflow; they are
  not tamper-proof authorization against a compromised agent with access to the
  same writable directory.

## Development and verification

### Recovery and upgrades

A lock is never removed automatically. If a command reports a lock, inspect its
owner and confirm that operation has stopped before removing only that lock.
Keep a copy of the project data first. A crash during publication leaves the
previous complete baseline readable. If staging published an orphan review,
start a fresh capture after recovery instead of restaging the same capture.
An interrupted approval can be retried with the same reviewed revision.

Reviews created before baseline metadata binding must be regenerated by a new
capture and staging before approval. If an older baseline has a minimum
sentence containing changing amounts, staging stops: obtain the owner's
approval for the suggested simpler sentence and initialize a fresh group with
the corrected document. Preserve the original group's history.

Run the deterministic suite with Node 22:

```sh
node --test product/evidence-domino/skills/evidence-domino/scripts/*.test.mjs product/evidence-domino/workspace/*.test.mjs
```

Then run the registry checks from the repository root:

```sh
node scripts/check-templates.mjs
node scripts/build-index.mjs
git diff --exit-code index.json
node scripts/check-version-bump.mjs main
```

Finally, copy and stamp a fresh template and exercise the full chat workflow
with a real Tavily retrieval. Mocked or offline tests do not establish that
integration.

The registry scripts in the examined snapshot have a path-decoding bug when
the checkout contains spaces. Run those scripts from a checkout at a path
without spaces. This does not affect the template helper or its Node tests.

## Components and attribution

This template uses [NanoClaw](https://github.com/nanocoai/nanoclaw), Node.js
built-ins and the container's curl executable. Public-source extraction is
provided by [Tavily](https://tavily.com/). The optional workspace calls an
operator-installed [Ollama](https://github.com/ollama/ollama) runtime (MIT);
the documented model is [Qwen3-4B](https://huggingface.co/Qwen/Qwen3-4B)
(Apache-2.0). These runtimes and model weights are installed separately and
are not bundled. Follow the license of any substitute model you install.

## License and stewardship

This template follows the repository's MIT license. A merged registry template
is maintained under NanoClaw's contribution policy. It contains no affiliate
links, shared credentials, billing, or author-controlled monetization.
