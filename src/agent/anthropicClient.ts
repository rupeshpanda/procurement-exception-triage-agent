import { validateModelConfig } from "@/config/model";
import { getAnthropicTools } from "@/tools/anthropicToolSchemas";
import type { ModelClient, ModelClientContext, ModelTurn } from "@/agent/modelClient";
import type { ProcurementToolName } from "@/types/tools";

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    }
  | {
      type: "tool_result";
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    };

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

export class AnthropicModelClient implements ModelClient {
  private messages: AnthropicMessage[] = [];
  private appendedToolResults = 0;

  async nextTurn(context: ModelClientContext): Promise<ModelTurn> {
    validateModelConfig();

    if (!this.messages.length) {
      this.messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: context.userRequest
          }
        ]
      });
    }

    const newToolResults = context.toolResults.slice(this.appendedToolResults);
    for (const toolResult of newToolResults) {
      this.messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolResult.toolUseId ?? toolResult.toolName,
            content: JSON.stringify(toolResult.result, null, 2),
            is_error:
              typeof toolResult.result === "object" &&
              toolResult.result !== null &&
              "success" in toolResult.result &&
              (toolResult.result as { success?: unknown }).success === false
          }
        ]
      });
    }
    this.appendedToolResults = context.toolResults.length;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL,
        max_tokens: 1600,
        system:
          "You are an enterprise procurement exception triage agent. Use the provided tools to investigate procurement facts before answering. Separate purchase order status from invoice exception status. Never claim to approve payment, release invoices, close POs, or modify production systems. If a tool result shows a permission or threshold block, explain that the action was not completed automatically and requires human review.",
        messages: this.messages,
        tools: getAnthropicTools(),
        tool_choice: { type: "auto" }
      })
    });

    if (!response.ok) {
      // Log detail server-side only. Upstream error bodies can echo request
      // fields, so they must never propagate into a client-visible message.
      const text = await response.text();
      console.error(`Anthropic request failed: ${response.status} ${text}`);
      throw new Error(
        `The Claude API request failed with status ${response.status}. Check the server logs and the ANTHROPIC_API_KEY / ANTHROPIC_MODEL configuration.`
      );
    }

    const payload = (await response.json()) as {
      stop_reason: "tool_use" | "end_turn";
      content: AnthropicContentBlock[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    this.messages.push({
      role: "assistant",
      content: payload.content
    });

    const usage = {
      inputTokens: payload.usage?.input_tokens ?? 0,
      outputTokens: payload.usage?.output_tokens ?? 0
    };

    const toolUse = payload.content.find((item) => item.type === "tool_use");
    if (payload.stop_reason === "tool_use" && toolUse?.type === "tool_use") {
      return {
        stopReason: "tool_use",
        toolUse: {
          id: toolUse.id,
          name: toolUse.name as ProcurementToolName,
          input: toolUse.input
        },
        usage
      };
    }

    return {
      stopReason: "end_turn",
      text: payload.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n"),
      usage
    };
  }
}
