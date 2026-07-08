import { BUSINESS_RULES } from "@/config/businessRules";
import { extractAmountsFromObject, extractAmountsFromText } from "@/hooks/amountExtraction";
import type {
  EscalateProcurementIssueInput,
  ProcurementToolName
} from "@/types/tools";

export type HookDecision =
  | {
      allowed: true;
      reason: string;
    }
  | {
      allowed: false;
      reason: string;
      redirectedToolName: "escalate_procurement_issue";
      redirectedInput: EscalateProcurementIssueInput;
      detectedAmount: number;
    };

export function beforeToolExecutionHook(args: {
  toolName: ProcurementToolName;
  toolInput: Record<string, unknown>;
  originalUserRequest: string;
}): HookDecision {
  if (args.toolName === "escalate_procurement_issue") {
    return {
      allowed: true,
      reason: "Escalation tool is allowed because it creates a pending human-review record only."
    };
  }

  const amounts = [
    ...extractAmountsFromObject(args.toolInput),
    ...extractAmountsFromText(args.originalUserRequest)
  ];
  const detectedAmount = Math.max(0, ...amounts);

  if (args.toolName.startsWith("search_")) {
    return {
      allowed: true,
      reason:
        detectedAmount > BUSINESS_RULES.approvalThreshold
          ? "High-value amount detected, but read-only context retrieval is allowed. Any workflow action must still be governed."
          : "Read-only context retrieval is allowed."
    };
  }

  if (detectedAmount > BUSINESS_RULES.approvalThreshold) {
    return {
      allowed: false,
      reason: `Amount ${detectedAmount} exceeds approval threshold ${BUSINESS_RULES.approvalThreshold}. Original action must be escalated.`,
      redirectedToolName: "escalate_procurement_issue",
      detectedAmount,
      redirectedInput: {
        reason: "Amount exceeds automatic processing threshold.",
        riskLevel: "high",
        amount: detectedAmount,
        vendorName:
          typeof args.toolInput.vendorName === "string"
            ? args.toolInput.vendorName
            : undefined,
        relatedPoNumber:
          typeof args.toolInput.relatedPoNumber === "string"
            ? args.toolInput.relatedPoNumber
            : undefined,
        relatedInvoiceNumber:
          typeof args.toolInput.relatedInvoiceNumber === "string"
            ? args.toolInput.relatedInvoiceNumber
            : undefined,
        summary: `Blocked ${args.toolName} because the request or input referenced ${detectedAmount}.`,
        recommendedAction:
          "Route to procurement manager for human approval before any payment, invoice, or PO action."
      }
    };
  }

  return {
    allowed: true,
    reason: "No approval-threshold violation detected before tool execution."
  };
}
