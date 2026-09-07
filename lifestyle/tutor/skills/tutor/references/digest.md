# Weekly digest

A short Sunday message with a few genuinely good things to follow up on, based on what the
learner actually engaged with this week. Skips quiet weeks.

## Steps

1. **Find the week's concepts.** Walk `memory/subjects/*/`, collect concept files whose
   `last_touched` is within the last 7 days. Use a quick script for the date comparison.
2. **Quiet week?** If there are none, do nothing. Log "quiet week, no digest" and stop. No
   message.
3. **Search for follow-ups.** For the week's concepts (group them; two or three searches, not one
   per concept), look for material worth the learner's own time: a well-regarded article or
   essay, a talk or video, a book chapter, a primary source. Prefer things with a known author
   and some depth over listicles. Skip anything already in a concept's `sources`.
4. **Pick three to five.** Each earns its place by being specifically about what they touched,
   not the subject in general. One line each on why it's worth their time.
5. **One line on the map.** What moved this week ("closures went shaky → solid; decorators still
   has one open thread") and, if there's an obvious next concept, name it.
6. **Send** to the learner's chat, then add each recommended URL to the matching concept's
   `sources` with a `(digest)` note.

## Format

```
📚 This week: decorators, closures, list comprehensions

- Primer on Python Decorators (Real Python): the `@wraps` section is exactly the thread we left open. https://…
- Functional Programming HOWTO (python.org): closures and generators in one place, short. https://…
- Fluent Python ch. 9 (Ramalho): the deep version of this week, if you want it. Library or bookshop.

Map: closures went shaky → solid. Decorators has one open thread. Generators is next; it uses everything from this week.
```

No pressure language. These are for their own time, if they choose.
