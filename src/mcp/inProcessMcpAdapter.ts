import {
  searchInvoiceExceptions,
  searchPurchaseOrders,
  searchVendorHistory
} from "@/tools/procurementDataTools";
import {
  createProcurementFollowup,
  escalateProcurementIssue
} from "@/tools/procurementWorkflowTools";
import type { ProcurementToolName, ToolInputMap, ToolOutputMap, ToolResult } from "@/types/tools";

export async function callInProcessTool<TName extends ProcurementToolName>(
  toolName: TName,
  input: ToolInputMap[TName]
): Promise<ToolResult<ToolOutputMap[TName]>> {
  switch (toolName) {
    case "search_purchase_orders":
      return searchPurchaseOrders(input as ToolInputMap["search_purchase_orders"]) as ToolResult<ToolOutputMap[TName]>;
    case "search_invoice_exceptions":
      return searchInvoiceExceptions(input as ToolInputMap["search_invoice_exceptions"]) as ToolResult<ToolOutputMap[TName]>;
    case "search_vendor_history":
      return searchVendorHistory(input as ToolInputMap["search_vendor_history"]) as ToolResult<ToolOutputMap[TName]>;
    case "create_procurement_followup":
      return createProcurementFollowup(input as ToolInputMap["create_procurement_followup"]) as ToolResult<ToolOutputMap[TName]>;
    case "escalate_procurement_issue":
      return escalateProcurementIssue(input as ToolInputMap["escalate_procurement_issue"]) as ToolResult<ToolOutputMap[TName]>;
    default:
      return {
        success: false,
        error: {
          errorCategory: "validation",
          isRetryable: false,
          message: `Unknown tool: ${String(toolName)}`
        }
      };
  }
}
