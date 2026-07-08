import { describe, expect, it } from "vitest";
import { runProcurementAgent } from "@/agent/orchestrator";
import type { ModelClient, ModelClientContext, ModelTurn } from "@/agent/modelClient";

// Simulates Claude requesting two tools in a single turn (parallel tool use),
// which is what real Haiku does for multi-concern requests.
class ParallelToolsModel implements ModelClient {
  turnsSeen: Array<{ toolResultCount: number }> = [];

  async nextTurn(context: ModelClientContext): Promise<ModelTurn> {
    this.turnsSeen.push({ toolResultCount: context.toolResults.length });

    if (context.toolResults.length === 0) {
      return {
        stopReason: "tool_use",
        toolUses: [
          {
            id: "toolu_parallel_1",
            name: "search_purchase_orders",
            input: { vendorName: "Apex Industrial Supplies", status: "delayed" }
          },
          {
            id: "toolu_parallel_2",
            name: "search_invoice_exceptions",
            input: { invoiceNumber: "INV-90031" }
          }
        ]
      };
    }

    return { stopReason: "end_turn", text: "Both concerns investigated." };
  }
}

describe("parallel tool use", () => {
  it("executes every tool requested in a single turn and answers each tool_use id", async () => {
    const model = new ParallelToolsModel();
    const result = await runProcurementAgent(
      "Check Apex delayed POs and review invoice INV-90031.",
      { modelClient: model }
    );

    expect(result.finalAnswer).toBe("Both concerns investigated.");
    expect(result.toolTraces.map((trace) => trace.toolName)).toEqual([
      "search_purchase_orders",
      "search_invoice_exceptions"
    ]);

    // The second model turn must have received BOTH tool results — an
    // unanswered tool_use block is a 400 from the real Messages API.
    expect(model.turnsSeen).toEqual([
      { toolResultCount: 0 },
      { toolResultCount: 2 }
    ]);
  });
});
