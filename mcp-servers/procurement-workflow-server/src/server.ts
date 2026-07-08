import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  createProcurementFollowup,
  escalateProcurementIssue
} from "../../../src/tools/procurementWorkflowTools";
import {
  createProcurementFollowupSchema,
  escalateProcurementIssueSchema
} from "../../../src/tools/toolSchemas";

function textResult(result: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

export function createProcurementWorkflowServer() {
  const server = new McpServer({
    name: "procurement-workflow-server",
    version: "0.1.0"
  });

  server.tool(
    "create_procurement_followup",
    "Create a local mock procurement follow-up task. Never approve payments, release invoices, close POs, or send external vendor communication.",
    createProcurementFollowupSchema.shape,
    async (input) => textResult(createProcurementFollowup(input))
  );

  server.tool(
    "escalate_procurement_issue",
    "Create a local mock human-review escalation record when amount, risk, permission, or unresolved exception rules require review.",
    escalateProcurementIssueSchema.shape,
    async (input) => textResult(escalateProcurementIssue(input))
  );

  return server;
}

export async function startProcurementWorkflowServer() {
  const server = createProcurementWorkflowServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
