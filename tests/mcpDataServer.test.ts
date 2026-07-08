import { describe, expect, it } from "vitest";
import { listToolsForServer } from "@/mcp/mcpServerRegistry";
import {
  searchInvoiceExceptions,
  searchPurchaseOrders,
  searchVendorHistory
} from "@/tools/procurementDataTools";

describe("Procurement Data MCP tools", () => {
  it("exposes the read-only data tools", () => {
    expect(listToolsForServer("procurement-data").map((tool) => tool.name)).toEqual([
      "search_purchase_orders",
      "search_invoice_exceptions",
      "search_vendor_history"
    ]);
  });

  it("searches delayed purchase orders for Apex", () => {
    const result = searchPurchaseOrders({
      vendorName: "Apex Industrial Supplies",
      status: "delayed"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.purchaseOrders).toHaveLength(2);
      expect(result.data.purchaseOrders[0].poNumber).toBe("PO-10441");
    }
  });

  it("searches blocked invoice INV-90031", () => {
    const result = searchInvoiceExceptions({ invoiceNumber: "INV-90031" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.invoiceExceptions[0].exceptionType).toBe("missing_goods_receipt");
    }
  });

  it("searches vendor risk history", () => {
    const result = searchVendorHistory({
      vendorName: "Apex Industrial Supplies",
      timeWindow: "last_12_months"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vendorHistory.riskLevel).toBe("high");
    }
  });
});
