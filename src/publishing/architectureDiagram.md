# Architecture Diagram

```text
Next.js Lab App
   |
   v
Claude Haiku Agent Orchestrator
   |
   v
MCP Client Layer
   |
   +--> Procurement Data MCP Server
   |       - search_purchase_orders
   |       - search_invoice_exceptions
   |       - search_vendor_history
   |
   +--> Procurement Workflow MCP Server
           - create_procurement_followup
           - escalate_procurement_issue
```

The Next.js Lab App provides the user interface and trace display.

The Agent Orchestrator controls the stop-reason loop, tool-use handling,
structured errors, retries, hook decisions, and final response.

The MCP Client Layer routes tool calls to the correct server and normalizes tool
responses.

The Procurement Data MCP Server is read-only and retrieves procurement context.

The Procurement Workflow MCP Server creates controlled local mock workflow
records and enforces workflow guardrails.
