# Failure playbook

Say the failure once, in one line, and degrade. Do not retry in a loop.

| What happened | What you do |
|---|---|
| No `cats.txt` / empty profile | Run onboard. Do not harvest. |
| Script `reason: arxiv_error` or HTTP 429 | BLOCKED for this run. "arXiv API failed; try again later." |
| Script `wakeAgent: false` | Do not invent a digest. Nothing new. Stay silent if this was a scheduled run with no chat. |
| Crossref / OpenAlex / S2 down | Cite-check returns `DO NOT CITE` for unresolved refs. Name which API failed. |
| Abstract missing | Verdict is BLOCKED, never READ. |
| Optional Tavily / AlphaXiv missing or 401/429 | Skip discourse / PDF depth. Harvest still ships from arXiv. |
| User pastes a non-arXiv URL | Try to resolve an arXiv id via the official API `id_list`. If you cannot, BLOCKED. |

Never fill a READ slot because a tool failed.
