#!/usr/bin/env node
// Minimal stdio MCP server exposing one tool: place_alert_call.
//
// Vendored instead of using @getdial/cli's own MCP server because that
// package authenticates from an interactive `dial onboard` session file
// (~/.local/share/dial/auth.v1.json) and Dial's hosted remote MCP server
// requires OAuth 2.1 browser authorization - neither supports the
// headless, env-var-injected credential model NanoClaw templates use.
// This wrapper talks to Dial's plain REST API with a static bearer token
// instead, which does support that model.
//
// NOTE: written from Dial's published API reference (POST /api/v1/calls,
// GET /api/v1/calls/:id). Verify against https://docs.getdial.ai before
// relying on this for the demo - it has not been run against a live
// account yet.
//
// Uses the hand-rolled stdio helper in ./stdio-mcp.mjs, not
// @modelcontextprotocol/sdk - see that file's header comment for why (a
// stamped plugin directory has no node_modules, so any non-builtin import
// fails at spawn time with ERR_MODULE_NOT_FOUND, which is exactly what
// happened here before this fix).

import { runStdioMcpServer } from "./stdio-mcp.mjs";

const DIAL_API_BASE = "https://api.getdial.ai/api/v1";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set - export a real value for testing.`);
  }
  // Deliberately NOT rejecting the literal "placeholder" here. NanoClaw's
  // vault never substitutes stdio env vars before spawn - process.env stays
  // "placeholder" verbatim in production. The real DIAL_API_KEY only shows
  // up on the wire: this script sends `Authorization: Bearer placeholder`
  // to api.getdial.ai, and the vault's egress proxy rewrites that header to
  // the real key by hostname match before the request leaves the container
  // (confirmed against onecli-gateway's own container skill doc: "pass any
  // placeholder value - the proxy replaces it with real credentials at
  // request time"). Rejecting "placeholder" here would make this call fail
  // in every real deployment, which is exactly what it did until this fix.
  return value;
}

async function placeAlertCall(message) {
  const apiKey = requireEnv("DIAL_API_KEY");
  const toNumber = requireEnv("DIAL_ALERT_PHONE_NUMBER");
  const fromNumber = requireEnv("DIAL_FROM_NUMBER");

  const createResp = await fetch(`${DIAL_API_BASE}/calls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      to: toNumber,
      fromNumber,
      outboundInstruction:
        `Read this alert message clearly, then stop: "${message}"`,
      maxCallDurationSeconds: 90,
    }),
  });

  if (!createResp.ok) {
    const body = await createResp.text().catch(() => "");
    throw new Error(
      `Dial call creation failed: ${createResp.status} ${body}`,
    );
  }

  const { call } = await createResp.json();
  const callId = call.id;

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let lastStatus = call.status;
  let transcript = call.transcript ?? null;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const pollResp = await fetch(`${DIAL_API_BASE}/calls/${callId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!pollResp.ok) continue;

    const polled = await pollResp.json();
    lastStatus = polled.call?.status ?? lastStatus;
    transcript = polled.call?.transcript ?? transcript;

    const terminal = ["completed", "failed", "no-answer", "busy"];
    if (terminal.includes(lastStatus) && transcript) break;
    if (terminal.includes(lastStatus) && !transcript) {
      // call ended but transcript can lag a few seconds - keep polling
      // briefly rather than returning immediately.
      continue;
    }
  }

  return {
    outcome: lastStatus,
    transcriptSummary: transcript ?? "(no transcript received within timeout)",
    callId,
  };
}

runStdioMcpServer({
  name: "dial-alert",
  version: "1.0.0",
  tools: [
    {
      name: "place_alert_call",
      description:
        "Places a voice call via Dial to read out a short alert message. " +
        "Use only for critical spend spikes - never for routine digests.",
      inputSchema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description:
              "Short spoken alert (2-3 sentences) - service, $ delta, % deviation.",
          },
        },
        required: ["message"],
      },
    },
  ],
  async callTool(name, args) {
    if (name !== "place_alert_call") {
      throw new Error(`Unknown tool: ${name}`);
    }
    const { message } = args;
    if (!message || typeof message !== "string") {
      throw new Error("`message` is required and must be a string.");
    }
    return placeAlertCall(message);
  },
});
