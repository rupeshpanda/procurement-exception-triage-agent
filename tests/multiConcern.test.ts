import { describe, expect, it } from "vitest";
import { runProcurementAgent } from "@/agent/orchestrator";

describe("multi-concern request", () => {
  it("coordinates PO, invoice, vendor history, follow-up, and escalation tools", async () => {
    const result = await runProcurementAgent(
      "Check Apex delayed POs, review invoice INV-90031, check vendor history, create a follow-up for tomorrow, and escalate anything above $25,000."
    );

    expect(result.toolTraces.map((trace) => trace.toolName)).toEqual([
      "search_purchase_orders",
      "search_invoice_exceptions",
      "search_vendor_history",
      "create_procurement_followup",
      "escalate_procurement_issue"
    ]);
    expect(result.finalAnswer).toContain("Procurement triage complete");
  });
});
