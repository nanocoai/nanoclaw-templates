# Scoring methodology

Scoring orders companies that already cleared the filters. It never decides
whether a company is in.

## Arithmetic

1. Score each criterion 0–100 against its `scoring_guidance` anchors.
2. Normalise weights to sum to 100: `w_i / Σw × 100`.
3. Weighted sum: `Σ (score_i × normalised_weight_i) / 100`.
4. Round to a whole number. Report the breakdown, never just the total.

## Using the anchors

`scoring_guidance` gives anchors at 100, 50, and 0. Interpolate between them;
do not invent a fourth anchor. If a company sits between the 50 and the 100
description, it scores 60–90 depending on how much of the 100 description
holds — say which part.

Anchor to the written description, not to the other companies in the batch.
Batch-relative scoring makes runs incomparable and drifts with sample
composition.

## Missing evidence

Per `scoring_settings.missing_data_policy.mode`:

- **neutral** — score 50 and mark confidence low. The default, and correct
  for private companies with thin public footprints: penalising missing data
  ranks by web presence, not by fit.
- **penalize** — score 0 and say so. Only when the evidence should exist and
  its absence is itself informative.
- **exclude** — drop the company. Also sends unresolved hard filters to FAIL
  rather than NEAR MISS.

Always mark a criterion scored under this policy. A 50 from a policy default
is not the same as a 50 you judged, and the brief must not conflate them.

## Do not double-count

A revisitable hard filter and a scored preference must not test the same
fact. The filter sets the band; the preference orders within it. When a
thesis does double-count, say so rather than quietly applying both.

## Confidence

Carry a confidence alongside every criterion score, taken from the evidence
beneath it. A company whose score rests on low-confidence evidence throughout
is a different proposition from one with the same total and high-confidence
evidence — the brief shows both.

Never fold confidence into the score itself. They are separate axes and the
user needs to see both.

**Company confidence is weighted, not worst-case.** The headline confidence is
the criterion confidences averaged by the same weights that produced the score
(high=3, medium=2, low=1; ≥2.5 high, ≥1.5 medium). Taking the single worst
input instead would let one thin minor criterion drag a well-evidenced case to
"low", which is the wrong signal about a company whose case is strong.

The weakest single input is still reported — marked `▾` in the ranked table and
named in that company's breakdown — so a strong average never hides a soft
spot. Both numbers are visible; neither replaces the other.

## Ranking

Rank within a band only. Ties break on confidence, then scale. Flag PASS
entries at or above `minimum_score_for_priority`.
