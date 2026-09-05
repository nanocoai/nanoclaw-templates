# Why the rules exist

This is a plain-language description of the design. It is not legal advice. The employer running Rese is responsible for its own compliance and should have counsel review this before production use.

## Consent before the call

Regulators in the United States treat AI-generated voices as artificial or prerecorded voices under the Telephone Consumer Protection Act, which means the called party must have agreed in advance to receive such a call. Rese records that agreement in one of two ways: the candidate attests that the reference expects a call, or the reference replies in writing to a text. The in-call disclosure and permission question is the second layer, so nobody is ever questioned without agreeing on the call itself. Other jurisdictions have their own rules on automated calling; the disclosure and permission step is universal and runs everywhere.

## Disclosure and transcription

Roughly a dozen US states require every party to agree before a conversation is recorded or transcribed, and similar rules exist in many countries. Rese does not look up the state or country. It discloses transcription on every call and asks for permission before the first question, so behaviour is identical everywhere and always on the safe side.

## No scoring or recommendation

Laws governing automated employment decision tools (New York City Local Law 144, Illinois amendments effective January 2026, Colorado's AI Act) attach obligations to tools that score, rank, or recommend. Rese transcribes and summarises; it does not evaluate. Employers should still mention Rese in any AI-use notice they give candidates. The summary closes with a fixed sentence stating that the decision stays with the hiring team.

## The question filter

Questions about protected characteristics, health, medical leave, workers' compensation, union activity, arrests, or salary history can create discrimination exposure or violate state salary-history bans that also apply when asking a former employer. The filter is applied when a set is created and again in the call script. See `skills/run-reference-check/references/question-filter.md`.

## No web lookups

Searching for a reference or candidate would turn Rese into a background-check tool, which carries Fair Credit Reporting Act obligations and consent requirements of its own. Rese only uses what the recruiter provided and what the reference said.

## Retention

Reference material is sensitive and stale quickly. Records are purged after the retention window by the `retention-purge` task, which starts paused and must be enabled by the operator.

## If the reference is in the EU

The same three behaviours carry the design in the EU, and one of them is now a legal requirement rather than good practice.

- **AI disclosure.** Article 50 of the EU AI Act requires that people interacting with an AI system are told so. It has applied since 2 August 2026 and was not postponed by the Digital Omnibus. Rese's first sentence on every call satisfies it.
- **Recording and transcription.** Germany (section 201 of the Criminal Code) and most member states treat recording a private conversation without the other party's agreement as an offence, and data-protection law needs its own basis for keeping the transcript. That is why the disclosure names the purpose and the retention period before asking permission, and why a "no" ends the call before any question. The announcement is the first thing said on the call, which is the accepted way to handle the seconds before it.
- **No evaluation.** AI systems used to evaluate candidates are high-risk under Annex III of the AI Act. Those obligations were deferred to 2 December 2027, and Rese is designed to stay outside them by transcribing and summarising without scoring, ranking, or recommending. Do not add scoring to this template for EU use.
- **Lawful basis and information.** Employers in the EU usually run reference checks on legitimate interest, with the candidate told in the privacy notice that references are contacted. Include Rese in that notice. The reference learns from the call itself who is processing their words and for how long.
- **Where the audio goes.** Dial processes and records the call. Check Dial's data-processing terms and transfer mechanism before using Rese with EU references, and set a short retention window.

## Own install, own account

Rese runs on the employer's own NanoClaw install with the employer's own Dial account. No third party receives the transcript. A hosted version serving other employers would change this analysis.
