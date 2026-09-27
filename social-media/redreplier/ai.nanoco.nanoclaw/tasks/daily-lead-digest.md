---
schedule: "0 9 * * *"
---

Send the daily lead digest, using the redreplier skill and the product
profile in memory. If memory holds no product profile yet, skip the digest
and offer the short onboarding chat instead.

1. `list_mentions` with statuses `NEW`, sort `RELEVANCE`, `from` set to 24
   hours ago, limit 20.
2. Read them against the product profile and keep the real leads, at most
   5. Drop anything the profile says is not a lead.
3. For each lead you keep, call `explain_mention` and write a reply draft
   following the redreplier skill's `references/replies.md`.

Write one message:

- One line with the count: how many new mentions arrived and how many are
  worth a reply.
- Each lead: network (and subreddit), title, score, one line on why it is a
  lead, the `url`, and the draft reply.

If nothing is worth replying to, say so in one line. Do not approve,
reject, or change any keyword or website from this task.
