import type { ProcurementToolName, ToolInputMap, ToolOutputMap, ToolResult } from "@/types/tools";

export async function callLocalStdioTool<TName extends ProcurementToolName>(
  toolName: TName,
  _input: ToolInputMap[TName]
): Promise<ToolResult<ToolOutputMap[TName]>> {
  return {
    success: false,
    error: {
      errorCategory: "validation",
      isRetryable: false,
      message:
        "Local stdio MCP client invocation is documented for learning mode. Use npm run mcp:data and npm run mcp:workflow to inspect tool discovery; the app uses the in-process adapter by default for Vercel compatibility.",
      details: { toolName }
    }
  };
}
