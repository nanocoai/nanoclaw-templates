# Example 1: Cold email to a contractor (illustrative)

Fictional businesses only. No client names.

**Audience / channel:** roofing contractors, cold email

## Before
Subject: Unlock seamless growth for your roofing firm

Hi there,

In today's fast-paced world, it's important to note that we leverage robust systems to elevate your pipeline. We try to, if possible, ideally book three more estimates a week for crews like yours.

We've helped some folks around town (we'd be honored to share more). Pricing starts at $149/mo.

Just checking in — would you maybe want to chat?

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
