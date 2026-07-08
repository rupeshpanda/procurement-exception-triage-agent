import { z } from "zod";

export const searchPurchaseOrdersSchema = z.object({
  vendorName: z.string().optional(),
  poNumber: z.string().optional(),
  status: z.enum(["open", "delayed", "received", "closed", "any"]).default("any"),
  maxResults: z.number().int().positive().max(25).default(10)
});

export const searchInvoiceExceptionsSchema = z.object({
  vendorName: z.string().optional(),
  invoiceNumber: z.string().optional(),
  exceptionType: z
    .enum([
      "price_variance",
      "quantity_variance",
      "missing_goods_receipt",
      "payment_block",
      "any"
    ])
    .default("any"),
  maxResults: z.number().int().positive().max(25).default(10)
});

export const searchVendorHistorySchema = z.object({
  vendorName: z.string().min(1),
  timeWindow: z
    .enum(["last_30_days", "last_90_days", "last_12_months", "all"])
    .default("last_12_months")
});

export const createProcurementFollowupSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  vendorName: z.string().optional(),
  relatedPoNumber: z.string().optional(),
  relatedInvoiceNumber: z.string().optional(),
  dueDate: z.string().min(4),
  priority: z.enum(["low", "medium", "high", "urgent"])
});

export const escalateProcurementIssueSchema = z.object({
  reason: z.string().min(5),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  amount: z.number().optional(),
  vendorName: z.string().optional(),
  relatedPoNumber: z.string().optional(),
  relatedInvoiceNumber: z.string().optional(),
  summary: z.string().min(5),
  recommendedAction: z.string().min(5)
});

export const toolSchemas = {
  search_purchase_orders: searchPurchaseOrdersSchema,
  search_invoice_exceptions: searchInvoiceExceptionsSchema,
  search_vendor_history: searchVendorHistorySchema,
  create_procurement_followup: createProcurementFollowupSchema,
  escalate_procurement_issue: escalateProcurementIssueSchema
};
