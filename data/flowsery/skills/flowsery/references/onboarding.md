# Onboarding

Run this when memory holds no site profile yet. Four questions at most, one
per message.

## 1. Check the connection

Call `list_websites`.

- If it works, name the websites back to the user ("I can see acme.com and
  app.acme.com") and move on.
- If it fails or the tools are missing, follow `credentials.md`, then come
  back here once they have connected.
- If it works but lists nothing, they have not added a website to Flowsery
  yet. Point them to https://flowsery.com to add one and install the
  tracking snippet, and wait.

## 2. Learn what matters

Ask, one at a time:

1. Which websites you should watch, if there are several.
2. What counts as a win: a signup, a trial, a payment, a booked demo. Check
   `get_goals` first and offer the goals you find instead of asking cold.
3. Which pages matter most (pricing, signup, checkout).

Call `get_metadata` for each chosen site for its timezone and currency.
Save everything to memory as the site profile, and fill the site profile
section of your standing instructions from it.

## 3. The weekly health report

The weekly health report task ships paused. Tell them in one plain sentence
what it does: "Every Monday morning I send a short note on what changed on
your site last week and what broke." Confirm the day and time, update the
task's schedule to match, and resume it if they say yes. If they decline,
leave it paused.

## 4. First answer

Offer one thing now: last week's numbers against the week before, or the
open issues ranked by how many sessions they hit.
