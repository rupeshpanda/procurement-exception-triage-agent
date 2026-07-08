import { describe, expect, it } from "vitest";
import { listToolsForServer } from "@/mcp/mcpServerRegistry";
import {
  createProcurementFollowup,
  escalateProcurementIssue
} from "@/tools/procurementWorkflowTools";

describe("Procurement Workflow MCP tools", () => {
  it("exposes workflow tools separately", () => {
    expect(listToolsForServer("procurement-workflow").map((tool) => tool.name)).toEqual([
      "create_procurement_followup",
      "escalate_procurement_issue"
    ]);
  });

  it("creates a follow-up task", () => {
    const result = createProcurementFollowup({
      title: "Review INV-90032",
      description: "Review quantity variance with buyer.",
      vendorName: "Apex Industrial Supplies",
      relatedInvoiceNumber: "INV-90032",
      dueDate: "2026-07-09",
      priority: "high"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("created");
      expect(result.data.taskId).toMatch(/^TASK-/);
    }
  });

  it("rejects unsafe approval or release language", () => {
    const result = createProcurementFollowup({
      title: "Approve and release payment for INV-90031",
      description: "Approve invoice and release payment.",
      relatedInvoiceNumber: "INV-90031",
      dueDate: "2026-07-09",
      priority: "urgent"
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errorCategory).toBe("permission");
    }
  });

  it("creates a pending-review escalation", () => {
    const result = escalateProcurementIssue({
      reason: "Amount exceeds approval threshold.",
      riskLevel: "high",
      amount: 42000,
      vendorName: "Apex Industrial Supplies",
      relatedInvoiceNumber: "INV-90031",
      summary: "Missing goods receipt for high-value invoice.",
      recommendedAction: "Manager review required before payment action."
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("pending_review");
    }
  });
});
