---
schedule: "0 10 * * *"
---

# Daily Post Check

No `brand-profile` yet, or Core Memory says `Buffer: declined` or `Buffer: disconnected`: post
nothing.

Otherwise pull what the creator published since the last run from Buffer, log it, and refresh
the numbers of posts still collecting. Sync, collecting and topic tag are as defined in the
`social-strategist` skill.

## Steps

1. **Ground.** Read the `brand-profile` (platforms, `topics`, `last sync`) and the `post-log`.
   The window is the sync window.

2. **Channels.** List their Buffer channels. A channel new since the profile was written: add it to the
   platforms. One no longer in Buffer: keep its history, drop it from the platforms.

3. **Posts.** Fetch the window from each channel, the way the skill's Tools → Buffer says.

4. **Normalize with code**, one row per post: date and time it went out (in the Buffer
   account's timezone), weekday, first line, format (from the post type and media: text, image,
   carousel, video, reel, short, story), duration when given, Buffer post id, and each metric by
   Buffer's name.

5. **Tag new posts**: topic tag from the text, hook style from the first line (`number` ·
   `question` · `how-to` · `story` · `contrarian` · `statement`). No text to tag from: leave it
   untagged.

6. **Save** each post to the `post-log` in the line format of
   `additional_context/memory-structure.md`, and set `last sync <yyyy-mm-dd>` in the
   `brand-profile`.

## Output

Post to the creator's chat, only when there are new posts:

```
👀 New since yesterday
- LinkedIn · "You're undercharging, here's proof." · tagged pricing
- TikTok · "I tried 3 invoicing apps" · tagged tools

Numbers fill in over the next few days; I'll use them once they settle.
```

One line per new post: platform · first line (~40 chars), or the format when there's no text ·
`tagged <topic>`, or `untagged`. No new posts: post nothing, even if numbers were refreshed.

A Buffer 401: record it as the last paragraph of the `credentials` reference says, and post one
line, "Buffer stopped answering, say "reconnect Buffer" and I'll send you the link." A 429: the
`credentials` reference's 429 row, but post nothing.
