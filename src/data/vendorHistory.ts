import type { VendorHistory } from "@/types/procurement";

export const vendorHistory: VendorHistory[] = [
  {
    vendorName: "Apex Industrial Supplies",
    sapVendorNumber: "0000102394",
    riskLevel: "high",
    lateDeliveryCount: 7,
    invoiceExceptionCount: 5,
    priorEscalationCount: 3,
    onTimeDeliveryRate: 0.71,
    spendYtdUsd: 486000,
    paymentTerms: "NT30",
    summary:
      "Apex has repeated late deliveries and recurring invoice exceptions tied to missing or partial goods receipts. On-time delivery has declined for two consecutive quarters."
  },
  {
    vendorName: "Northstar Components",
    sapVendorNumber: "0000104871",
    riskLevel: "low",
    lateDeliveryCount: 1,
    invoiceExceptionCount: 1,
    priorEscalationCount: 0,
    onTimeDeliveryRate: 0.97,
    spendYtdUsd: 152000,
    paymentTerms: "NT45",
    summary:
      "Northstar has a mostly stable delivery and invoice history with isolated low-value issues, all resolved within standard cycle time."
  },
  {
    vendorName: "Meridian Logistics Group",
    sapVendorNumber: "0000108226",
    riskLevel: "critical",
    lateDeliveryCount: 11,
    invoiceExceptionCount: 6,
    priorEscalationCount: 4,
    onTimeDeliveryRate: 0.58,
    spendYtdUsd: 812000,
    paymentTerms: "NT60",
    summary:
      "Meridian has an active delivery dispute, a manually blocked high-value invoice, and the worst on-time delivery rate in the category. Sourcing has flagged the vendor for quarterly business review."
  }
];
