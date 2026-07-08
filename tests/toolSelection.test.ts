import { describe, expect, it } from "vitest";
import { runProcurementAgent } from "@/agent/orchestrator";

describe("similar tool selection", () => {
  it("uses purchase order search for delayed POs", async () => {
    const result = await runProcurementAgent(
      "Check delayed POs for Apex Industrial Supplies."
    );

    expect(result.toolTraces.map((trace) => trace.toolName)).toEqual([
      "search_purchase_orders"
    ]);
  });

  it("uses invoice exception search for blocked invoice questions", async () => {
    const result = await runProcurementAgent("Why is invoice INV-90031 blocked?");

    expect(result.toolTraces.map((trace) => trace.toolName)).toEqual([
      "search_invoice_exceptions"
    ]);
  });

  it("uses both tools when the request asks for invoice and related PO", async () => {
    const result = await runProcurementAgent(
      "Check the status of the Apex invoice and related PO."
    );

    expect(result.toolTraces.map((trace) => trace.toolName)).toEqual([
      "search_purchase_orders",
      "search_invoice_exceptions"
    ]);
  });
});
