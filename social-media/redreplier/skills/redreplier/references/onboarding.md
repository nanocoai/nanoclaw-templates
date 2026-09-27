# Onboarding

Run this when memory holds no product profile yet. Five questions at most,
one per message.

## 1. Check the connection

Call `list_websites`.

- If it works and lists a website, name it and its active keywords back to
  the user ("You're watching acme.com for 12 keywords").
- If it fails or the tools are missing, follow `credentials.md`, then come
  back here once they have connected.
- If it works but lists nothing, offer to add their website: ask for the
  URL, draft the description with `analyze_website`, show it, and call
  `create_website` with that description and a few starter keywords from
  `keywords.md` after a "yes".

## 2. Learn what a lead is

Ask, one at a time, skipping anything the website description already
answers:

1. Who buys the product, in one sentence.
2. What a conversation they would love to join looks like. Offer to pull the
   three highest-scoring NEW mentions (`list_mentions`, sort `RELEVANCE`,
   limit 3) and ask which ones are real leads; their answer teaches you
   faster than a description.
3. What is never a lead for them.
4. How they want replies to sound, and the disclosure line they are
   comfortable with.

Save the answers to memory as the product profile. Fill the product
profile section of your standing instructions from it.

## 3. The daily lead digest

The daily digest task ships paused. Tell them in one plain sentence what it
does: "Every morning I send you the best new conversations to reply to, with
a draft for each." Confirm the time, update the task's schedule to match,
and resume it if they say yes. If they decline, leave it paused.
