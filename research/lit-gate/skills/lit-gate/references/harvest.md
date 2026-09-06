# Harvest and triage

## Inputs

- **Scheduled run:** judge only `data.new` ids from the script. Do not
  re-query the category firehose.
- **On demand, one paper:** resolve the id, fetch that record only.
- **On demand, "run harvest now":** you may call the same arXiv query the
  script uses (`search_query=cat:A+OR+cat:B`, `sortBy=submittedDate`,
  `max_results=40`), then diff against `seen.txt` yourself.

Fetch metadata from `https://export.arxiv.org/api/query?id_list=ID`
(comma-separate a small batch). Wait 3 seconds between arXiv calls.
User-Agent: `nanoclaw-lit-gate/1.0`.

## Score each new id

Read title + abstract only. Load profile, seeds, and `ratings.md`.

| Verdict | When |
|---------|------|
| SKIP | Off-cats, incremental vs seeds, hits a `-` hard negative (unless a seed author is on it), or already in `seen.txt` at this id |
| SKIM | Overlaps a seed method/claim/keyword enough for abstract + related-work, not a full read |
| READ | Overlaps **and** adds a dataset, proof, method, or result the seeds do not already cover, and the daily READ cap is not full |
| BLOCKED | Missing abstract, API failure, or you cannot verify the id. Never rounded up |

Score 0–100 is a *display* of that rule, not a second policy. A 90 that
fails the READ rule is still SKIM.

Daily READ cap (default 2): extra READ-worthy items become SKIM. Sort
READ-worthy by seed overlap first.

Quote 1–2 abstract spans that justified the verdict. 3–5 keywords from
the paper's own terms, not yours.

## Output

Chat: `references/card-format.md`. Then persist
`memory/harvest/YYYY-MM-DD.md` and append every judged id to `seen.txt`
(bare id, no `vN`).

Do not list SKIP rows in chat. One line: `skipped N`.
