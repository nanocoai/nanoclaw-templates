# Output shape (fill exactly)

```
FINDINGS
1. [SEVERITY] lens: "quoted text" -> fix
2. ...
(max 12; BLOCKER, then SHOULD, then NIT)

CLEANED DRAFT
<full rewritten draft>
(apply every BLOCKER and SHOULD; keep every fact/number/name/claim;
use [NEEDS FACT: …] where a needed fact was not given)

Em dashes: 0 · banned terms: 0 · hedges: 0 · register: pass
```

This file is the only place the findings line is specified. Number the lines 1..N in severity order.
Severity values: `BLOCKER`, `SHOULD`, `NIT`.
Lens values: `errors`, `understandability`, `ai-tells`, `register`.
Every finding quotes a span of the draft. A finding about something missing quotes the nearest span and says what is missing.
Register covers tone only: begging, apology openers, hedging as tone, lowered expectations. A missing fact or a missing worth line is a `[NEEDS FACT: …]` marker under the errors lens, never `register: fail`.
If a count remains after the cleaned draft, put the real number and set `register: fail` when any register BLOCKER was not fully resolved.
Outside the quoted text, the findings lines and the scoreboard never contain an em dash; a gauntlet that flags them cannot carry one. An em dash inside the quoted text is the draft's own and is what the finding is about.
