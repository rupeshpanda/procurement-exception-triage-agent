export type ProcurementStatus = "open" | "delayed" | "received" | "closed";
export type GoodsReceiptStatus = "pending" | "completed" | "partial";
export type InvoiceExceptionType =
  | "price_variance"
  | "quantity_variance"
  | "missing_goods_receipt"
  | "payment_block";
export type InvoiceExceptionStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "escalated";
export type VendorRiskLevel = "low" | "medium" | "high" | "critical";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ThreeWayMatch {
  poQuantity: number;
  goodsReceiptQuantity: number;
  invoiceQuantity: number;
  poUnitPrice: number;
  invoiceUnitPrice: number;
  unit: string;
}

export interface PurchaseOrder {
  poNumber: string;
  sapPoNumber?: string;
  vendorName: string;
  amount: number;
  currency?: string;
  status: ProcurementStatus;
  daysDelayed: number;
  goodsReceiptStatus: GoodsReceiptStatus;
  expectedDeliveryDate: string;
  companyCode?: string;
  plant?: string;
  purchasingGroup?: string;
  paymentTerms?: string;
  buyerName?: string;
  materialDescription?: string;
}

export interface InvoiceException {
  invoiceNumber: string;
  sapInvoiceDocNumber?: string;
  fiscalYear?: string;
  vendorName: string;
  amount: number;
  currency?: string;
  exceptionType: InvoiceExceptionType;
  status: InvoiceExceptionStatus;
  relatedPoNumber: string;
  paymentBlockCode?: string;
  sapBlockingMessage?: string;
  threeWayMatch?: ThreeWayMatch;
  description: string;
}

export interface VendorHistory {
  vendorName: string;
  sapVendorNumber?: string;
  riskLevel: VendorRiskLevel;
  lateDeliveryCount: number;
  invoiceExceptionCount: number;
  priorEscalationCount: number;
  onTimeDeliveryRate?: number;
  spendYtdUsd?: number;
  paymentTerms?: string;
  summary: string;
}

export interface ProcurementFollowup {
  taskId: string;
  status: "created";
  title: string;
  description: string;
  vendorName?: string;
  relatedPoNumber?: string;
  relatedInvoiceNumber?: string;
  dueDate: string;
  priority: TaskPriority;
  createdAt: string;
}

export interface ProcurementEscalation {
  escalationId: string;
  status: "pending_review";
  reason: string;
  riskLevel: VendorRiskLevel;
  amount?: number;
  vendorName?: string;
  relatedPoNumber?: string;
  relatedInvoiceNumber?: string;
  summary: string;
  recommendedAction: string;
  createdAt: string;
}
