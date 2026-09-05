# Evidence Domino

**A public price changed. See the exact draft-proposal sentences it affects.**

Evidence Domino is a NanoClaw template for one owner who prepares a fixed-price
proposal using one public USD list price as an estimate. It retrieves the
approved source through Tavily, calculates the conditional effect, creates an
immutable visual review, and prepares a narrowly edited Markdown revision.
Nothing is adopted until the owner explicitly confirms that the observed price
applies and accepts the displayed revision.

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
It never says a supplier contract changed.

See `fixtures/` for the fictional proposal and replay sources. Offline fixtures
exercise deterministic behavior only. A live contest demonstration must fetch
the published immutable fixture URLs through Tavily and keep the **Controlled
source replay** label visible.

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
component stamped successfully.

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

## Tavily access and data disclosure

Evidence Domino calls `https://api.tavily.com/extract` directly using Tavily's
documented keyless access mode. Keyless access is free and rate-limited. It can
be replaced with an operator-owned Tavily API key through NanoClaw's OneCLI
Agent Vault when higher limits are needed. Evidence Domino does not contain,
request, print, or store a credential.

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

Later, say **“Check now.”** A comparable observed rate produces a review with
**Applicability awaiting review**. To adopt it, explicitly say:

> Confirm that this observed price applies and adopt revision `<revision-id>`.

That approval adopts the displayed evidence interpretation and document
revision together. It does not alter the customer quote or minimum target.

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
- Generated reports escape retrieved text, contain no remote assets, and are
  read-only snapshots.
- Agent-written approval records document a private owner workflow; they are
  not tamper-proof authorization against a compromised agent with access to the
  same writable directory.

## Development and verification

Run the deterministic suite with Node 22:

```sh
node --test product/evidence-domino/skills/evidence-domino/scripts/*.test.mjs
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

## License and stewardship

This template follows the repository's MIT license. A merged registry template
is maintained under NanoClaw's contribution policy. It contains no affiliate
links, shared credentials, billing, or author-controlled monetization.
