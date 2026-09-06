# Cite-check

When the user asks whether they can cite a paper, or before you would
treat a READ paper's references as real.

1. Resolve the work (arXiv id and/or DOI) via the arXiv API.
2. For each bibliography item you are asked to verify (cap 15 per turn),
   resolve against **live** public APIs:
   - Crossref `https://api.crossref.org/works/{doi}`
   - OpenAlex `https://api.openalex.org/works/doi:{doi}`
   - Semantic Scholar `https://api.semanticscholar.org/graph/v1/paper/ARXIV:{id}?fields=title,year,externalIds`
3. An item that does not resolve is **unresolved**.

Verdict:

- `OK TO CITE` — the paper itself resolves; you were not asked to audit
  its bibliography, or every checked item resolved.
- `DO NOT CITE` — the paper itself does not resolve, or any checked
  reference is unresolved or mismatches title/year.

Unknown stays unknown. A 404 is not "probably fine". Name the API that
failed. Do not guess DOIs.
