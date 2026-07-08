import { runProcurementAgent } from "@/agent/orchestrator";
import { recordSpend } from "@/security/guardrails";
import { applyRequestPolicy } from "@/security/requestPolicy";

export const runtime = "nodejs";

// Server-Sent Events endpoint. Each trace event streams to the browser as it
// happens, so the UI can show the agent loop (model turns, tool calls, hook
// decisions, MCP routing) live instead of waiting for the full run.
export async function POST(request: Request) {
  const policy = await applyRequestPolicy(request);
  if (!policy.ok) {
    return Response.json(
      { error: policy.error },
      {
        status: policy.status,
        headers: policy.retryAfterSeconds
          ? { "retry-after": String(policy.retryAfterSeconds) }
          : undefined
      }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(eventName: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        const result = await runProcurementAgent(policy.message, {
          forceMock: policy.forceMock,
          forceMockReason: policy.forceMockReason,
          onEvent: (event) => send("trace", event)
        });
        recordSpend(result.usage.estimatedCostUsd);
        send("result", result);
      } catch (error) {
        send("error", {
          errorCategory: "transient",
          isRetryable: false,
          message:
            error instanceof Error
              ? error.message
              : "The agent run failed before a final response was produced."
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive"
    }
  });
}
