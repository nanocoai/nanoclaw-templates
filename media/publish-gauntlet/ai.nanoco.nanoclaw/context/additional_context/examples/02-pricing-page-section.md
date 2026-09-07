# Example 2: Pricing page section (illustrative)

Fictional businesses only. No client names.

**Audience / channel:** homeowners comparing lawn care plans, website pricing section

## Before
Our plans are seamless, robust, and designed to unlock curb appeal. We leverage seasonal expertise to elevate your lawn.

Starter — $79/mo
Growth — $129/mo
Legacy — $199/mo

It's important to note that results may vary. We try to, if possible, ideally visit weekly.

FINDINGS
1. [BLOCKER] ai-tells: "Our plans are seamless, robust, and designed to unlock curb appeal. We leverage seasonal expertise to elevate your lawn." -> drop the banned terms and the triad; keep curb appeal, seasonal expertise, and lawn
2. [BLOCKER] ai-tells: "Starter — $79/mo" / "Growth — $129/mo" / "Legacy — $199/mo" -> rewrite each with a comma; keep the plan names and the prices
3. [BLOCKER] ai-tells: "It's important to note that results may vary. We try to, if possible, ideally visit weekly." -> delete the throat-clearing and the hedge stack; state the given weekly cadence
4. [SHOULD] errors: "Starter — $79/mo" -> price with no worth line; add [NEEDS FACT: what that plan includes] beside every plan
5. [SHOULD] errors: "We try to, if possible, ideally visit weekly." -> the section ends with no next step; add [NEEDS FACT: next step] and do not invent a CTA
6. [SHOULD] understandability: "Growth — $129/mo" -> the plan names never say what the homeowner gets; the [NEEDS FACT: what that plan includes] marker covers it, and do not invent inclusions
7. [NIT] errors: "results may vary" -> undercuts the offer with no measurable claim; remove it or replace it with [NEEDS FACT: a dated proof line]

CLEANED DRAFT
Our plans are designed for curb appeal. Seasonal expertise for your lawn.

Starter, $79/mo. [NEEDS FACT: what Starter includes]
Growth, $129/mo. [NEEDS FACT: what Growth includes]
Legacy, $199/mo. [NEEDS FACT: what Legacy includes]

We visit weekly.
[NEEDS FACT: a dated proof line]
[NEEDS FACT: next step]

Em dashes: 0 · banned terms: 0 · hedges: 0 · register: pass
