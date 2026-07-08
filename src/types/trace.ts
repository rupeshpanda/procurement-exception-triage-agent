import type { ProcurementToolName, ToolResult } from "./tools";

export type TraceEventType =
  | "model_request"
  | "model_stop_reason"
  | "tool_call"
  | "hook_decision"
  | "mcp_route"
  | "tool_result"
  | "retry"
  | "final_response"
  | "learning_note";

export interface TraceEvent {
  id: string;
  type: TraceEventType;
  timestamp: string;
  title: string;
  detail: string;
  metadata?: Record<string, unknown>;
}

export interface ToolTrace {
  toolName: ProcurementToolName;
  input: Record<string, unknown>;
  result?: ToolResult<unknown>;
  server?: "procurement-data" | "procurement-workflow";
  blockedByHook?: boolean;
}

export interface RunUsage {
  modelTurns: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
}

export interface AgentResponse {
  finalAnswer: string;
  modelInfo: {
    provider: string;
    model: string;
    mode: "mock" | "anthropic";
    note: string;
  };
  usage: RunUsage;
  executiveSummary: {
    totalExceptionValue: number;
    delayedPoCount: number;
    blockedInvoiceCount: number;
    escalationsCreated: number;
    followupsCreated: number;
    highRiskVendors: string[];
    humanApprovalRequired: boolean;
    headline: string;
  };
  auditTrail: Array<{
    id: string;
    timestamp: string;
    actor: "user" | "model" | "hook" | "mcp-client" | "mcp-tool";
    action: string;
    control: string;
    outcome: string;
    evidence?: Record<string, unknown>;
  }>;
  enterpriseReadiness: {
    controls: string[];
    integrationRoadmap: Array<{
      labCapability: string;
      enterpriseSystem: string;
      productionNotes: string;
    }>;
    pilotKpis: string[];
    currentLimitations: string[];
  };
  learningModules: Array<{
    title: string;
    concept: string;
    whatToObserve: string;
    enterpriseMapping: string;
  }>;
  trace: TraceEvent[];
  toolTraces: ToolTrace[];
  learningNotes: string[];
}
