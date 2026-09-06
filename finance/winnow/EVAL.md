# Eval

Winnow is validated against a **real screen** — a live 48-target M&A search for
union commercial and industrial perimeter-security contractors — where the
correct calls were already known, including one the original screen got wrong.

Run it:

```bash
cd scripts && node --test test/eval.test.mjs
```

The runner is generic; every case, name and expectation lives in
`theses/example-fencing.eval.json`. Drop another `*.eval.json` beside a thesis
and it is picked up automatically.

## What this does and does not prove

**Proves:** that given evidence, the pipeline turns it into the right bands,
scores, ranking and coverage — deterministically and repeatably.

**Does not prove:** that the research stage finds the right evidence. That is a
separate question, demonstrated separately by a live run (see *Live runs*
below). The judgments in the eval fixture were transcribed from the source
screen's own evidence, not gathered by a model, precisely so that a failure
here means the *logic* is wrong rather than the search.

Keeping those apart is the point. A single end-to-end number would hide which
half broke.

## Result

```
4 pass · 3 near miss · 1 fail
14/14 eval assertions pass

61 tests across the whole suite; one skips unless an optional
reference YAML package is resolvable, which is expected.
```

| Case | Expected | Why it matters |
|---|---|---|
| **Midwest Fence Corporation** | PASS, priority, union 100 | Known-good rank 1 of 48: confirmed signatory, family-owned since 1947. |
| **Century Fence Company** | PASS, union 100 | Positive roster evidence scores as a confirmed signatory. |
| **Century Fence (absent-evidence variant)** | PASS, union **50**, score ≥ 60 | **The headline assertion.** See below. |
| **Diversified Construction Services** | NEAR MISS | Marked *Tier Out* in the source screen. An unresolved revisitable filter quarantines rather than drops. |
| **Priority Grading & Excavating** | NEAR MISS | Also *Tier Out*: access work only, fence scope unconfirmed. |
| **Residential Only Fence Co** | NEAR MISS | Fails a revisitable filter outright — still scored and reported, not discarded. |
| **Rommel Fence, LLC** | PASS, union 0, not priority | Open-shop. Ranks below signatories but is **not excluded** — union status is scored, never filtered. |
| **PE Platform Fence Holdings** | FAIL, unscored | Firm ownership filter. Dropped before research; never scored, so no score can argue with the filter. |

## The headline assertion

The source screen originally recorded Century Fence as **nonunion**. It was
wrong: the company is Ironworkers-signatory for fence work, and the "nonunion"
call came from a Laborers matter in a different state. Union status is trade-
and state-specific, and absence of evidence in one trade is not evidence of
absence in another.

That is the single most expensive mistake this kind of screen makes, so the
eval runs the same company twice:

| | Union tier | Total | Band |
|---|---|---|---|
| Evidence present | 100 | 78 | PASS |
| Evidence absent | **50** (neutral policy) | **68** | PASS |

Absent evidence costs 10 points and nothing else. It does not score 0, does
not fail a filter, does not leave the shortlist. The gap is exactly the
weight-20 criterion moving from 100 to the neutral default — visible,
attributable, and reversible the moment evidence appears.

A screen that scored the absent case at 0 would have dropped a real target,
and would have looked confident doing it.

## Structural invariants

Asserted on every run, not just this fixture:

- **Ranking is structural.** In this fixture a NEAR MISS scores 58 while a
  PASS scores 52 — the higher-scoring company stays in NEAR MISS, because it
  failed a filter the user wrote down. The test asserts the situation actually
  occurs, so the invariant cannot pass vacuously.
- **Every FAIL is unscored.** The band already decided it; a score would only
  invite arguing with the filter.
- **Every declared segment with no candidates is flagged.** An empty segment
  is a gap in the search, never evidence of an empty market.

## Live runs

Two runs against the real install, driven end to end by the agent:

**Universe building** — a narrow single-state thesis on the keyless Tavily
tier. The full example thesis had recorded that state as returning **zero**
candidates. Search alone surfaced roughly 30, and the adjacency sweep found a
qualifying company trading under a structural-steel name that no fence keyword
reaches. The empty segment was a coverage artifact, exactly as the thesis
predicted — and the run reported the declared registry it could *not* reach as
an open gap rather than quietly falling back to search.

**Screening** — the agent located the plugin, validated the thesis, ran the
script, and reported the brief by quoting it rather than retyping numbers. It
volunteered the coverage reading unprompted: *"Illinois is 67% single-source …
that's the thesis working as designed."*

## Reproducing

```bash
cd scripts && node --test test/*.test.mjs   # 61 tests incl. this eval
node scripts/winnow.mjs screen theses/example-fencing.yaml \
  theses/example-fencing.eval.judgments.json --out /tmp/eval
```

Deterministic: same judgments in, byte-identical brief, CSV and JSON out.
