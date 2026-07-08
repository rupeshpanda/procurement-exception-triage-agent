import type { ModelClient, ModelClientContext, ModelTurn } from "@/agent/modelClient";
import { containsUnsafeWorkflowLanguage } from "@/tools/workflowGuards";

function hasResult(context: ModelClientContext, toolName: string) {
  return context.toolResults.some((result) => result.toolName === toolName);
}

function requestIncludes(context: ModelClientContext, value: string) {
  return context.userRequest.toLowerCase().includes(value.toLowerCase());
}

function vendorFromRequest(request: string) {
  if (request.toLowerCase().includes("apex")) {
    return "Apex Industrial Supplies";
  }
  if (request.toLowerCase().includes("northstar")) {
    return "Northstar Components";
  }
  if (request.toLowerCase().includes("meridian")) {
    return "Meridian Logistics Group";
  }
  return "Apex Industrial Supplies";
}

function invoiceFromRequest(request: string) {
  return request.match(/INV-\d+/i)?.[0].toUpperCase();
}

function poFromRequest(request: string) {
  return request.match(/PO-\d+/i)?.[0].toUpperCase();
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export class MockModelClient implements ModelClient {
  async nextTurn(context: ModelClientContext): Promise<ModelTurn> {
    const request = context.userRequest;
    const vendorName = vendorFromRequest(request);
    const invoiceNumber = invoiceFromRequest(request);
    const poNumber = poFromRequest(request);

    if (
      (requestIncludes(context, "po") ||
        requestIncludes(context, "purchase order") ||
        requestIncludes(context, "delayed")) &&
      !hasResult(context, "search_purchase_orders")
    ) {
      return {
        stopReason: "tool_use",
        toolUse: {
          id: "toolu-po-search",
          name: "search_purchase_orders",
          input: {
            vendorName,
            poNumber,
            status: requestIncludes(context, "delayed") ? "delayed" : "any",
            maxResults: 10
          }
        }
      };
    }

    if (
      (requestIncludes(context, "invoice") ||
        requestIncludes(context, "blocked") ||
        invoiceNumber) &&
      !hasResult(context, "search_invoice_exceptions")
    ) {
      return {
        stopReason: "tool_use",
        toolUse: {
          id: "toolu-invoice-search",
          name: "search_invoice_exceptions",
          input: {
            vendorName,
            invoiceNumber,
            exceptionType: "any",
            maxResults: 10
          }
        }
      };
    }

    if (
      (requestIncludes(context, "vendor history") ||
        requestIncludes(context, "pattern") ||
        requestIncludes(context, "risk")) &&
      !hasResult(context, "search_vendor_history")
    ) {
      return {
        stopReason: "tool_use",
        toolUse: {
          id: "toolu-vendor-history",
          name: "search_vendor_history",
          input: {
            vendorName,
            timeWindow: "last_12_months"
          }
        }
      };
    }

    // A naive planner might try to push an unsafe payment/PO action through the
    // workflow tool. The workflow server's guardrail rejects it with a
    // structured permission error, demonstrating defense in depth.
    if (
      containsUnsafeWorkflowLanguage(request) &&
      !hasResult(context, "create_procurement_followup")
    ) {
      return {
        stopReason: "tool_use",
        toolUse: {
          id: "toolu-unsafe-action",
          name: "create_procurement_followup",
          input: {
            title: "Process requested payment action",
            description: request,
            vendorName,
            relatedPoNumber: poNumber,
            relatedInvoiceNumber: invoiceNumber,
            dueDate: tomorrow(),
            priority: "urgent"
          }
        }
      };
    }

    if (
      requestIncludes(context, "follow-up") &&
      !hasResult(context, "create_procurement_followup") &&
      !hasResult(context, "escalate_procurement_issue")
    ) {
      return {
        stopReason: "tool_use",
        toolUse: {
          id: "toolu-followup",
          name: "create_procurement_followup",
          input: {
            title: invoiceNumber
              ? `Review ${invoiceNumber}`
              : "Review procurement exception",
            description: request,
            vendorName,
            relatedPoNumber: poNumber,
            relatedInvoiceNumber: invoiceNumber,
            dueDate: requestIncludes(context, "tomorrow") ? tomorrow() : "needs clarification",
            priority: "high"
          }
        }
      };
    }

    if (
      requestIncludes(context, "escalate") &&
      !hasResult(context, "escalate_procurement_issue")
    ) {
      return {
        stopReason: "tool_use",
        toolUse: {
          id: "toolu-escalate",
          name: "escalate_procurement_issue",
          input: {
            reason: "User requested escalation for procurement exception review.",
            riskLevel: "high",
            vendorName,
            relatedPoNumber: poNumber,
            relatedInvoiceNumber: invoiceNumber,
            summary: "Escalation created from multi-concern procurement triage request.",
            recommendedAction:
              "Procurement manager should review the exception, vendor risk, and approval threshold before any business transaction."
          }
        }
      };
    }

    return {
      stopReason: "end_turn",
      text: buildFinalAnswer(context)
    };
  }
}

type LooseToolResult = {
  success?: boolean;
  data?: Record<string, unknown>;
  error?: { errorCategory?: string; message?: string };
};

function money(amount: unknown, currency = "USD") {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return "an unknown amount";
  }
  return `${currency === "USD" ? "$" : `${currency} `}${value.toLocaleString("en-US")}`;
}

