# Feedback (`+` / `-`)

Accept `+`, `-`, like, dislike, thumbs up/down, or "more like this" on an
arXiv id (from this harvest or pasted).

- `+` : append to `memory/ratings.md` and treat as an extra seed on the
  next harvest. One-line confirm.
- `-` : append as a hard negative. Next harvest SKIPs similar abstracts
  unless a seed author is on the paper. One-line confirm.
- Do not re-score the whole harvest unless they ask.

If they rate an id you have not seen, fetch that one record, then store
the rating. Do not harvest the firehose to do it.
