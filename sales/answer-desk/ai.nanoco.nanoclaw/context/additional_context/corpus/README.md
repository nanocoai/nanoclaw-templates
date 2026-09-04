# The corpus

This directory is the only thing the answer desk is allowed to cite. It ships
empty on purpose: nothing here is true about your company until you say it is.

## One file per subject

Name files after the subject, lowercase. The desk creates them as it needs
them. Typical set:

```
company.md          what you do, when you incorporated, headcount
security.md         encryption, access control, incident handling
infrastructure.md   providers, regions, backups, retention
compliance.md       reports you hold, reports you do not, audit dates
contracts.md        DPA, SLA, notice periods, liability caps
product.md          what it does, what it does not, integrations
```

## One entry per established question

```markdown
## Where is customer data stored?

AWS eu-west-1, with encrypted backups replicated to eu-central-1. No customer
data leaves the EU.

Recorded 2026-09-04 by Dana.
```

The heading is the question in the plainest form you would be asked it. The
answer is prose, in your own words. The provenance line says when it was
established and who established it, and it is never left off, because a
two-year-old answer needs to look two years old.

## Record the noes

The most useful line in a new corpus is usually a negative:

```markdown
## Do you hold SOC 2 Type II?

No. Type I completed 2026-03-14 by Prescott Assurance. Type II fieldwork
starts 2026-10-01.

Recorded 2026-09-04 by Dana.
```

"No, and here is the detail" is an established answer that gets sent as-is.
Silence is a gap that costs you a conversation every time.

## Contradictions

Keep both. Append the new entry and mark the old one superseded with the
date. The desk will do this for you. Pruning is yours to do, deliberately,
not something an agent does on your behalf.

## What does not belong here

Credentials, API keys, tokens. Personal data about employees or customers.
Anything you have not confirmed. Anything copied off your own website that
nobody has checked.

This file is documentation. The desk never cites it.