function describePurchaseOrders(data: Record<string, unknown>) {
  const orders = Array.isArray(data.purchaseOrders) ? data.purchaseOrders : [];
  if (!orders.length) {
    return "Purchase orders: no matching purchase orders were found.";
  }

  const lines = orders.map((po) => {
    const record = po as Record<string, unknown>;
    const delay =
      Number(record.daysDelayed) > 0
        ? `delayed ${record.daysDelayed} days`
        : `status ${record.status}`;
    return `- ${record.poNumber} (${record.vendorName}): ${money(record.amount, String(record.currency ?? "USD"))}, ${delay}, goods receipt ${record.goodsReceiptStatus}, expected delivery ${record.expectedDeliveryDate}.`;
  });

  return ["Purchase orders:", ...lines].join("\n");
}

function describeInvoiceExceptions(data: Record<string, unknown>) {
  const invoices = Array.isArray(data.invoiceExceptions) ? data.invoiceExceptions : [];
  if (!invoices.length) {
    return "Invoice exceptions: no matching invoice exceptions were found.";
  }

  const lines = invoices.map((invoice) => {
    const record = invoice as Record<string, unknown>;
    return `- ${record.invoiceNumber} (${record.vendorName}, ${money(record.amount, String(record.currency ?? "USD"))}, status ${record.status}): ${record.description}`;
  });

  return ["Invoice exceptions:", ...lines].join("\n");
}

function describeVendorHistory(data: Record<string, unknown>) {
  const vendor = data.vendorHistory as Record<string, unknown> | undefined;
  if (!vendor) {
    return "Vendor history: no vendor record was found.";
  }

  const onTime =
    typeof vendor.onTimeDeliveryRate === "number"
      ? ` On-time delivery is ${Math.round(vendor.onTimeDeliveryRate * 100)}%.`
      : "";

  return `Vendor risk: ${vendor.vendorName} is rated ${String(vendor.riskLevel).toUpperCase()} risk with ${vendor.lateDeliveryCount} late deliveries, ${vendor.invoiceExceptionCount} invoice exceptions, and ${vendor.priorEscalationCount} prior escalations.${onTime} ${vendor.summary}`;
}

function describeFollowup(data: Record<string, unknown>) {
  return `Follow-up created: ${data.taskId} — "${data.title}", due ${data.dueDate}, priority ${data.priority}. It tracks the work without approving any transaction.`;
}

function describeEscalation(data: Record<string, unknown>) {
  return `Escalation created: ${data.escalationId} is pending human review (${data.riskLevel} risk). Reason: ${data.reason}`;
}

function buildFinalAnswer(context: ModelClientContext) {
  const lines = ["Procurement triage complete. Here is what I found:"];

  for (const item of context.toolResults) {
    const result = item.result as LooseToolResult | undefined;
    if (!result || typeof result !== "object") {
      continue;
    }

    if (result.success === false) {
      if (result.error?.errorCategory !== "permission") {
        lines.push(
          "",
          `I could not complete ${item.toolName.replaceAll("_", " ")}: ${result.error?.message ?? "the tool returned an error."}`
        );
      }
      continue;
    }

    const data = result.data ?? {};
    switch (item.toolName) {
      case "search_purchase_orders":
        lines.push("", describePurchaseOrders(data));
        break;
      case "search_invoice_exceptions":
        lines.push("", describeInvoiceExceptions(data));
        break;
      case "search_vendor_history":
        lines.push("", describeVendorHistory(data));
        break;
      case "create_procurement_followup":
        lines.push("", describeFollowup(data));
        break;
      case "escalate_procurement_issue":
        lines.push("", describeEscalation(data));
        break;
    }
  }

  const permissionBlocked = context.toolResults.some((item) => {
    const result = item.result as
      | { success?: boolean; error?: { errorCategory?: string } }
      | undefined;
    return result?.success === false && result.error?.errorCategory === "permission";
  });

  if (permissionBlocked) {
    lines.push(
      "",
      "One requested action was not completed automatically because it requires human approval. The workflow server rejected it with a permission error, which is not retryable. Please route it to the accountable approver."
    );
  }

  lines.push(
    "",
    "I used mock procurement data only. I did not approve payments, release invoices, close purchase orders, or modify production systems."
  );

  return lines.join("\n");
}
