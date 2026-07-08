import type { ToolDefinition } from "@/types/tools";

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "search_purchase_orders",
    server: "procurement-data",
    purpose: "Search purchase order records for status, delivery, goods receipt, and PO amount context.",
    whenToUse: [
      "Purchase order status",
      "Delayed or open POs",
      "Goods receipt status",
      "Expected delivery date",
      "Vendor purchase orders"
    ],
    whenNotToUse: [
      "Invoice mismatch details",
      "Payment block details",
      "Vendor risk history",
      "Creating tasks or escalations"
    ],
    boundaryConditions: [
      "Read-only",
      "Never approves payment",
      "Never changes PO status",
      "Never creates workflow records"
    ],
    exampleTriggerPhrases: [
      "Check delayed POs for Apex",
      "What is the goods receipt status for PO-10441?"
    ]
  },
  {
    name: "search_invoice_exceptions",
    server: "procurement-data",
    purpose: "Search blocked invoice and invoice exception records.",
    whenToUse: [
      "Blocked invoice",
      "Price variance",
      "Quantity variance",
      "Missing goods receipt",
      "Payment block"
    ],
    whenNotToUse: [
      "General PO delivery status",
      "Vendor risk history",
      "Approving or releasing invoices"
    ],
    boundaryConditions: [
      "Read-only",
      "Never approves invoices",
      "Never releases payment blocks",
      "Never escalates directly"
    ],
    exampleTriggerPhrases: [
      "Why is invoice INV-90031 blocked?",
      "Find quantity variance invoices for Apex"
    ]
  },
  {
    name: "search_vendor_history",
    server: "procurement-data",
    purpose: "Search vendor risk and historical procurement exception patterns.",
    whenToUse: [
      "Vendor risk",
      "Recurring issues",
      "Late delivery history",
      "Prior escalations",
      "Pattern analysis"
    ],
    whenNotToUse: [
      "Specific PO status",
      "Specific invoice exception details",
      "Creating tasks"
    ],
    boundaryConditions: [
      "Read-only",
      "Never changes vendor status",
      "Never blocks vendors"
    ],
    exampleTriggerPhrases: [
      "Does Apex have a pattern of issues?",
      "Review vendor history for Northstar"
    ]
  },
  {
    name: "create_procurement_followup",
    server: "procurement-workflow",
    purpose: "Create a local mock follow-up task for procurement action tracking.",
    whenToUse: [
      "Create a follow-up",
      "Track an action item",
      "Remind me to review",
      "Check PO next week"
    ],
    whenNotToUse: [
      "Approving payments",
      "Releasing invoice blocks",
      "Closing POs",
      "Sending vendor messages"
    ],
    boundaryConditions: [
      "May create local mock task records",
      "Never approves or releases payment",
      "Unsafe workflow language is rejected"
    ],
    exampleTriggerPhrases: [
      "Create a follow-up task to review INV-90032 tomorrow",
      "Remind me to check PO-10441 next week"
    ]
  },
  {
    name: "escalate_procurement_issue",
    server: "procurement-workflow",
    purpose: "Create a local mock human-review escalation record.",
    whenToUse: [
      "Amount exceeds approval threshold",
      "Vendor risk is high or critical",
      "User explicitly asks to escalate",
      "Agent lacks permission",
      "Business-rule hook blocks an action"
    ],
    whenNotToUse: [
      "Simple read-only lookup",
      "Low-risk follow-up creation",
      "Approving or releasing invoices"
    ],
    boundaryConditions: [
      "Creates pending-review records only",
      "Never completes a production transaction",
      "Never bypasses business rules"
    ],
    exampleTriggerPhrases: [
      "Escalate anything above $25,000",
      "This requires manager review"
    ]
  }
];
