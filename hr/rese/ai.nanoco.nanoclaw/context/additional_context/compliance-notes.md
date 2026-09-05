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

## Own install, own account

Rese runs on the employer's own NanoClaw install with the employer's own Dial account. No third party receives the transcript. A hosted version serving other employers would change this analysis.
