import { toolDefinitions } from "@/tools/definitions";

const schemas = {
  search_purchase_orders: {
    type: "object",
    properties: {
      vendorName: { type: "string" },
      poNumber: { type: "string" },
      status: {
        type: "string",
        enum: ["open", "delayed", "received", "closed", "any"]
      },
      maxResults: { type: "integer", minimum: 1, maximum: 25 }
    },
    additionalProperties: false
  },
  search_invoice_exceptions: {
    type: "object",
    properties: {
      vendorName: { type: "string" },
      invoiceNumber: { type: "string" },
      exceptionType: {
        type: "string",
        enum: [
          "price_variance",
          "quantity_variance",
          "missing_goods_receipt",
          "payment_block",
          "any"
        ]
      },
      maxResults: { type: "integer", minimum: 1, maximum: 25 }
    },
    additionalProperties: false
  },
  search_vendor_history: {
    type: "object",
    properties: {
      vendorName: { type: "string" },
      timeWindow: {
        type: "string",
        enum: ["last_30_days", "last_90_days", "last_12_months", "all"]
      }
    },
    required: ["vendorName"],
    additionalProperties: false
  },
  create_procurement_followup: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      vendorName: { type: "string" },
      relatedPoNumber: { type: "string" },
      relatedInvoiceNumber: { type: "string" },
      dueDate: { type: "string" },
      priority: { type: "string", enum: ["low", "medium", "high", "urgent"] }
    },
    required: ["title", "description", "dueDate", "priority"],
    additionalProperties: false
  },
  escalate_procurement_issue: {
    type: "object",
    properties: {
      reason: { type: "string" },
      riskLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
      amount: { type: "number" },
      vendorName: { type: "string" },
      relatedPoNumber: { type: "string" },
      relatedInvoiceNumber: { type: "string" },
      summary: { type: "string" },
      recommendedAction: { type: "string" }
    },
    required: ["reason", "riskLevel", "summary", "recommendedAction"],
    additionalProperties: false
  }
} as const;

export function getAnthropicTools() {
  return toolDefinitions.map((tool) => ({
    name: tool.name,
    description: [
      tool.purpose,
      `When to use: ${tool.whenToUse.join("; ")}.`,
      `When not to use: ${tool.whenNotToUse.join("; ")}.`,
      `Boundary conditions: ${tool.boundaryConditions.join("; ")}.`,
      `Example trigger phrases: ${tool.exampleTriggerPhrases.join("; ")}.`
    ].join("\n"),
    input_schema: schemas[tool.name]
  }));
}
