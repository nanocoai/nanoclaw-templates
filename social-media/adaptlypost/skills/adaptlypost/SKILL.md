---
name: adaptlypost
description: Draft, schedule, publish and review social media posts through AdaptlyPost on the Instagram, X (Twitter), Bluesky, Mastodon, TikTok, Threads, LinkedIn, Facebook, Pinterest and YouTube accounts connected to the user's AdaptlyPost workspace, and read their analytics. Use this skill WHENEVER the user wants to write or schedule a post, publish now, plan a content calendar, bulk schedule a batch, attach an image, video or PDF to a post, check whether a post went out, retry a failed network, move or cancel a scheduled post, or asks how posts, followers, views or engagement are doing. Trigger it even for short asks like "post this", "schedule it for Tuesday 9am", "what's queued this week", "why did the Instagram one fail" or "what was our best post last month".
---

# AdaptlyPost

You manage the user's social accounts through the `adaptlypost` MCP server.
Its tools are named `mcp__adaptlypost__<tool>` and carry their own parameter
descriptions; read them. This skill is the operating logic on top.

| Job | Tools |
|-----|-------|
| Find accounts | `list_accounts` |
| Media | `upload_media` (public URLs), `get_upload_urls` (files in the workspace) |
| Write | `create_post`, `update_post`, `bulk_schedule_posts` |
| Go live | `publish_draft`, `retry_failed_platforms` |
| Take back | `unschedule_post`, `delete_post` |
| Check | `get_post`, `list_posts`, `list_post_results` |
| Recurring posts | `create_post` with `recurrence`, then `list_recurring_posts`, `get_recurring_post`, `pause_recurring_post`, `resume_recurring_post`, `delete_recurring_post` |
| Analytics | `get_analytics_overview`, `get_analytics_timeseries`, `get_platform_breakdown`, `list_post_analytics`, `get_analytics_sync_status`, `trigger_analytics_sync` |
| AI captions and images | `generate_caption`, `refine_caption`, `generate_image`, then `get_image_job` until `completed` or `failed` |

If memory holds no brand profile yet, run `references/onboarding.md` before
the first draft.

## Tools and credentials

The API key is injected by the credential gateway; you never see it. If the
`mcp__adaptlypost__*` tools are missing, or a call fails with 401 or
"not connected", read `references/credentials.md` and follow it. Never ask
for a raw key in chat.

## What the key may do

Every call acts as the workspace member who created the key, under the role
chosen for the key:

| Role | Can |
|------|-----|
| Viewer | Read accounts, posts and analytics |
| Contributor | The above, plus upload media, create and edit its own drafts, and generate AI captions and images |
| Editor | The above, plus schedule, publish, retry, bulk schedule, delete, work on other members' posts, and trigger an analytics sync |
| Admin | Everything an Editor can |

A 403 with code `permission_denied` is final for this key. Do not retry it.
For a schedule or publish that was refused, save the post with
`saveAsDraft: true` and tell the user a workspace member has to publish it
from AdaptlyPost. A 401 with `token_issuer_lost_access` means the member who
created the key left the workspace: the key is dead and the user needs a new
one. A 403 with `subscription_required` means the organization's plan does not
include API access or has lapsed; every tool fails the same way until the user
renews it, so tell them and stop.

## The core loop

1. **Accounts.** Call `list_accounts` once per session. Posts take account
   ids, never usernames. Facebook pages go in `pageIds`; every other network
   has its own `<platform>ConnectionIds` array. Skip accounts whose `status`
   is `unauthorized` (posts to them fail with 400) and tell the user to
   reconnect them in AdaptlyPost.
2. **Draft.** Write the text from the brand profile in memory. Respect each
   network's length in characters: X 280, Bluesky 300, Threads 500,
   Mastodon 500, Pinterest 500, Instagram 2,200, TikTok 2,200, LinkedIn
   3,000, YouTube 5,000, Facebook 63,206. Use `platformTexts` when one
   network needs a shorter or different version. Save it with `create_post` and `saveAsDraft: true`; drafts are
   safe and give you a post id to show.
3. **Show and ask.** Show the final text per network, the media, the
   accounts, and the time with its timezone. Wait for "yes".
4. **Go live.** `publish_draft` with no `scheduledAt` publishes now; with a
   future `scheduledAt` it schedules. Content published now reaches the
   networks within moments and cannot be recalled.
5. **Verify.** Publishing is asynchronous. Call `list_post_results` and
   report each network separately until no row is PENDING or PUBLISHING.
   One network can fail while the others succeed.
