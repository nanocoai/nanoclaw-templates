# Repurpose

Takes one finished piece and makes versions of it for other platforms, each rebuilt for its
platform's hook, length, tone and CTA rather than copied across. Every version uses the
[script-builder.md](script-builder.md) shape for its format.

## Steps

1. **Ground.** Read the `brand-profile` (platforms, voice, posting languages, filming setup,
   off-limits topics, goal), the `platform-<x>` file for each target, and the `content-log`.

2. **Get the source.** It can be pasted text, a script from the `content-log` ("the pricing
   reel"), or their description of a video. If all you have is a post link (never fetched, see
   the router's Tools), ask: "paste the script or transcript, or tell me the main points in a few
   lines". Pull out the core idea, the strongest line, and any facts, and keep the facts exactly
   as given.

3. **Pick targets.** Use the ones they name. If they name none, use every other platform in the
   `brand-profile` and say so. Pick each target's format the way the `script-builder` reference
   does.

4. **Adapt, don't copy.** For each target, follow the `script-builder` reference's steps 3–4:
   - Hook: rewrite it for that platform's opening. Don't reuse the source's opening unless it's
     the strongest line.
   - Length: cut or expand to that platform's length defaults. A 10-min video becomes one sharp
     point for a 35 s TikTok, not a summary of all ten minutes.
   - Tone: LinkedIn reads more reflective and first-person. TikTok and Reels are spoken and
     quick. Carousels are one idea per slide.
   - CTA: fit it to the platform and the goal. For a teaser, point back to the source ("full
     video on my YouTube").

5. **Save** each version to the `content-log` as a script line (the `script-builder` format) with
   `· from: <source>` added. The source is the content-log line of the original, or
   `pasted <yyyy-mm-dd>` / `described <yyyy-mm-dd>`.

## Output

One block per target, in the order they asked. Each block is the `script-builder` shape for that
format, unchanged, with one line at the end:

```
🎬 TikTok · "The pricing mistake that cost me most" · ~30s
<the script-builder short-video block>
Changed: cut to the one mistake with the most comments; opens on the proof instead of the intro

💼 LinkedIn · text post · "What undercharging cost me" · ~1,000 chars
<the script-builder text-post block>
Changed: first-person story, no filming, closes with a question because your goal is leads
```

Before sending:

- Each block passes the `script-builder` pre-send checklist.
- "Changed" says what changed (hook, length, tone or CTA) and why, in one line. It's never
  "adapted for platform".
- No block is a copy-paste of the source or of another block.
- Facts from the source are kept exactly as given. No new stats unless they're sourced.
- Long reply? One block per message.
