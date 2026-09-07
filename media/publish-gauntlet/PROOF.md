# Live run: publish-gauntlet, 2026-09-04 02:54 to 02:55 CT

Stamped on a real NanoClaw install (group "Publish Gauntlet", model grok-4.6). The draft was injected with the NanoClaw CLI (`ncl messaging-groups send`) and the reply was read from `ncl sessions history`. Injected 02:54:31, reply logged 02:55.

## Sent

```
Audience: owner of a 6-person roofing company, cold email, first touch. Run the gauntlet on this draft:

Subject: Unlock seamless growth for your roofing firm
Hi there,
In today's fast-paced world, it's important to note that we leverage robust systems to elevate your pipeline. We try to, if possible, ideally book three more estimates a week for crews like yours.
We've helped some folks around town (we'd be honored to share more). Pricing starts at $149/mo.
Just checking in — would you maybe want to chat?
```

## Reply (verbatim)

```
FINDINGS
1. [BLOCKER] ai-tells — "Unlock seamless growth" → drop banned terms; name the outcome already in the draft (three more estimates a week)
2. [BLOCKER] ai-tells — "In today's fast-paced world, it's important to note" → delete the stock opener; start with the offer
3. [BLOCKER] ai-tells — "leverage robust systems to elevate" → drop banned terms; keep "systems" and mark [NEEDS FACT: what the systems do]
4. [BLOCKER] ai-tells — "try to, if possible, ideally" → state the given target as a clear claim; do not hedge it
5. [BLOCKER] ai-tells — "Just checking in — would you maybe want to chat?" → drop the em dash and the maybe-ask; one clear next step
6. [BLOCKER] register — "we'd be honored" / "Just checking in" / "would you maybe want to chat?" → confident ask; no begging, no apology opener
7. [BLOCKER] register — "Pricing starts at $149/mo." → keep the price; add [NEEDS FACT: what $149/mo includes, or what a missed estimate costs]
8. [SHOULD] errors — "We've helped some folks around town" → vague proof; keep the claim and mark [NEEDS FACT: install or lead count]
9. [SHOULD] understandability — subject and body never name the product → mark [NEEDS FACT: product name]; do not invent one
10. [SHOULD] understandability — "elevate your pipeline" → say estimates or jobs, the words this owner uses
11. [NIT] understandability — "roofing firm" → "roofing company" or "crews" to match a 6-person shop

CLEANED DRAFT
Subject: Three more estimates a week for roofing crews

Hi,

Target: book three more estimates a week for crews like yours.

[NEEDS FACT: product name and what the systems do]

We've helped some folks around town. [NEEDS FACT: install or lead count]

Pricing starts at $149/mo.
[NEEDS FACT: what $149/mo includes, or what a missed estimate costs]

Want to chat?

Em dashes: 0 · banned terms: 0 · hedges: 0 · register: fail
```

## What it proves

Eleven ranked findings in severity order. The cleaned draft removes every banned term, hedge, and em dash, and marks each missing fact instead of inventing one.

Two lines in this run do not meet the rules as they now stand. Finding 9 names a gap without quoting a span of the draft; every finding must quote one. The scoreboard reads `register: fail` because a price arrived with no worth line, and register now covers tone only, so that run should have read `register: pass` with the `[NEEDS FACT: …]` markers carrying the gap. Both rules are written once each, in `additional_context/output-shape.md` and `additional_context/register.md`.

## What it exposed

The prescribed findings-line format carried an em dash as its separator, so a gauntlet that flags em dashes was producing them. Round 3 changes the separator to a colon.

## Format note (round 3)

This live run predates the findings-line format change. The block above is the reply verbatim, separator and all. The findings lines below are the same content re-rendered in the current format: numbered, `[SEVERITY] lens: "quoted text" -> fix`. The cleaned draft and the scoreboard are unchanged, including the `register: fail` this run produced.

