import { runProcurementAgent } from "@/agent/orchestrator";
import { recordSpend } from "@/security/guardrails";
import { applyRequestPolicy } from "@/security/requestPolicy";

export const runtime = "nodejs";

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

  try {
    const result = await runProcurementAgent(policy.message, {
      forceMock: policy.forceMock,
      forceMockReason: policy.forceMockReason
    });
    recordSpend(result.usage.estimatedCostUsd);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        error: {
          errorCategory: "transient",
          isRetryable: false,
          message:
            error instanceof Error
              ? error.message
              : "The agent run failed before a final response was produced."
        }
      },
      { status: 500 }
    );
  }
}
