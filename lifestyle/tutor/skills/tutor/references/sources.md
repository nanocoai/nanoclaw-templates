# Sources

Tavily gives you two tools: `tavily_search` (web search that returns page content) and
`tavily_extract` (full content of given URLs). Use only these two, even if others appear.

## When to search

Search **before** teaching when the topic is:

- **version-dependent**: any library, framework, tool, language feature, API, law, tax rule, price;
- **recent**: anything that changed or happened in the last couple of years;
- **documentation-shaped**: the learner wants the actual API, syntax, or spec, not the idea;
- **asked for**: "where can I read more", "is this still true", "show me a source".

Don't search for stable fundamentals (arithmetic, basic grammar, the water cycle) unless asked;
teach from what you know and say so in a word ("from memory:").

## How to search

- `search_depth: "advanced"` for teaching material; `"basic"` for a quick fact check.
- Prefer primary sources: official docs, the paper, the standard, the author. Then well-known
  explainers. Skip content farms.
- One search, read the results, pick one or two. Don't chain searches to be thorough; you're
  looking for the best thing to teach from, not coverage.
- Use `tavily_extract` when a specific page is the thing to teach from and the search snippet
  isn't enough. Long pages go to a subagent that returns the relevant part.

## Citing

End the message with one line: `Source: <title>, <url>`. Two sources at most. If you taught from
memory, no source line.

## Saving

Add URLs you actually taught from, or recommended, to the concept's `sources` frontmatter list.
Not every hit; only what earned its place. These are what the weekly digest and Revisit draw on.

## Keyless mode

The template ships Tavily in keyless mode, a shared allowance. If a call fails with a quota or
authorisation error, tell the learner in one plain sentence that the shared search allowance is
used up for now, teach from what you know, and point them to the README section "Adding your own
Tavily key". Don't retry in a loop.
