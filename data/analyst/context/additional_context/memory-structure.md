# Memory structure for this role

Where this role's learned material lives. Everything else about how your memory works stays as
your memory system defines it. Create any of these that are not there yet, keep them current as
you work, and link them from the Map in `memory/index.md`. The skills and tasks refer to these
paths, so keep the names exact.

## `memory/principal.md`: who you serve

Name, role, which platforms and pipelines they own, timezone, and where the line sits between what
you handle yourself and what comes back to them.

## `memory/conventions/metrics.md`: the agreed definitions

One entry per metric used anywhere in reporting: numerator, denominator, window, grain, source,
where it is computed, and the date it was agreed. When two reports are found disagreeing about the
same number, the cause goes here too, because the same pair will disagree again after the next
change.

Computing a metric in two places is the root of most reporting disagreements, so this file records
where each one lives, not only what it means.

## `memory/conventions/pipelines.md`: the scheduled data work

One entry per scheduled job, including the daily reshaping script: what it reads and writes, when
it runs, what a normal output volume looks like per audience, whether it is safe to rerun, and which
reports depend on it. Plus every failure and its cause.

This is what the morning check measures against. A job with no normal volume recorded can only be
checked for whether it errored, which is the weakest possible check, and a new audience with no
baseline cannot be checked at all.

## `memory/conventions/audiences.md`: reporting per audience

One entry per reporting audience — an external client, a business unit, a region, an executive
team: which reports they get and who reads each, their scoping rule if they must only see their
own slice, the pipeline jobs that include them, and which numbers were validated against what on
their side. Written when their reporting is set up and corrected whenever their shape changes.

## `memory/conventions/systems.md`: schemas and what reads them

One entry per database, collection, service and integration: what it holds, its grain, and what
each ambiguous field actually means once somebody has settled it. Critically, what reads each
table from outside the application, meaning the reporting scripts, the scheduled jobs and the
integrations. Those are the readers that break silently when a shape changes.

## `memory/queries/`: the queries worth keeping

Saved SQL and MongoDB queries, each with the question it answers and the date. A one off pull is
never a one off, and the second request always arrives after the chat message has scrolled away.

## `memory/prompts/`: the assistant, version by version

Each version of the assistant prompt, its date, the failure cases it was meant to fix, and what
happened after. The collected failure cases live here too, since they are the test set, and a test
set grown from real failures is worth more than one written in advance.

## `memory/tasks/`: the running list

Every request and commitment, with what, owner, source, due date and status. Several arrive in
chats rather than in a tracker, so the link back to the original message matters.

## `sources/`: the raw record

Schema exports, query outputs, error dumps and uploaded documents live in `sources/`, next to
`memory/`. Never edit or delete what is there. Keep credentials and personal data out of anything
you write from them.
