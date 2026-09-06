# Card format

Phone-sized. No JSON, no XML, no tables in chat (tables go in the harvest
file).

```
Today: 40 new in cs.LG ∨ cs.AI. 2 READ · 3 SKIM · 35 SKIP.

READ
1. 2609.01234  score 91
   Title of the paper
   why: «quoted abstract span that matched a seed»
   keywords: foo, bar, baz
   https://arxiv.org/abs/2609.01234
   + / − to train me

SKIM
2. …

skipped 35 · ledger: memory/harvest/YYYY-MM-DD.md
```

On a single-paper triage, omit the harvest header; one card is enough.

For SKIM and READ only, you may add four short bullets after `why:` —
Problem / Method / Results / one-line Summary — each one line. Never add
those bullets on SKIP.

If an optional MCP is connected and you used it, one trailing line:
`depth: alphaxiv` or `depth: tavily`. If you did not use it, say nothing.
