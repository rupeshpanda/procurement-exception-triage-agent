import { describe, expect, it } from "vitest";
import { beforeToolExecutionHook } from "@/hooks/beforeToolExecutionHook";

describe("beforeToolExecutionHook", () => {
  it("allows read-only lookups even when high-value amounts are mentioned", () => {
    const decision = beforeToolExecutionHook({
      toolName: "search_invoice_exceptions",
      toolInput: { invoiceNumber: "INV-90031" },
      originalUserRequest: "Review the $42,000 invoice."
    });

    expect(decision.allowed).toBe(true);
  });

  it("blocks workflow actions above the approval threshold before MCP execution", () => {
    const decision = beforeToolExecutionHook({
      toolName: "create_procurement_followup",
      toolInput: {
        title: "Review Apex invoice",
        description: "Approve the $42,000 Apex invoice.",
        dueDate: "2026-07-09",
        priority: "urgent"
      },
      originalUserRequest: "Create a follow-up to approve the $42,000 Apex invoice."
    });

    expect(decision.allowed).toBe(false);
    if (!decision.allowed) {
      expect(decision.redirectedToolName).toBe("escalate_procurement_issue");
      expect(decision.detectedAmount).toBe(42000);
    }
  });
});
