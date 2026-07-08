export type McpMode = "stdio" | "in-process";

export const MCP_CONFIG = {
  mode: (process.env.MCP_MODE ?? "in-process") as McpMode
};
