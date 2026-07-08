import type { ModelClient } from "@/agent/modelClient";
import { AnthropicModelClient } from "@/agent/anthropicClient";
import { MockModelClient } from "@/agent/mockModelClient";
import { beforeToolExecutionHook } from "@/hooks/beforeToolExecutionHook";
import { callMcpTool } from "@/mcp/mcpClient";
import { createTraceEvent } from "@/telemetry/trace";
import { estimateCostUsd } from "@/config/model";
import type { AgentResponse, ToolTrace, TraceEvent } from "@/types/trace";
import type { ProcurementToolName, ToolInputMap } from "@/types/tools";
import { shouldRetryToolResult } from "@/errors/retryPolicy";
import {
  buildAuditTrail,
  buildEnterpriseReadiness,
  buildExecutiveSummary,
  buildLearningModules
} from "@/enterprise/runInsights";

export interface RunAgentOptions {
  modelClient?: ModelClient;
  maxIterations?: number;
  /** Called for every trace event as it happens, enabling live streaming to the UI. */
  onEvent?: (event: TraceEvent) => void;
  /** Force the deterministic mock planner (e.g. when the daily API budget is spent). */
  forceMock?: boolean;
  forceMockReason?: string;
}

export async function runProcurementAgent(
  userRequest: string,
  options: RunAgentOptions = {}
): Promise<AgentResponse> {
  const hasAnthropicConfig =
    !options.forceMock &&
    Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL);
  const modelClient =
    options.modelClient ??
    (hasAnthropicConfig ? new AnthropicModelClient() : new MockModelClient());
  const modelInfo = options.modelClient
    ? {
        provider: "custom",
        model: "Injected test/client model",
        mode: "mock" as const,
        note: "A caller supplied the model client for this run."
      }
    : {
        provider: hasAnthropicConfig ? "anthropic" : "anthropic-compatible simulator",
        model: hasAnthropicConfig
          ? process.env.ANTHROPIC_MODEL ?? "Configured Claude model"
          : "Mock Claude Haiku planner",
        mode: hasAnthropicConfig ? ("anthropic" as const) : ("mock" as const),
        note: hasAnthropicConfig
          ? "This run is using Anthropic's Messages API with client-side tool execution and tool_result responses."
          : options.forceMockReason ??
            "This run is using a deterministic mock planner because ANTHROPIC_API_KEY or ANTHROPIC_MODEL is missing. Add both to .env.local to use Claude Haiku."
      };
  const maxIterations = options.maxIterations ?? Number(process.env.AGENT_MAX_ITERATIONS ?? 8);
  const trace: TraceEvent[] = [];
  const usageTotals = { modelTurns: 0, inputTokens: 0, outputTokens: 0 };

  function emit(event: TraceEvent) {
    trace.push(event);
    options.onEvent?.(event);
  }

  emit(
    createTraceEvent(
      "learning_note",
      "Agent loop started",
      "The orchestrator will inspect stop reasons and only execute tools through the hook and MCP client."
    )
  );
  const toolTraces: ToolTrace[] = [];
  const toolResults: Array<{
    toolUseId?: string;
    toolName: ProcurementToolName;
    result: unknown;
  }> = [];
  const learningNotes: string[] = [
    "MCP tools are separated from the app so retrieval and workflow actions can be governed independently.",
    "The before-tool hook is deterministic policy enforcement before execution.",
    "Structured tool errors tell the agent whether retry, clarification, or escalation is appropriate."
  ];

  function complete(finalAnswer: string): AgentResponse {
    return {
      finalAnswer,
      modelInfo,
      usage: {
        ...usageTotals,
        estimatedCostUsd: estimateCostUsd(
          usageTotals.inputTokens,
          usageTotals.outputTokens
        )
      },
      executiveSummary: buildExecutiveSummary(toolTraces),
      auditTrail: buildAuditTrail({ userRequest, modelInfo, toolTraces }),
      enterpriseReadiness: buildEnterpriseReadiness(),
      learningModules: buildLearningModules(),
      trace,
      toolTraces,
      learningNotes
    };
  }

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    emit(
      createTraceEvent(
        "model_request",
        `Model turn ${iteration + 1}`,
        "Requesting the next model step with accumulated tool results."
      )
    );

    const turn = await modelClient.nextTurn({ userRequest, toolResults });

    usageTotals.modelTurns += 1;
    if (turn.usage) {
      usageTotals.inputTokens += turn.usage.inputTokens;
      usageTotals.outputTokens += turn.usage.outputTokens;
    }

    emit(
      createTraceEvent(
        "model_stop_reason",
        `stop_reason = ${turn.stopReason}`,
        turn.stopReason === "tool_use"
          ? "The model requested a tool, so the orchestrator continues the loop."
          : "The model ended the turn, so the orchestrator stops."
      )
    );

    if (turn.stopReason === "end_turn") {
      const finalAnswer = turn.text ?? "No final answer was returned.";
      emit(
        createTraceEvent("final_response", "Final response generated", finalAnswer)
      );
      return complete(finalAnswer);
    }

    if (!turn.toolUse) {
      return complete("The model requested tool use but did not provide a tool call.");
    }

    const toolName = turn.toolUse.name;
    const toolInput = turn.toolUse.input;
    emit(
      createTraceEvent("tool_call", `Tool requested: ${toolName}`, "The hook will inspect this call before execution.", {
        toolInput
      })
    );

    const hookDecision = beforeToolExecutionHook({
      toolName,
      toolInput,
      originalUserRequest: userRequest
    });

    emit(
      createTraceEvent(
        "hook_decision",
        hookDecision.allowed ? "Hook allowed tool" : "Hook blocked and redirected tool",
        hookDecision.reason,
        hookDecision
      )
    );

    const effectiveToolName = hookDecision.allowed
      ? toolName
      : hookDecision.redirectedToolName;
    const effectiveInput = hookDecision.allowed
      ? toolInput
      : hookDecision.redirectedInput;

    let attempt = 0;
    let call = await callMcpTool(
      effectiveToolName,
      effectiveInput as ToolInputMap[typeof effectiveToolName]
    );
    while (shouldRetryToolResult(call.result, attempt)) {
      attempt += 1;
      emit(
        createTraceEvent(
          "retry",
          `Retrying ${effectiveToolName}`,
          "The tool returned a retryable transient error.",
          { attempt }
        )
      );
      call = await callMcpTool(
        effectiveToolName,
        effectiveInput as ToolInputMap[typeof effectiveToolName]
      );
    }

    emit(
      createTraceEvent(
        "mcp_route",
        `Routed to ${call.server}`,
        `The MCP client routed ${effectiveToolName} to the ${call.server} server.`
      )
    );
    emit(
      createTraceEvent("tool_result", `Result from ${effectiveToolName}`, JSON.stringify(call.result, null, 2))
    );

    toolTraces.push({
      toolName: effectiveToolName,
      input: effectiveInput as Record<string, unknown>,
      result: call.result,
      server: call.server,
      blockedByHook: !hookDecision.allowed
    });
    toolResults.push({
      toolUseId: turn.toolUse.id,
      toolName: effectiveToolName,
      result: call.result
    });
  }

  return complete(
    "The agent stopped after the maximum loop iterations. This protects the system from runaway tool-use loops."
  );
}
