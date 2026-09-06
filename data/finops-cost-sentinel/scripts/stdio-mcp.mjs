// Minimal, zero-dependency stdio MCP JSON-RPC server helper.
//
// Deliberately not using @modelcontextprotocol/sdk: a stamped template's
// plugin directory is a plain file copy - no `npm install` (or `pnpm`/`bun`
// equivalent) ever runs against it, so any script here that imports a
// non-builtin package fails with ERR_MODULE_NOT_FOUND at spawn time. This
// mirrors the same choice already made in proxy/src/worker.js, just over
// stdio instead of HTTP. Node built-ins only.
//
// Wire format: one JSON-RPC 2.0 message per line on stdin, one per line on
// stdout for responses. Notifications (no `id`) get no response.

import { createInterface } from "node:readline";

export function runStdioMcpServer({ name, version, tools, callTool }) {
  const rl = createInterface({ input: process.stdin, terminal: false });

  function send(obj) {
    process.stdout.write(`${JSON.stringify(obj)}\n`);
  }

  rl.on("line", async (rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    let req;
    try {
      req = JSON.parse(line);
    } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      return;
    }

    const { method, id, params } = req;

    if (method === "initialize") {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: { tools: {} },
          serverInfo: { name, version },
        },
      });
      return;
    }

    if (method === "notifications/initialized") {
      return;
    }

    if (method === "tools/list") {
      send({ jsonrpc: "2.0", id, result: { tools } });
      return;
    }

    if (method === "tools/call") {
      try {
        const result = await callTool(params?.name, params?.arguments ?? {});
        send({
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] },
        });
      } catch (err) {
        send({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: `Error: ${err.message}` }],
            isError: true,
          },
        });
      }
      return;
    }

    if (id !== undefined && id !== null) {
      send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  });
}
