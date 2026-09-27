# Play: execute fixes from the backlog

The backlog (`get_recovery_actions`) is a prioritized list of concrete
recommendations distilled from audits, weekly analyses, and gap
analyses. Each action carries an impact-tracking status: `not_tracked`
(nobody acted), `measuring` (a fix was reported, impact being measured),
`archived`. You work the `not_tracked` ones.

## Per action: ground, draft, ship, report

**1. Ground it.** Read the action's rationale, plus the gap analysis or
audit finding behind it (`get_visibility_gaps`, `get_audit_summary`) and
the captured answers for the affected prompt (`get_evidence`). You are
about to write for two audiences at once: the human reader and the AI
engine that failed to recommend the brand. Know exactly what the engine
said instead, and which sources it cited.

**2. Draft it.** Typical shapes:

- **A page or section** answering the lost prompt the way the winning
  competitor's page does, but with the brand's real facts. Direct
  answers high on the page; specifics (numbers, names, dates) over
  adjectives; the phrasing of the prompt itself appearing naturally.
- **An FAQ block** for question-shaped prompts, one crisp answer per
  question.
- **schema.org structured data** (JSON-LD): typically `Hotel`,
  `LocalBusiness`, `TouristDestination`, `FAQPage`, `Product`, `Offer`.
  Emit a complete `<script type="application/ld+json">` block, valid
  JSON, only real values — never invent ratings, prices, or amenities;
  every value must come from the brand's site or the user.

Facts come from the brand's existing website and the user. If a fact you
need is missing (opening hours, capacity, price range), ask; do not
approximate.

**3. Ship it.** Depends on the site access agreed in memory:

- **Repo access** (the site lives in a git repository the agent can
  reach): make the edit on a branch, show the diff, and only
  commit/push/PR after the user approves that diff.
- **CMS or manual**: deliver ready-to-paste content — final copy, plus
  the JSON-LD block and where to put it. Say exactly which page and
  where on it.
- Either way: no publish without an explicit go-ahead on the specific
  draft. "Fix them all" authorizes drafting them all, not shipping.

**4. Report it.** The same day something ships, call
`update_recovery_action` with what was done, in one factual sentence
("Added FAQPage JSON-LD and a 400-word answer section to /spa"). This
flips the action to `measuring` so GeoMaestros starts tracking impact.
Record it in the fix ledger in memory. Never report an action whose fix
did not actually ship.

## Batch requests

"Do this week's fixes" means: pick the top three `not_tracked` actions,
ground and draft all three, present the drafts together with what each
should move, then ship the approved ones one at a time.
