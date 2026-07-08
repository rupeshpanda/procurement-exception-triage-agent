import { toolDefinitions } from "@/tools/definitions";
import type { ProcurementToolName } from "@/types/tools";

export function getToolServer(toolName: ProcurementToolName) {
  const definition = toolDefinitions.find((tool) => tool.name === toolName);
  if (!definition) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  return definition.server;
}

export function listToolsForServer(server: "procurement-data" | "procurement-workflow") {
  return toolDefinitions.filter((tool) => tool.server === server);
}
