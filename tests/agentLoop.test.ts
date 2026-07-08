import { describe, expect, it } from "vitest";
import { runProcurementAgent } from "@/agent/orchestrator";
import type { ModelClient, ModelClientContext, ModelTurn } from "@/agent/modelClient";

class EndlessToolModel implements ModelClient {
  async nextTurn(): Promise<ModelTurn> {
    return {
      stopReason: "tool_use",
      toolUse: {
        id: "loop",
        name: "search_purchase_orders",
        input: { vendorName: "Apex Industrial Supplies", status: "delayed" }
      }
    };
  }
}

class TwoToolsThenStopModel implements ModelClient {
  async nextTurn(context: ModelClientContext): Promise<ModelTurn> {
    if (context.toolResults.length === 0) {
      return {
        stopReason: "tool_use",
        toolUse: {
          id: "one",
          name: "search_purchase_orders",
          input: { vendorName: "Apex Industrial Supplies", status: "delayed" }
        }
      };
    }

    if (context.toolResults.length === 1) {
      return {
        stopReason: "tool_use",
        toolUse: {
          id: "two",
          name: "search_invoice_exceptions",
          input: { invoiceNumber: "INV-90031" }
        }
      };
    }

    return { stopReason: "end_turn", text: "Done." };
  }
}

describe("agent loop", () => {
  it("continues for tool_use and stops at end_turn", async () => {
    const result = await runProcurementAgent("Check Apex invoice and PO.", {
      modelClient: new TwoToolsThenStopModel()
    });

    expect(result.finalAnswer).toBe("Done.");
    expect(result.toolTraces.map((trace) => trace.toolName)).toEqual([
      "search_purchase_orders",
      "search_invoice_exceptions"
    ]);
  });

  it("stops after max iterations", async () => {
    const result = await runProcurementAgent("Loop forever.", {
      modelClient: new EndlessToolModel(),
      maxIterations: 2
    });

    expect(result.finalAnswer).toContain("maximum loop iterations");
    expect(result.toolTraces).toHaveLength(2);
  });
});
