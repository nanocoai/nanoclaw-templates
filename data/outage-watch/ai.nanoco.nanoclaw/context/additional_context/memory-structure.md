# Memory structure

Learned/dynamic state lives in `memory/`, built as the agent works — nothing here ships pre-populated.

- `memory/incidents.md` — one open-or-resolved record per service per incident: state, evidence, tier, action taken, timestamps. This is what makes de-duplication and cooldown possible.
- `memory/conventions/vendor-notes.md` — anything vendor-specific worth remembering: a status page that's slow to update, a more-reliable RSS/JSON feed, quirks in how a vendor phrases "degraded."

Static, operator-edited config — the actual list of watched services and how escalation is tiered — lives in `additional_context/services.md` and `additional_context/escalation-policy.md` instead, since those are decisions a human makes, not facts the agent learns.
