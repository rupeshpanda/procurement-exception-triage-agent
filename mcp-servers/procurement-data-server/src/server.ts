import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  searchInvoiceExceptions,
  searchPurchaseOrders,
  searchVendorHistory
} from "../../../src/tools/procurementDataTools";
import {
  searchInvoiceExceptionsSchema,
  searchPurchaseOrdersSchema,
  searchVendorHistorySchema
} from "../../../src/tools/toolSchemas";

function textResult(result: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

export function createProcurementDataServer() {
  const server = new McpServer({
    name: "procurement-data-server",
    version: "0.1.0"
  });

  server.tool(
    "search_purchase_orders",
    "Read-only search for purchase order status, delivery, goods receipt, and PO amount context. Do not use for invoice mismatch details or workflow actions.",
    searchPurchaseOrdersSchema.shape,
    async (input) => textResult(searchPurchaseOrders(input))
  );

  server.tool(
    "search_invoice_exceptions",
    "Read-only search for blocked invoices, price variance, quantity variance, missing goods receipt, and payment block exceptions. Do not use for general PO delivery status.",
    searchInvoiceExceptionsSchema.shape,
    async (input) => textResult(searchInvoiceExceptions(input))
  );

  server.tool(
    "search_vendor_history",
    "Read-only search for vendor risk, recurring procurement issues, late delivery history, and prior escalation patterns.",
    searchVendorHistorySchema.shape,
    async (input) => textResult(searchVendorHistory(input))
  );

  return server;
}

export async function startProcurementDataServer() {
  const server = createProcurementDataServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
