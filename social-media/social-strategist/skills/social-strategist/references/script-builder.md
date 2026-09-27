# Script Builder

Turns a topic or an accepted idea into a platform-ready script: a timed beat sheet for video, or
finished slides and text for carousels and posts, in the fixed shape for that platform and format.
**It's a draft the creator films and posts. Never say or imply that it went live.**

## Steps

1. **Ground.** Read the `brand-profile` (voice, posting language, filming setup, off-limits
   topics, goal), `platform-<x>` → what works (hook styles, length, format), and the
   `content-log` for the source idea and scripts already built on this topic (don't repeat an
   angle).

2. **Pick platform and format.** Ask **one** question only when it's really ambiguous ("a video
   about pricing", three video platforms, nothing pointing to one). Otherwise take the platform's
   best-performing format from `platform-<x>`, or its usual format with no data yet.

3. **Build to the length defaults** (2026 limits and common practice, not facts about any
   algorithm; their own data wins when it shows a better length):
   - Shorts 20–60 s (max 3 min) · TikTok 20–60 s · Reels 15–90 s (over 3 min isn't shown to new
     audiences) · YouTube long-form 8–15 min.
   - Instagram carousel 6–10 slides (max 20); caption fold ~125 chars; 3–5 hashtags.
   - LinkedIn text post 800–1,500 chars (max 3,000); fold ~140 chars; 0–3 hashtags.
   - LinkedIn document carousel 8–12 slides; post text 300–800 chars.

   Shots only with setups they have. A fact or stat comes from them or a cited source, otherwise
   it's marked `[VERIFY]`.

4. **Check timings with code**: each beat starts where the last ended, the hook ends by 3 s (30 s
   for long-form), the last beat ends at the stated length.

5. **Save** to the `content-log`:
   `<yyyy-mm-dd> · script · <platform> · <format> · "<title>" · <topic> · <length>`, plus
   `· idea <yyyy-mm-dd>` when it came from a logged idea (mark that idea `scripted`).

## Output

Pick the block for the format. Drop a line only when the format has no such field.

Short video (TikTok, Instagram Reels, YouTube Shorts; for Shorts, "Caption" is the title):

```
🎬 TikTok · "3 pricing mistakes" · ~35s

Hook (0–3s)
  Say: "You're undercharging, here's proof."
  Text: UNDERCHARGING?
  Shot: face cam, close

Beat 1 (3–12s)
  Say: ...
  Text: ... · Shot: screen rec
Beat 2 (12–24s) ...
CTA (30–35s)
  Say: "Follow for part 2"

Caption: ...
Hashtags: #... (5)
Why this shape: your hooks with a number averaged 2.1x views (analysis 2026-09-20)
```

YouTube long-form:

```
🎬 YouTube · "<working title>" · ~10 min
Title options: 1. ... / 2. ... / 3. ...
Thumbnail: <image idea> · text: <≤ 4 words>

Hook (0:00–0:30)
  Say: "..." · Shot: ... · B-roll: ...
Chapter 1 · <name> (0:30–2:40)
  Beats: ... / ... / ... · B-roll: ...
Chapter 2 · <name> (2:40–5:10) ...
CTA (9:30–10:00)
  Say: "..."

Description: <two hook lines>, then 0:00 <hook> · 0:30 <chapter 1> · ...
Why this shape: ...
```

Carousel (Instagram; for a LinkedIn document carousel the header is
`💼 LinkedIn · document carousel`, drop Visual and Hashtags, and Caption becomes
`Post text: <hook ≤ 140 chars> ... (300–800 chars)`):

```
🖼️ Instagram carousel · "<title>" · 8 slides

Slide 1 (cover): <headline, ≤ 8 words> · Visual: ...
Slide 2: <text> · Visual: ...
...
Slide 8 (CTA): <save / share / follow / comment ask>

Caption: <first line ≤ 125 chars> ...
Hashtags: #... (5)
Why this shape: ...
```

LinkedIn text post (the text between the lines is ready to paste):

```
💼 LinkedIn · text post · "<title>" · ~1,100 chars
───
<hook line, ≤ 140 chars>
<second line that earns the "see more">

<body: short paragraphs, one idea each, blank line between>

<closing question or CTA>
───
Why this shape: ...
```

Before sending:

- Hook in the first 3 s (video), 30 s (long-form), or before the fold (post, caption, cover).
- CTA present and fits the goal: leads → comment or DM ask · grow → follow · community →
  question · brand → save or share.
- Timings checked with code; the header length matches the last beat.
- No voice saved yet → write plainly and add "tell me if this doesn't sound like you". Filming
  setup unknown → assume face cam and add "shots assume face cam; tell me how you film".
- Unsourced stats marked `[VERIFY]`.
- "Why this shape" cites `platform-<x>` or an analysis date.
- A long reply splits at a beat, chapter or slide boundary.
