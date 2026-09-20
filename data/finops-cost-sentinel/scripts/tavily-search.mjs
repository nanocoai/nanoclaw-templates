#!/usr/bin/env node
// Minimal stdio MCP server exposing one tool: tavily_search.
//
// Vendored instead of using the published `tavily-mcp` npm package for two
// independent reasons:
// 1. A stamped plugin directory has no node_modules (see stdio-mcp.mjs's
//    header), so any script here needs zero non-builtin imports - the
//    published package needs its own dependency tree, which we can't ship.
// 2. tavily-mcp@0.2.22's own package.json declares
//    devEngines.packageManager: pnpm. This container's npm enforces that
//    strictly (EBADDEVENGINES) instead of honoring the package's own
//    onFail: "download" - `npx -y tavily-mcp@latest` fails outright before
//    ever reaching our code. Verified against a live container.
//
// Auth confirmed from tavily-mcp's own source (build/index.js): every
// request carries `Authorization: Bearer <key>` via axios default headers
// to api.tavily.com - a plain bearer header, so this is vault-compatible
// the same way the AWS bridge and Dial are.

import { runStdioMcpServer } from "./stdio-mcp.mjs";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set - export a real value for testing.`);
  }
  // See dial-call.mjs's requireEnv for why "placeholder" is NOT rejected
  // here - the vault rewrites this env var's value on the wire, not before
  // this process reads it.
  return value;
}

async function tavilySearch(query, maxResults) {
  const apiKey = requireEnv("TAVILY_API_KEY");

  const resp = await fetch(TAVILY_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: maxResults ?? 5,
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Tavily search failed (${resp.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

runStdioMcpServer({
  name: "tavily",
  version: "1.0.0",
  tools: [
    {
      name: "tavily_search",
      description:
        "Web search via Tavily. Use to identify an unfamiliar AWS service or " +
        "SKU name and its typical pricing model - never guess.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query." },
          maxResults: { type: "integer", description: "Default 5." },
        },
        required: ["query"],
      },
    },
  ],
  async callTool(name, args) {
    if (name !== "tavily_search") {
      throw new Error(`Unknown tool: ${name}`);
    }
    const { query, maxResults } = args;
    if (!query || typeof query !== "string") {
      throw new Error("`query` is required and must be a string.");
    }
    return tavilySearch(query, maxResults);
  },
});
