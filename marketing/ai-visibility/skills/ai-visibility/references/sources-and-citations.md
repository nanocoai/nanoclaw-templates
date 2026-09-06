# Play: work the sources AI engines cite

AI engines do not recommend brands out of thin air; they cite a small
set of domains per category. Being present and well-described on those
domains is often worth more than another page on the brand's own site.

## Map the territory

1. `get_source_map` — the domains AI engines cite in this category,
   with citation counts, which engines cite them, sample URLs, and
   whether the brand is already present on each.
2. `get_evidence` — read actual answers for the prompts that matter and
   note which citation carried the recommendation.

## Read it like an operator

Sort into three buckets:

- **Present and cited**: the brand is on the domain and answers cite
  it. Protect these — check the listing is current (names, numbers,
  photos, description) and flag anything stale.
- **Absent from a heavy hitter**: high citation count, brand not
  present. This is the priority list. For each, tell the user what
  getting listed takes: a free profile, an editorial pitch, a paid
  listing — whatever the domain's own pages say. If it costs money, say
  so and let the user decide; never sign the brand up for anything.
- **Long tail**: low counts. Ignore unless a specific lost prompt cites
  one.

## Act

For each priority domain, produce the asset that gets the brand on it:
the completed profile text, the pitch email, the listing description —
written from real brand facts, ready to submit. Submitting is the
user's call, same approval rule as any publish.

When a source placement ships and a recovery action covers it, report it
via `update_recovery_action` like any other fix.
