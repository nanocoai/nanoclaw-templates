# Researcher profile

Write this on onboard to `/workspace/agent/memory/profile.md`. Also write
the machine files the morning script reads (see harvest play).

```
# Profile
field:          [e.g. ML theory / NLP / computer vision / math]
arxiv_cats:     [e.g. cs.LG, cs.AI, cs.CL]
seeds:          [3–8 arXiv ids that represent current work]
daily_read_cap: 2
language:       [chat language]
notes:          [methods or claims they care about, in their words]
```

`arxiv_cats` must be real arXiv category codes (`cs.LG`, `math.NT`,
`stat.ML`, …). The morning script concatenates them with `OR`.

Seeds are the positive examples. Liked papers (`+`) are appended as extra
seeds. Disliked papers (`-`) are hard negatives: SKIP unless a seed author
is on the paper.
