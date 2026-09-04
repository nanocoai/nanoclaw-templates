// Cost Sentinel AWS bridge - a minimal MCP Streamable HTTP server.
//
// WHY THIS EXISTS: NanoClaw's credential vault works by rewriting the
// Authorization header of outbound HTTPS requests, matched by hostname
// (see nanocoai/nanoclaw src/gateway-providers/onecli.ts). That model
// only supports single-value bearer tokens / API keys. AWS SigV4 signs
// a canonical request with the real secret key before it leaves the
// process - a header-rewriting proxy cannot repair a signature that was
// computed against a placeholder. NanoClaw's mount-security policy also
// blocks mounting ~/.aws into a container by default, closing the other
// obvious workaround.
//
// So this Worker holds the real AWS credentials OUTSIDE the NanoClaw
// container entirely (as Cloudflare Worker secrets), does the SigV4
// signing itself via aws4fetch, and exposes a plain bearer-token-gated
// MCP server to the template. The container's mcp.json only ever needs
// one static token to reach THIS Worker - exactly the shape the vault
// is built for.
//
// STATUS: written directly from the public MCP Streamable HTTP transport
// spec and the AWS Cost Explorer JSON API reference, not the official
// @modelcontextprotocol/sdk server classes (their StreamableHTTPServerTransport
// assumes a Node http.IncomingMessage/ServerResponse pair, which a Workers
// fetch-handler isolate doesn't provide, so hand-rolling the JSON-RPC
// envelope here avoids betting on untested runtime compatibility). This
// has NOT been run against a live NanoClaw agent yet - that is the first
// thing to verify once secrets are set and this is deployed.
//
// Deliberately unimplemented, because nothing in this template needs it:
// - SSE / server-initiated messages (GET returns 405, which the spec
//   allows for servers that don't support the optional stream)
// - Real session persistence (a session id is issued and echoed back,
//   but never enforced - every request is handled statelessly)
// - JSON-RPC batching (deprecated in current MCP protocol revisions)

import { AwsClient } from "aws4fetch";

const CE_ENDPOINT = "https://ce.us-east-1.amazonaws.com/";
const CE_CONTENT_TYPE = "application/x-amz-json-1.1";
const PROTOCOL_VERSION = "2025-06-18";

// --- Tool schemas (kept name-compatible with mcp-aws-cost-explorer so the
// template's existing SKILL.md files don't need to change) ---------------

const TOOLS = [
  {
    name: "get_aws_cost_and_usage",
    description: "Raw daily/monthly cost and usage time series.",
    inputSchema: {
      type: "object",
      properties: {
        start: { type: "string", description: "YYYY-MM-DD" },
        end: { type: "string", description: "YYYY-MM-DD" },
        granularity: { type: "string", enum: ["DAILY", "MONTHLY"], default: "DAILY" },
      },
      required: ["start", "end"],
    },
  },
  {
    name: "get_cost_by_service",
    description: "Cost breakdown grouped by AWS service.",
    inputSchema: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
        granularity: { type: "string", enum: ["DAILY", "MONTHLY"], default: "MONTHLY" },
      },
      required: ["start", "end"],
    },
  },
  {
    name: "get_cost_by_tag",
    description: "Cost breakdown grouped by a cost allocation tag key.",
    inputSchema: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
        tagKey: { type: "string", description: "e.g. Team, Environment, Project" },
      },
      required: ["start", "end", "tagKey"],
    },
  },
  {
    name: "get_cost_forecast",
    description: "Forecasted spend for a future period with a confidence interval.",
    inputSchema: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
        granularity: { type: "string", enum: ["DAILY", "MONTHLY"], default: "MONTHLY" },
      },
      required: ["start", "end"],
    },
  },
  {
    name: "get_cost_anomalies",
    description: "AWS-detected cost anomalies (requires Cost Anomaly Detection monitors to already exist on the account - returns empty otherwise, not an error).",
    inputSchema: {
      type: "object",
      properties: {
        start: { type: "string" },
        end: { type: "string" },
      },
      required: ["start", "end"],
    },
  },
  {
    name: "get_rightsizing_recommendations",
    description: "EC2 rightsizing recommendations (requires Cost Explorer rightsizing opt-in and ~14 days of instance metrics - returns empty otherwise, not an error).",
    inputSchema: {
      type: "object",
      properties: {
        service: { type: "string", default: "AmazonEC2" },
      },
    },
  },
  {
    name: "get_cost_comparison",
    description: "Period-over-period cost comparison, computed here from two get_aws_cost_and_usage calls rather than a native AWS comparison API.",
    inputSchema: {
      type: "object",
      properties: {
        currentStart: { type: "string" },
        currentEnd: { type: "string" },
        priorStart: { type: "string" },
        priorEnd: { type: "string" },
      },
      required: ["currentStart", "currentEnd", "priorStart", "priorEnd"],
    },
  },
];

// --- AWS Cost Explorer calls ----------------------------------------------