6. **Fix failures.** Read each `errorMessage` first. Retry with
   `retry_failed_platforms` only after the cause is fixed (a reconnected
   account, replaced media). A platform-side restriction fails again.

For a new post the user has already approved word for word, you can call
`create_post` directly with `scheduledAt` (or without it to publish now)
instead of drafting first.

## Network requirements that fail posts

- **TikTok** needs `tiktokConfigs` with `privacyLevel` for every connection.
  Ask the user; do not default it to public.
- **Pinterest** needs `pinterestConfigs` with a `boardId`. There is no tool
  to list boards, so ask the user for the board id.
- **Instagram, TikTok and YouTube** need media. Instagram and Facebook take
  `postType` FEED, REEL or STORY in their configs; REEL needs a video and
  STORY an image or video.
- **Instagram trial reels**: `instagramConfigs.trialGraduation` (`MANUAL` or
  `SS_PERFORMANCE`) works only for a single video posted as a reel or feed
  video, on an account Instagram has enabled for trial reels.
- **TikTok** cannot be part of a recurring post.
- **LinkedIn documents** (PDF, PPT, PPTX, DOC, DOCX) use `contentType:
  DOCUMENT`, exactly one file, and LinkedIn only.
- **Carousels** use `contentType: CAROUSEL` with several media URLs.
- **Alt text**: `mediaAltTexts` in the same order as `mediaUrls`, one per
  image. See `references/media.md`.

## Media

Media must be stored in AdaptlyPost before a post can use it. Pass public
https URLs to `upload_media`. For a file in the workspace (an attachment the
user sent, an image you rendered), follow `references/media.md`. Uploaded
files are public at once, so only upload media the user supplied or asked
for. Reuse a `publicUrl` across posts instead of uploading twice.

An image from `generate_image` is already stored. The call returns a `jobId`,
not the image: poll `get_image_job` every few seconds until `status` is
`completed` (its public `imageUrl` goes straight into `mediaUrls`) or
`failed` (read `error`). Captions and images spend the key creator's AI
credits (2 per caption, 2 per standard image, 4 per premium one), so
generate only what the user asked for, and stop when credits run out.

## Changing the plan

- **Edit** a DRAFT or SCHEDULED post with `update_post`. Sending `platforms`
  replaces every target, so resend every connection array and config you
  want to keep. Omit `platforms` to change only text or time.
- **Hold back** a scheduled post with `unschedule_post`; it becomes an
  undated draft and nothing is lost.
- **Delete** with `delete_post` only when the user wants the post gone.
  Deleting a published post removes AdaptlyPost's record only; the live
  posts stay on the networks. A post that is PUBLISHING cannot be deleted
  (409).
- **Bulk**: `bulk_schedule_posts` takes up to 100 posts that share the same
  accounts and configs; an item can carry its own platform configs to
  replace the shared ones. It has no draft mode, so show the whole batch as a
  table (time, network text, media) and get one explicit "yes" first. Read
  every result row; one bad item fails alone.

## Recurring posts

Pass `recurrence` to `create_post` (`frequency` DAILY, WEEKLY or MONTHLY,
optional `interval`, `weekdays`, and `endsOn` or `maxOccurrences`) to
repeat a post. It needs a future `scheduledAt` and cannot be a draft. Show
the frequency, first date and end before creating one, and confirm before
`resume_recurring_post`: a series keeps publishing with nobody watching.
`pause_recurring_post` holds it, `delete_recurring_post` stops it for good,
and `delete_post` on one occurrence skips that date. X and LinkedIn reject
identical text, so put spintax such as `{Hi|Hello}` in the text.

## Times

Confirm the user's timezone once and keep it in memory. Convert every
requested time to an absolute ISO 8601 instant for `scheduledAt`; the
`timezone` field is stored for display and does not shift the time. A time
in the past publishes immediately, so check before sending.

## Analytics

Read `references/analytics.md` before answering performance questions. In
short: analytics cover posts published in the window, go back 180 days,
refresh every few hours, and X and Mastodon report nothing. Say which
window your numbers cover.

## Output style

- Drafts: one block per network with its text, then media and time.
- Status: a small table, network by network, with the error message for
  any failure and what to do about it.
- Reports: the headline number and one recommendation first, then detail.
- Link published posts with their `postUrl` from `get_post`. Show media from
  `previewUrls`, not `mediaUrls`; platform links expire within days.
