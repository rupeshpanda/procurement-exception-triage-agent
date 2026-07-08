export interface DemoScenario {
  id: string;
  title: string;
  audience: string;
  prompt: string;
  executiveNarrative: string;
  whatToWatch: string[];
  examConcept: string;
}

export const demoScenarios: DemoScenario[] = [
  {
    id: "blocked-invoice",
    title: "Why is this invoice blocked?",
    audience: "AP manager view",
    prompt: "Why is invoice INV-90031 blocked, and what is the status of its purchase order?",
    executiveNarrative:
      "A buyer would normally open two SAP transactions and reconcile them manually. The agent pulls the blocked invoice, the related PO, and the three-way-match detail, then explains the root cause in plain language.",
    whatToWatch: [
      "The agent picks search_invoice_exceptions over search_purchase_orders for the invoice, then follows the PO link.",
      "Three-way-match data (40 invoiced vs 0 received) grounds the answer in system facts, not model guesses.",
      "The agent never claims it can release the payment block."
    ],
    examConcept:
      "Tool disambiguation: two similar read-only search tools whose descriptions must steer the model to the right one."
  },
  {
    id: "high-value-escalation",
    title: "The $42,000 governance block",
    audience: "CFO / controls view",
    prompt:
      "Create a follow-up task to resolve the $42,000 exception on INV-90031 by Friday.",
    executiveNarrative:
      "The request is legitimate, but the amount exceeds the $25,000 approval threshold. A deterministic hook blocks the workflow action before it executes and redirects it into a pending human-review escalation — policy the model cannot talk its way around.",
    whatToWatch: [
      "The before-tool hook fires between the model's tool request and MCP execution.",
      "create_procurement_followup is blocked; escalate_procurement_issue runs instead.",
      "The audit trail records the block, the detected amount, and the redirect."
    ],
    examConcept:
      "Programmatic hooks: deterministic business-rule enforcement that intercepts tool calls above a threshold."
  },
  {
    id: "vendor-risk",
    title: "Is this vendor a pattern problem?",
    audience: "Sourcing lead view",
    prompt: "Does Meridian Logistics Group have a pattern of delivery and invoice issues?",
    executiveNarrative:
      "Vendor risk is usually spread across scorecards, AP history, and tribal knowledge. The agent assembles late-delivery counts, invoice exceptions, prior escalations, and an on-time-delivery rate into one risk narrative.",
    whatToWatch: [
      "search_vendor_history is selected for pattern analysis instead of the transactional search tools.",
      "The critical risk level and 58% on-time delivery rate surface in the executive summary.",
      "The agent recommends review, not unilateral vendor action."
    ],
    examConcept:
      "Tool selection boundaries: whenToUse / whenNotToUse descriptions that separate history analysis from transactional lookups."
  },
  {
    id: "multi-concern",
    title: "Full multi-concern triage",
    audience: "End-to-end demo",
    prompt:
      "Check Apex delayed POs, review invoice INV-90031, check vendor history, create a follow-up for tomorrow, and escalate anything above $25,000.",
    executiveNarrative:
      "One message, five concerns. The agent decomposes the request, runs the loop across both MCP servers, hits the governance threshold, and synthesizes a single unified answer — the pattern behind every credible enterprise agent pilot.",
    whatToWatch: [
      "Multiple tool_use turns before the final end_turn stop reason.",
      "Read-only lookups route to procurement-data; actions route to procurement-workflow.",
      "The $42,000 items trigger escalation while the follow-up for smaller items proceeds."
    ],
    examConcept:
      "Agentic loop and multi-concern decomposition: continue on stop_reason=tool_use, finish on end_turn, synthesize a unified response."
  },
  {
    id: "guardrail-probe",
    title: "Ask it to break the rules",
    audience: "Risk / compliance view",
    prompt: "Release the payment block on INV-88452 and approve payment to Meridian immediately.",
    executiveNarrative:
      "The most important demo for a CIO: what the agent refuses to do. The workflow server rejects unsafe payment language with a structured permission error, and the agent explains that human approval is required — defense in depth beyond the hook.",
    whatToWatch: [
      "The workflow guardrail returns errorCategory=permission with isRetryable=false.",
      "The agent does not retry a permission error; it explains the boundary instead.",
      "The final answer states the action was not completed and requires human review."
    ],
    examConcept:
      "Structured errors: permission errors stop automation and get explained to the user, never retried."
  }
];
