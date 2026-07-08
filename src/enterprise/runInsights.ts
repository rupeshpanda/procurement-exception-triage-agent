import type { AgentResponse, ToolTrace } from "@/types/trace";

type ModelInfo = AgentResponse["modelInfo"];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function successData(toolTrace: ToolTrace) {
  if (!toolTrace.result?.success) {
    return undefined;
  }

  return toolTrace.result.data as Record<string, unknown>;
}

function sumAmounts(values: unknown[]) {
  return values.reduce<number>((total, value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);
}

export function buildExecutiveSummary(toolTraces: ToolTrace[]): AgentResponse["executiveSummary"] {
  const purchaseOrders = toolTraces.flatMap((trace) => {
    const data = successData(trace);
    return Array.isArray(data?.purchaseOrders) ? data.purchaseOrders.map(asRecord) : [];
  });
  const invoiceExceptions = toolTraces.flatMap((trace) => {
    const data = successData(trace);
    return Array.isArray(data?.invoiceExceptions)
      ? data.invoiceExceptions.map(asRecord)
      : [];
  });
  const vendorHistories = toolTraces.flatMap((trace) => {
    const data = successData(trace);
    return data?.vendorHistory ? [asRecord(data.vendorHistory)] : [];
  });

  const totalExceptionValue =
    sumAmounts(purchaseOrders.map((po) => po.amount)) +
    sumAmounts(invoiceExceptions.map((invoice) => invoice.amount));
  const delayedPoCount = purchaseOrders.filter((po) => po.status === "delayed").length;
  const blockedInvoiceCount = invoiceExceptions.filter((invoice) =>
    ["open", "under_review", "escalated"].includes(String(invoice.status))
  ).length;
  const escalationsCreated = toolTraces.filter(
    (trace) => trace.toolName === "escalate_procurement_issue" && trace.result?.success
  ).length;
  const followupsCreated = toolTraces.filter(
    (trace) => trace.toolName === "create_procurement_followup" && trace.result?.success
  ).length;
  const highRiskVendors = vendorHistories
    .filter((vendor) => ["high", "critical"].includes(String(vendor.riskLevel)))
    .map((vendor) => String(vendor.vendorName));
  const humanApprovalRequired =
    escalationsCreated > 0 || toolTraces.some((trace) => trace.blockedByHook);

  return {
    totalExceptionValue,
    delayedPoCount,
    blockedInvoiceCount,
    escalationsCreated,
    followupsCreated,
    highRiskVendors,
    humanApprovalRequired,
    headline: humanApprovalRequired
      ? "High-value or governed procurement exceptions require human review."
      : "No approval-threshold breach was detected in this run."
  };
}

export function buildAuditTrail(args: {
  userRequest: string;
  modelInfo: ModelInfo;
  toolTraces: ToolTrace[];
}): AgentResponse["auditTrail"] {
  const now = new Date().toISOString();
  const entries: AgentResponse["auditTrail"] = [
    {
      id: crypto.randomUUID(),
      timestamp: now,
      actor: "user",
      action: "Submitted procurement triage request",
      control: "Input captured for traceability",
      outcome: args.userRequest,
      evidence: { requestLength: args.userRequest.length }
    },
    {
      id: crypto.randomUUID(),
      timestamp: now,
      actor: "model",
      action: "Planner selected next steps",
      control: "Model identity recorded",
      outcome: `${args.modelInfo.provider} / ${args.modelInfo.model}`,
      evidence: args.modelInfo
    }
  ];

  for (const toolTrace of args.toolTraces) {
    if (toolTrace.blockedByHook) {
      entries.push({
        id: crypto.randomUUID(),
        timestamp: now,
        actor: "hook",
        action: "Blocked original tool call and redirected to escalation",
        control: "Approval threshold policy",
        outcome: "Human review required before business action",
        evidence: { toolName: toolTrace.toolName, input: toolTrace.input }
      });
    }

    entries.push({
      id: crypto.randomUUID(),
      timestamp: now,
      actor: "mcp-client",
      action: `Routed ${toolTrace.toolName}`,
      control: "Server separation of duties",
      outcome: `Routed to ${toolTrace.server}`,
      evidence: { input: toolTrace.input }
    });
    entries.push({
      id: crypto.randomUUID(),
      timestamp: now,
      actor: "mcp-tool",
      action: `Executed ${toolTrace.toolName}`,
      control: "Structured tool response",
      outcome: toolTrace.result?.success ? "success" : "error",
      evidence: { result: toolTrace.result }
    });
  }

  return entries;
}

export function buildEnterpriseReadiness(): AgentResponse["enterpriseReadiness"] {
  return {
    controls: [
      "Server-side LLM calls only; API keys are never exposed to the browser.",
      "Read-only procurement data tools are separated from workflow/action tools.",
      "Before-tool hook enforces deterministic approval threshold policy.",
      "Workflow server rejects unsafe payment, invoice release, and PO closure language.",
      "Every tool returns structured success, validation, permission, or transient error responses.",
      "Human-review escalation is created instead of completing governed actions automatically."
    ],
    integrationRoadmap: [
      {
        labCapability: "search_purchase_orders",
        enterpriseSystem: "SAP S/4HANA Purchase Order APIs",
        productionNotes: "Use read-only service credentials and preserve PO status, goods receipt, and delivery fields."
      },
      {
        labCapability: "search_invoice_exceptions",
        enterpriseSystem: "SAP Invoice Verification / Accounts Payable exceptions",
        productionNotes: "Read blocked invoice reason codes, three-way-match status, and payment block metadata."
      },
      {
        labCapability: "search_vendor_history",
        enterpriseSystem: "SAP Business Partner + SAP Ariba supplier scorecards",
        productionNotes: "Combine supplier reliability, late delivery history, and prior escalation counts."
      },
      {
        labCapability: "create_procurement_followup",
        enterpriseSystem: "ServiceNow, Jira, SAP Workflow, or Microsoft Planner",
        productionNotes: "Create trackable work items without approving business transactions."
      },
      {
        labCapability: "escalate_procurement_issue",
        enterpriseSystem: "SAP Flexible Workflow, Teams approvals, or ServiceNow approval tasks",
        productionNotes: "Route high-value or policy-blocked issues to accountable approvers."
      }
    ],
    pilotKpis: [
      "Average procurement exception triage time",
      "Manual system lookups avoided per exception",
      "High-value exceptions escalated within SLA",
      "Blocked invoices resolved before payment run",
      "Audit completeness for AI-assisted triage",
      "Buyer productivity improvement"
    ],
    currentLimitations: [
      "Uses mock procurement data in version 1.",
      "Does not authenticate users or enforce role-based access yet.",
      "Does not persist audit trails to an enterprise database yet.",
      "Does not connect to real SAP, Ariba, ServiceNow, Jira, Teams, or email systems yet.",
      "Does not approve payments, release invoices, close POs, or modify production systems."
    ]
  };
}

export function buildLearningModules(): AgentResponse["learningModules"] {
  return [
    {
      title: "Claude Tool Use Loop",
      concept: "Claude can return tool_use instead of a final answer. The app executes the tool and sends a tool_result back.",
      whatToObserve: "Watch model stop reasons move from tool_use to end_turn as context is gathered.",
      enterpriseMapping: "This is how an enterprise agent stays grounded in system data instead of guessing."
    },
    {
      title: "MCP Server Separation",
      concept: "Read-only data tools and workflow tools live behind separate MCP server boundaries.",
      whatToObserve: "PO, invoice, and vendor history calls route to procurement-data; follow-up and escalation route to procurement-workflow.",
      enterpriseMapping: "This mirrors separation of duties between reporting APIs and controlled business actions."
    },
    {
      title: "Deterministic Hook",
      concept: "Policy enforcement happens before execution and does not depend on model judgment.",
      whatToObserve: "High-value workflow actions are blocked before the original tool executes.",
      enterpriseMapping: "Approval thresholds, SoD controls, and compliance rules belong in deterministic systems."
    },
    {
      title: "Structured Errors",
      concept: "Tools return success, validation, permission, or transient errors with retry semantics.",
      whatToObserve: "Permission errors stop automation; transient errors can be retried; validation errors ask for clarity.",
      enterpriseMapping: "Structured failure modes are essential for auditability and safe automation."
    },
    {
      title: "Human In The Loop",
      concept: "The agent can escalate but cannot approve governed actions.",
      whatToObserve: "Escalation records are pending_review, not completed transactions.",
      enterpriseMapping: "Enterprise AI credibility comes from knowing when to stop and involve accountable humans."
    }
  ];
}
