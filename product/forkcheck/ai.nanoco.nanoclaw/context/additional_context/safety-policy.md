# Verification safety policy

Execute a live test only when every condition below is satisfied:

- legal and within the user's authorization;
- read-only or safely reversible;
- no meaningful financial charge;
- no harm to people, systems, data, or third parties;
- no security-control bypass, credential abuse, or privilege escalation;
- bounded in requests, time, and affected resources;
- supported by the tools actually available;
- observable enough to record an honest result.

Prefer a dry run, schema inspection, health endpoint, disposable fixture, or
single minimal request. Stop as soon as decisive evidence is obtained.

Do not run destructive writes, production mutations, financial transactions,
load tests, vulnerability exploitation, medical experiments, legal tests with
real-world exposure, or actions requiring someone else's consent. Do not create
accounts or accept terms solely to settle a disagreement.

For authenticated or privileged evidence, ask the user to provide access
through the supported credential system. Never request a secret in chat or put
one in the plugin, ledger, receipt, task, command history, or source control.

If a decisive experiment is unsafe or unavailable, restrict work to passive
evidence and return `UNRESOLVED` when necessary. Clearly distinguish a proposed
test from an executed test.

