import type {
  InvoiceException,
  ProcurementEscalation,
  ProcurementFollowup,
  PurchaseOrder,
  TaskPriority,
  VendorHistory,
  VendorRiskLevel
} from "./procurement";

export type ErrorCategory = "transient" | "validation" | "permission";

export interface ToolError {
  errorCategory: ErrorCategory;
  isRetryable: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export type ToolResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ToolError;
    };

export interface SearchPurchaseOrdersInput {
  vendorName?: string;
  poNumber?: string;
  status?: "open" | "delayed" | "received" | "closed" | "any";
  maxResults?: number;
}

export interface SearchInvoiceExceptionsInput {
  vendorName?: string;
  invoiceNumber?: string;
  exceptionType?:
    | "price_variance"
    | "quantity_variance"
    | "missing_goods_receipt"
    | "payment_block"
    | "any";
  maxResults?: number;
}

export interface SearchVendorHistoryInput {
  vendorName: string;
  timeWindow?: "last_30_days" | "last_90_days" | "last_12_months" | "all";
}

export interface CreateProcurementFollowupInput {
  title: string;
  description: string;
  vendorName?: string;
  relatedPoNumber?: string;
  relatedInvoiceNumber?: string;
  dueDate: string;
  priority: TaskPriority;
}

export interface EscalateProcurementIssueInput {
  reason: string;
  riskLevel: VendorRiskLevel;
  amount?: number;
  vendorName?: string;
  relatedPoNumber?: string;
  relatedInvoiceNumber?: string;
  summary: string;
  recommendedAction: string;
}

export interface ToolInputMap {
  search_purchase_orders: SearchPurchaseOrdersInput;
  search_invoice_exceptions: SearchInvoiceExceptionsInput;
  search_vendor_history: SearchVendorHistoryInput;
  create_procurement_followup: CreateProcurementFollowupInput;
  escalate_procurement_issue: EscalateProcurementIssueInput;
}

export interface ToolOutputMap {
  search_purchase_orders: { purchaseOrders: PurchaseOrder[] };
  search_invoice_exceptions: { invoiceExceptions: InvoiceException[] };
  search_vendor_history: { vendorHistory: VendorHistory };
  create_procurement_followup: Pick<
    ProcurementFollowup,
    "taskId" | "status" | "title" | "dueDate" | "priority"
  >;
  escalate_procurement_issue: Pick<
    ProcurementEscalation,
    "escalationId" | "status" | "riskLevel" | "reason"
  >;
}

export type ProcurementToolName = keyof ToolInputMap;

export interface ToolDefinition {
  name: ProcurementToolName;
  server: "procurement-data" | "procurement-workflow";
  purpose: string;
  whenToUse: string[];
  whenNotToUse: string[];
  boundaryConditions: string[];
  exampleTriggerPhrases: string[];
}
