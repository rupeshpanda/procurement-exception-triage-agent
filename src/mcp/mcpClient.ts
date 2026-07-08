import { MCP_CONFIG } from "@/config/mcp";
import { callInProcessTool } from "@/mcp/inProcessMcpAdapter";
import { callLocalStdioTool } from "@/mcp/localStdioMcpClient";
import { getToolServer } from "@/mcp/mcpServerRegistry";
import type { ProcurementToolName, ToolInputMap, ToolOutputMap, ToolResult } from "@/types/tools";

export async function callMcpTool<TName extends ProcurementToolName>(
  toolName: TName,
  input: ToolInputMap[TName]
): Promise<{
  server: "procurement-data" | "procurement-workflow";
  result: ToolResult<ToolOutputMap[TName]>;
}> {
  const server = getToolServer(toolName);
  const result =
    MCP_CONFIG.mode === "stdio"
      ? await callLocalStdioTool(toolName, input)
      : await callInProcessTool(toolName, input);

  return { server, result };
}
