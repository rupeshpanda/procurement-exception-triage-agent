import type { ProcurementToolName } from "@/types/tools";

export type ModelStopReason = "tool_use" | "end_turn";

export interface ModelToolUse {
  id: string;
  name: ProcurementToolName;
  input: Record<string, unknown>;
}

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ModelTurn {
  stopReason: ModelStopReason;
  text?: string;
  toolUse?: ModelToolUse;
  usage?: ModelUsage;
}

export interface ModelClientContext {
  userRequest: string;
  toolResults: Array<{
    toolUseId?: string;
    toolName: ProcurementToolName;
    result: unknown;
  }>;
}

export interface ModelClient {
  nextTurn(context: ModelClientContext): Promise<ModelTurn>;
}