async function callCostExplorer(env, operation, body) {
  const aws = new AwsClient({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: "us-east-1", // Cost Explorer is a single-region (us-east-1) API
    service: "ce",
  });

  const resp = await aws.fetch(CE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": CE_CONTENT_TYPE,
      "X-Amz-Target": `AWSInsightsIndexService.${operation}`,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Cost Explorer ${operation} failed (${resp.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function handleToolCall(env, name, args) {
  switch (name) {
    case "get_aws_cost_and_usage":
      return callCostExplorer(env, "GetCostAndUsage", {
        TimePeriod: { Start: args.start, End: args.end },
        Granularity: args.granularity ?? "DAILY",
        Metrics: ["UnblendedCost"],
      });

    case "get_cost_by_service":
      return callCostExplorer(env, "GetCostAndUsage", {
        TimePeriod: { Start: args.start, End: args.end },
        Granularity: args.granularity ?? "MONTHLY",
        Metrics: ["UnblendedCost"],
        GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
      });

    case "get_cost_by_tag":
      return callCostExplorer(env, "GetCostAndUsage", {
        TimePeriod: { Start: args.start, End: args.end },
        Granularity: "MONTHLY",
        Metrics: ["UnblendedCost"],
        GroupBy: [{ Type: "TAG", Key: args.tagKey }],
      });

    case "get_cost_forecast":
      return callCostExplorer(env, "GetCostForecast", {
        TimePeriod: { Start: args.start, End: args.end },
        Granularity: args.granularity ?? "MONTHLY",
        Metric: "UNBLENDED_COST",
      });

    case "get_cost_anomalies":
      try {
        return await callCostExplorer(env, "GetAnomalies", {
          DateInterval: { StartDate: args.start, EndDate: args.end },
        });
      } catch (err) {
        // No monitors configured is an expected, non-fatal state - see
        // anomaly-detective/SKILL.md, which treats this call as
        // corroboration only.
        return { anomalies: [], note: `unavailable: ${err.message}` };
      }

    case "get_rightsizing_recommendations":
      try {
        return await callCostExplorer(env, "GetRightsizingRecommendation", {
          Service: args.service ?? "AmazonEC2",
        });
      } catch (err) {
        return { recommendations: [], note: `unavailable: ${err.message}` };
      }

    case "get_cost_comparison": {
      const [current, prior] = await Promise.all([
        callCostExplorer(env, "GetCostAndUsage", {
          TimePeriod: { Start: args.currentStart, End: args.currentEnd },
          Granularity: "MONTHLY",
          Metrics: ["UnblendedCost"],
          GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
        }),
        callCostExplorer(env, "GetCostAndUsage", {
          TimePeriod: { Start: args.priorStart, End: args.priorEnd },
          Granularity: "MONTHLY",
          Metrics: ["UnblendedCost"],
          GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
        }),
      ]);
      return { current, prior };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// --- Minimal MCP Streamable HTTP JSON-RPC envelope ------------------------

function jsonRpcResult(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleRpc(env, req, sessionId) {
  const { method, id, params } = req;

  if (method === "initialize") {
    return jsonRpcResult(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: "finops-cost-sentinel-aws-bridge", version: "1.0.0" },
    });
  }

  if (method === "notifications/initialized") {
    return null; // notification, no response body
  }

  if (method === "tools/list") {
    return jsonRpcResult(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const { name, arguments: args } = params ?? {};
    try {
      const result = await handleToolCall(env, name, args ?? {});
      return jsonRpcResult(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    } catch (err) {
      return jsonRpcResult(id, {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      });
    }
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}

// Cheap pre-check for the hourly critical-spike-check task's `script:`
// field - NanoClaw caps ungated (no pre-check script) tasks at 4 fires/24h
// specifically to stop wasteful full-agent invocations, and an hourly
// check is 24/day. This route answers {"wakeAgent": bool} directly, with
// no MCP/JSON-RPC envelope and no LLM involved, so the task's script can
// decide cheaply whether to wake the agent at all. Mirrors
// anomaly-detective's critical threshold (see thresholds.md) so the two
// never disagree about what counts as critical.
async function handleCriticalCheck(env) {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now - 3 * 86400_000).toISOString().slice(0, 10);
  const baselineStart = new Date(now - 10 * 86400_000).toISOString().slice(0, 10);

  try {
    const [recent, baseline] = await Promise.all([
      callCostExplorer(env, "GetCostAndUsage", {
        TimePeriod: { Start: start, End: end },
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
      }),
      callCostExplorer(env, "GetCostAndUsage", {
        TimePeriod: { Start: baselineStart, End: start },
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
      }),
    ]);

    const sum = (data) =>
      (data.ResultsByTime ?? []).reduce(
        (acc, day) => acc + parseFloat(day.Total?.UnblendedCost?.Amount ?? "0"),
        0,
      );
    const recentDailyAvg = sum(recent) / Math.max((recent.ResultsByTime ?? []).length, 1);
    const baselineDailyAvg = sum(baseline) / Math.max((baseline.ResultsByTime ?? []).length, 1);
    const delta = recentDailyAvg - baselineDailyAvg;
    const deviationPct = baselineDailyAvg > 0 ? delta / baselineDailyAvg : 0;

    const wakeAgent = deviationPct >= 0.75 && delta >= 50;
    return { wakeAgent, deviationPct, delta };
  } catch (err) {
    // Fail closed: an unreachable AWS call should never itself wake a
    // full agent run - that's a proxy/AWS problem, not a cost spike.
    return { wakeAgent: false, error: err.message };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const auth = request.headers.get("Authorization") ?? "";
    if (auth !== `Bearer ${env.PROXY_AUTH_TOKEN}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (url.pathname === "/critical-check" && request.method === "GET") {
      const result = await handleCriticalCheck(env);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname !== "/") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "GET") {
      // No server-initiated messages needed - SSE stream unsupported.
      return new Response("Method not allowed", { status: 405 });
    }

    if (request.method === "DELETE") {
      // No session state kept, nothing to tear down.
      return new Response(null, { status: 204 });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify(jsonRpcError(null, -32700, "Parse error")), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sessionId = request.headers.get("Mcp-Session-Id") ?? crypto.randomUUID();
    const result = await handleRpc(env, body, sessionId);

    if (result === null) {
      // Notification - accepted, no body.
      return new Response(null, { status: 202 });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Mcp-Session-Id": sessionId,
      },
    });
  },
};