```
FINDINGS
1. [BLOCKER] ai-tells: "Unlock seamless growth" -> drop banned terms; name the outcome already in the draft (three more estimates a week)
2. [BLOCKER] ai-tells: "In today's fast-paced world, it's important to note" -> delete the stock opener; start with the offer
3. [BLOCKER] ai-tells: "leverage robust systems to elevate" -> drop banned terms; keep "systems" and mark [NEEDS FACT: what the systems do]
4. [BLOCKER] ai-tells: "try to, if possible, ideally" -> state the given target as a clear claim; do not hedge it
5. [BLOCKER] ai-tells: "Just checking in — would you maybe want to chat?" -> drop the em dash and the maybe-ask; one clear next step
6. [BLOCKER] register: "we'd be honored" / "Just checking in" / "would you maybe want to chat?" -> confident ask; no begging, no apology opener
7. [BLOCKER] register: "Pricing starts at $149/mo." -> keep the price; add [NEEDS FACT: what $149/mo includes, or what a missed estimate costs]
8. [SHOULD] errors: "We've helped some folks around town" -> vague proof; keep the claim and mark [NEEDS FACT: install or lead count]
9. [SHOULD] understandability: subject and body never name the product -> mark [NEEDS FACT: product name]; do not invent one
10. [SHOULD] understandability: "elevate your pipeline" -> say estimates or jobs, the words this owner uses
11. [NIT] understandability: "roofing firm" -> "roofing company" or "crews" to match a 6-person shop

CLEANED DRAFT
Subject: Three more estimates a week for roofing crews

Hi,

Target: book three more estimates a week for crews like yours.

[NEEDS FACT: product name and what the systems do]

We've helped some folks around town. [NEEDS FACT: install or lead count]

Pricing starts at $149/mo.
[NEEDS FACT: what $149/mo includes, or what a missed estimate costs]

Want to chat?

Em dashes: 0 · banned terms: 0 · hedges: 0 · register: fail
```

## This run and worked example 01

`additional_context/examples/01-cold-email-contractor.md` starts from the same draft. The two are different artifacts and are not identical. The example is the gold standard the template teaches; this run is what the model produced on 2026-09-04.

Where this run was stronger, the example now follows it: the `elevate your pipeline` and `roofing firm` findings are folded in, and the hedge finding sits ahead of the CTA finding in both. Three differences remain, and the example is right on each. It quotes a span on the product-name finding instead of naming an absence. It codes the missing worth line under `errors` and scores `register: pass`, because register is tone. Its cleaned draft drops the `Target:` label this run invented as scaffolding, and it ends on a firm next step instead of `Want to chat?`.

## Run 2: the final template on a fresh thread (2026-09-04 03:41 CT)

Same draft, same install, stamped from the tip that carries the one findings-line specification. Injected through the NanoClaw CLI into a fresh messaging group at 03:41:03; reply at 03:41:25.

A second run in the original thread minutes after the restamp had come back in the old format even though the group folder carried the new specification: the thread held the model's earlier reply and it copied that shape over the updated instructions. Session memory outranks the specification until the thread is fresh. Any template that changes its output format after threads exist should expect that.

```
FINDINGS
1. [BLOCKER] ai-tells: "Unlock seamless growth" -> drop banned terms; name the outcome already in the draft (three more estimates a week)
2. [BLOCKER] ai-tells: "In today's fast-paced world, it's important to note" -> delete the stock opener; start with the offer
3. [BLOCKER] ai-tells: "leverage robust systems to elevate" -> drop banned terms; keep "systems" and mark [NEEDS FACT: what the systems do]
4. [BLOCKER] ai-tells: "try to, if possible, ideally" -> state the given target as a clear claim; do not hedge it
5. [BLOCKER] ai-tells: "Just checking in — would you maybe want to chat?" -> drop the em dash and the maybe-ask; one clear next step
6. [BLOCKER] register: "we'd be honored" / "Just checking in" / "would you maybe want to chat?" -> confident ask; no begging, no apology opener
7. [SHOULD] errors: "Pricing starts at $149/mo." -> price with no worth line; keep the price and add [NEEDS FACT: what $149/mo includes, or what a missed estimate costs]
8. [SHOULD] errors: "We've helped some folks around town" -> vague proof; keep the claim and mark [NEEDS FACT: install or lead count]
9. [SHOULD] understandability: "Unlock seamless growth for your roofing firm" -> subject and body never name the product; mark [NEEDS FACT: product name] and do not invent one
10. [SHOULD] understandability: "elevate your pipeline" -> say estimates or jobs, the words a contractor uses
11. [NIT] understandability: "roofing firm" -> "roofing company" or "crews", how the shop talks about itself

CLEANED DRAFT
Subject: Three more estimates a week for roofing crews

Hi,

We book three more estimates a week for crews like yours.

[NEEDS FACT: product name and what the systems do]

We've helped some folks around town. [NEEDS FACT: install or lead count]

Pricing starts at $149/mo.
[NEEDS FACT: what $149/mo includes, or what a missed estimate costs]

Reply to this email.

Em dashes: 0 · banned terms: 0 · hedges: 0 · register: pass
```

Eleven findings in the one prescribed format, severity order kept, every finding quoting a span, the worth-line gap filed under errors, register scored on tone alone and passing, a firm next step in the cleaned draft, the same facts kept and the same gaps marked. The only em dash in the reply is the one it quotes from the draft, which is the finding.
