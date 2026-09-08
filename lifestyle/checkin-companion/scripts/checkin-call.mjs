#!/usr/bin/env node
// Minimal stdio MCP server exposing one tool: place_checkin_call.
//
// Adapted from finops-cost-sentinel's scripts/dial-call.mjs - same auth
// model (Bearer token to api.getdial.ai, vault-injected via the
// "placeholder" convention; see requireEnv below for why "placeholder"
// is NOT rejected here), same hand-rolled stdio-mcp.mjs helper instead of
// @modelcontextprotocol/sdk (a stamped plugin directory has no
// node_modules - see stdio-mcp.mjs's header).
//
// Real difference from Cost Sentinel's dial-call.mjs: there the alert
// destination was fixed at template-stamp time (DIAL_ALERT_PHONE_NUMBER
// env var). Here, WHO gets called varies per check-in session - a user
// might set up check-ins for a date one night and a solo hike the next,
// each with a different emergency contact. So `to` is a call-time tool
// argument, not a fixed env var. Only DIAL_API_KEY and DIAL_FROM_NUMBER
// (the account's own caller-ID number) are fixed per deployment.
//
// NOTE: written from Dial's published API reference, same as Cost
// Sentinel's version. Not yet run against a live account - verify before
// relying on it.

import { runStdioMcpServer } from "./stdio-mcp.mjs";

const DIAL_API_BASE = "https://api.getdial.ai/api/v1";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set - export a real value for testing.`);
  }
  // Deliberately NOT rejecting "placeholder" - the vault rewrites this on
  // the wire, not before this process reads it. See dial-call.mjs in
  // finops-cost-sentinel for the full explanation of why.
  return value;
}

function isValidE164(value) {
  return /^\+[1-9]\d{6,14}$/.test(value);
}

async function placeCheckinCall(to, message) {
  const apiKey = requireEnv("DIAL_API_KEY");
  const fromNumber = requireEnv("DIAL_FROM_NUMBER");

  if (!isValidE164(to)) {
    throw new Error(
      `"to" must be a phone number in E.164 format (e.g. +14155551234), got: ${to}`,
    );
  }

  const createResp = await fetch(`${DIAL_API_BASE}/calls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      to,
      fromNumber,
      outboundInstruction:
        `Read this message clearly, then stop: "${message}"`,
      maxCallDurationSeconds: 90,
    }),
  });

  if (!createResp.ok) {
    const body = await createResp.text().catch(() => "");
    throw new Error(`Dial call creation failed: ${createResp.status} ${body}`);
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
    if (terminal.includes(lastStatus)) break;
  }

  return {
    outcome: lastStatus,
    transcriptSummary: transcript ?? "(no transcript received within timeout)",
    callId,
  };
}

runStdioMcpServer({
  name: "checkin-dial",
  version: "1.0.0",
  tools: [
    {
      name: "place_checkin_call",
      description:
        "Places a voice call to a given phone number to read out a short " +
        "message. Used for check-in confirmation calls (call the user) and " +
        "emergency-contact escalation calls - the destination is always an " +
        "explicit argument, never assumed.",
      inputSchema: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "Destination phone number, E.164 format (e.g. +14155551234).",
          },
          message: {
            type: "string",
            description: "Short spoken message (2-3 sentences) - will be read aloud verbatim.",
          },
        },
        required: ["to", "message"],
      },
    },
  ],
  async callTool(name, args) {
    if (name !== "place_checkin_call") {
      throw new Error(`Unknown tool: ${name}`);
    }
    const { to, message } = args;
    if (!to || typeof to !== "string") {
      throw new Error("`to` is required and must be a string.");
    }
    if (!message || typeof message !== "string") {
      throw new Error("`message` is required and must be a string.");
    }
    return placeCheckinCall(to, message);
  },
});
