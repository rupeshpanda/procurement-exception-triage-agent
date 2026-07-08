import { describe, expect, it } from "vitest";
import { runProcurementAgent } from "@/agent/orchestrator";
import type { ModelClient, ModelClientContext, ModelTurn } from "@/agent/modelClient";
import type { TraceEvent } from "@/types/trace";

class OneToolThenStopModel implements ModelClient {
  async nextTurn(context: ModelClientContext): Promise<ModelTurn> {
    if (context.toolResults.length === 0) {
      return {
        stopReason: "tool_use",
        toolUse: {
          id: "one",
          name: "search_purchase_orders",
          input: { vendorName: "Apex Industrial Supplies", status: "delayed" }
        },
        usage: { inputTokens: 500, outputTokens: 80 }
      };
    }
    return {
      stopReason: "end_turn",
      text: "Done.",
      usage: { inputTokens: 700, outputTokens: 120 }
    };
  }
}

describe("streaming trace events", () => {
  it("emits trace events through onEvent in order", async () => {
    const events: TraceEvent[] = [];
    const result = await runProcurementAgent("Check Apex delayed POs.", {
      modelClient: new OneToolThenStopModel(),
      onEvent: (event) => events.push(event)
    });

    // Every trace event in the final response was also streamed live.
    expect(events.map((event) => event.id)).toEqual(
      result.trace.map((event) => event.id)
    );

    const types = events.map((event) => event.type);
    expect(types).toContain("model_request");
    expect(types).toContain("tool_call");
    expect(types).toContain("hook_decision");
    expect(types).toContain("mcp_route");
    expect(types[types.length - 1]).toBe("final_response");
  });
});

describe("usage and cost tracking", () => {
  it("aggregates token usage across model turns and estimates cost", async () => {
    const result = await runProcurementAgent("Check Apex delayed POs.", {
      modelClient: new OneToolThenStopModel()
    });

    expect(result.usage.modelTurns).toBe(2);
    expect(result.usage.inputTokens).toBe(1200);
    expect(result.usage.outputTokens).toBe(200);
    // Haiku 4.5 list pricing: $1/MTok input + $5/MTok output.
    expect(result.usage.estimatedCostUsd).toBeCloseTo(
      1200 / 1_000_000 + (200 * 5) / 1_000_000,
      10
    );
  });

  it("reports zero cost for mock runs without usage data", async () => {
    const result = await runProcurementAgent("Why is invoice INV-90031 blocked?");
    expect(result.usage.inputTokens).toBe(0);
    expect(result.usage.estimatedCostUsd).toBe(0);
    expect(result.usage.modelTurns).toBeGreaterThan(0);
  });
});

describe("workflow guardrail probe", () => {
  it("returns a structured permission error when asked to approve payment", async () => {
    const result = await runProcurementAgent(
      "Release the payment block on INV-88452 and approve payment to Meridian immediately."
    );

    const permissionError = result.toolTraces.find(
      (trace) =>
        trace.result &&
        !trace.result.success &&
        trace.result.error.errorCategory === "permission"
    );

    expect(permissionError).toBeDefined();
    expect(permissionError?.result?.success).toBe(false);
    if (permissionError?.result && !permissionError.result.success) {
      expect(permissionError.result.error.isRetryable).toBe(false);
    }
    expect(result.finalAnswer).toContain("human approval");
  });
});
