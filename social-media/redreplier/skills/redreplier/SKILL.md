---
name: redreplier
description: Find and triage leads from public conversations on Reddit, Hacker News, X (Twitter), Bluesky and Facebook through RedReplier, which matches the user's keywords and scores every mention 0-100 for relevance. Use this skill WHENEVER the user asks about new mentions or leads, wants the best conversations to reply to, asks why a mention scored high or low, wants a reply drafted for a thread, wants to approve or reject mentions, add or change the websites and keywords RedReplier watches, or set mention email alerts. Trigger it even for short asks like "any new leads?", "what are people saying about us on Reddit", "draft a reply to that HN thread", "add the keyword 'hubspot alternative'" or "stop tracking that keyword".
---

# RedReplier

You work the user's RedReplier account through the `redreplier` MCP server.
Its tools are named `mcp__redreplier__<tool>` and carry their own parameter
descriptions; read them. This skill is the operating logic on top.

If memory holds no product profile yet, run `references/onboarding.md`
first.

| Job | Tools |
|-----|-------|
| Leads | `list_mentions`, `count_mentions`, `explain_mention`, `update_mention_status` |
| Websites | `list_websites`, `get_website`, `create_website`, `update_website`, `delete_website`, `analyze_website` |
| Keywords | `add_keywords`, `edit_keyword`, `disable_keyword`, `enable_keyword`, `delete_keyword` |
| Alerts | `get_alert_settings`, `update_alert_settings` |

## Tools and credentials

The API key is injected by the credential gateway; you never see it. If the
`mcp__redreplier__*` tools are missing, or a call fails with 401 or "not
connected", read `references/credentials.md` and follow it. Never ask for a
raw key in chat.

## Finding leads

1. Call `list_mentions` with `statuses: ["NEW"]` and `sort: "RELEVANCE"`.
   Use `from` for "since yesterday" questions; it filters on when
   RedReplier found the mention, not when it was posted.
2. Read each mention's `title`, `contentText` and `relevanceScore`
   against the product profile. The score is RedReplier's first pass, not
   the verdict.
3. For the few worth acting on, call `explain_mention`. It returns the
   reasoning and a drafted reply (`aiReplySuggestion`), generating them on
   first call. It is slow, so never run it across a whole list.
4. Present the leads (see Output style) and draft replies on request.

Defaults hide rows. REJECTED mentions are left out unless `statuses` names
them, and mentions under the website's minimum score (30 unless changed)
are hidden unless `includeLowRelevance` is true. If the user asks where a
mention went, check both. `minScore` (0-100) narrows further: it keeps
mentions scoring at least that much, drops unscored ones, and does not lift
the website minimum on its own.

## Triage

`update_mention_status` sets APPROVED (a real lead), REJECTED (noise) or NEW
(back to the inbox). It is fully reversible. Triage what the user asks you
to, and never approve a mention you have not read. When the user rejects a
kind of mention more than once, note the pattern in the product profile
under "Not a lead" so you stop surfacing it.

## Drafting replies

Read `references/replies.md` before drafting. RedReplier never posts, and
neither do you: the user posts the reply on the network in their own name.

## Websites and keywords

Each monitored website has a description that every new mention is scored
against, and keywords that decide what gets matched.

- `list_websites` is not a plain read. It also activates pending keywords
  that fit the plan and queues searches. It never charges. Use
  `get_website` to re-read one site you already know.
- Keywords start PENDING and become ACTIVE when the plan has room. The ones
  over the plan's keyword count stay PENDING; tell the user, since only
  they can change the plan in RedReplier. No tool here charges or upgrades.
- A vague description gives vague scores. When scores look wrong across
  the board, draft a better description with `analyze_website` (it spends
  one AI generation from the monthly quota), show it, and save it with
  `update_website` after a "yes". Mentions already scored are not rescored.
- Prefer `disable_keyword` to pause a keyword. `delete_keyword` erases the
  keyword and every mention it produced, and `delete_website` stops all
  monitoring for a site. Confirm both by name first.

Keyword advice lives in `references/keywords.md`.

## Alerts

RedReplier emails a digest of new mentions on a cadence. Call
`get_alert_settings` first and pick from its `availableCadences`.
`update_alert_settings` replaces both settings on every call, so pass the
current cadence when only switching alerts on or off.

## Output style

- Leads: one short block per lead, best first: network (and subreddit),
  title, score, one line on why it is a lead, and the `url`.
- Replies: the draft on its own, ready to paste, then one line on what it
  answers.
- Counts and summaries: the number first, then the breakdown by network or
  keyword.
