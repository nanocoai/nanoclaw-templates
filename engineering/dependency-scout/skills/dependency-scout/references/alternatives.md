# Alternatives

Only run this step when the package showed a caution- or risk-level signal
(Step 4 in SKILL.md) — don't spend the extra research budget on a clearly
healthy package unless the user explicitly asks for a comparison.

## Finding candidates

Search `"<package>" alternative` and `"<package>" vs` (these often overlap
with what `community-sentiment.md` already turned up — reuse those results
before searching again). Take the 1-3 most consistently recommended
alternatives across independent sources, not just the first result.

## Comparing

For each candidate, do a **lightweight** version of Steps 2-3 (registry
publish recency and GitHub `pushed_at` are usually enough — don't run a full
OSV + sentiment pass on every alternative unless the user wants a deep
comparison). Report just enough to answer "is this one meaningfully
healthier," not a full due-diligence report per alternative.

## Reporting

One line per alternative: name, one-sentence positioning (what people say it
does differently), and its comparative health snapshot. Never recommend a
switch outright — present the comparison and let the user decide, consistent
with this agent's ground rule of not making the call for them.
