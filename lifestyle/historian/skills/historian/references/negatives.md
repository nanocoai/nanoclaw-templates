# Negatives need controls

"We found no record of X" is a strong statement. Families act on it. They
stop looking. So a negative is only recorded when you can show the
instrument works.

## The rule

A not-found is recorded as a claim with `status: unproven` **only** if:

1. You ran the search on a specific site or index.
2. You ran a **control query** on the same site or index for something you
   know is there, and it returned results.
3. Both queries are quoted in the claim.

If the control also returns nothing, the site is down, the index is not
online, or the search does not work the way you think. That is not a
negative. It is an open question with kind `not_indexed_yet` or `other`.

## What a control is

A control is a **different query on the same index** that must return rows
if the instrument is working. It has its own URL and its own result count.

Not a control: loading the same page again; noting that "other surnames
read cleanly" on the page you already had; a query on a different site; a
query with the same terms and a wider window. The verifier opens the control
URL. If it is the same URL as the search, the negative is killed.

- On a cemetery index, search a common surname for that cemetery.
- On a manifest index, search a name you already found on that manifest.
- On a newspaper archive, search the town name in the year of the event.

Pick a control that is close to your real query in shape: same index, same
kind of field, same era. A control on a different site proves nothing.

## The claim

```markdown
---
id: hinda-rosner-004
subject: hinda-rosner
statement: "No arrival record for Hinda or Helen Rosner was found in the online index of a national arrivals register for 1947–1949."
status: unproven
verified_by: record
operator_only: false
sources:
  - kind: record
    url: "https://example.org/arrivals/search?q=rosner+1947"
    quote: "0 results"
    accessed: "2026-09-05"
    note: "query: rosner 1947, rozner 1947, roszner 1947, helen rosner 1948, hinda rosner 1949"
  - kind: record
    url: "https://example.org/arrivals/search?q=katz+1948"
    quote: "312 results"
    accessed: "2026-09-05"
    note: "control: katz 1948 (a common surname on this register)"
---

Notes: the index covers 1947–1949 only. Arrival before 1947 would not be here.
```

Note the statement names the scope. Not "she never arrived". Only "not in
this index, for these years, under these spellings."

For a negative, the index's search page **is** the durable page. Cite the
search URL; that is the evidence. This is the one place a search URL is the
right `url`.

## A told claim the records cannot reach

A family may tell you something about a named person that no document
supports: "he was a secret agent", "she sang for the king". You search.
You find a book that claims it, reviews that doubt it, news pieces that
repeat it, and no record. That is not `candidate` (nothing supports it) and
it is not a guess (you looked). It is **`unproven`**, and the control is
natural: the same indexes returned records for this person on other facts
(a birth, a death, an address), so the instrument works and this fact is
not in it.

Write the claim with the queries as the search record, the pointers in the
note (never in `sources`), the control stated as "the same indexes return
records for <person> on <other fact>", and an open question naming the
archive a human would need (a private diary, a closed intelligence file).
The family hears "we looked, and it is not there", which is different from
"we did not look", and they can decide whether the wall is worth climbing.

## Reasons a negative is often wrong

- The spelling is different in the record. Search every variant.
- The window is wrong. Widen it before you conclude.
- The index does not cover the years you need. Read the index's coverage note
  and quote it.
- The search only matches exact strings. Try the surname alone.
- The person is there under a companion's name (a child under a parent, a
  wife under a husband).

Run through this list before you write `unproven`.

## Never

- Never write "no record exists". You searched one index. Say which one.
- Never let a negative close a line of inquiry in `index.md`. Write it as
  "not in <index>; other indexes untried".
- Never promote a negative to a fact in a summary. `unproven` is not `false`.
