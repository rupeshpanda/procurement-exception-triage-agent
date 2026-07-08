import { describe, expect, it } from "vitest";
import { callMcpTool } from "@/mcp/mcpClient";

describe("MCP client", () => {
  it("routes invoice exception lookup to the data server", async () => {
    const call = await callMcpTool("search_invoice_exceptions", {
      invoiceNumber: "INV-90031"
    });

    expect(call.server).toBe("procurement-data");
    expect(call.result.success).toBe(true);
  });

  it("routes follow-up creation to the workflow server", async () => {
    const call = await callMcpTool("create_procurement_followup", {
      title: "Review INV-90032",
      description: "Review invoice exception.",
      relatedInvoiceNumber: "INV-90032",
      dueDate: "2026-07-09",
      priority: "medium"
    });

    expect(call.server).toBe("procurement-workflow");
    expect(call.result.success).toBe(true);
  });
});
