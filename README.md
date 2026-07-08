# Procurement Exception Triage Agent

A practical enterprise agentic AI lab for procurement exception triage.

This project demonstrates how an AI agent can investigate delayed purchase
orders, blocked invoices, missing goods receipts, price and quantity variance,
vendor risk, follow-up actions, approval thresholds, and escalation
requirements.

The lab is intentionally learning-first. It shows the agent loop, MCP routing,
hook decisions, structured errors, and human-review escalation in the UI.

## SAP-Realistic Mock Data

The mock dataset mirrors real S/4HANA structures so demos feel credible to
procurement teams: SAP document numbers (45xxxxxxxx POs, 51xxxxxxxx invoice
docs), company codes, plants, purchasing groups, payment terms, invoice
blocking messages (e.g. `M8 504 Quantity invoiced greater than goods receipt
quantity`), payment block codes (`R`, `A`), and full three-way-match detail
(PO qty vs goods receipt qty vs invoice qty). Vendors carry SAP vendor
numbers, on-time delivery rates, and YTD spend.

## Demo Boundary

This lab uses mock procurement data. It does not connect to real SAP, approve
payments, release invoices, change purchase orders, or modify production
systems.

When an action requires approval, the agent should say that it did not complete
the action automatically because human approval is required.

## Architecture

```text
Next.js Lab App
   +
Claude Haiku Agent Orchestrator
   +
MCP Client Layer
   +
Two MCP Servers
```

The two MCP servers are deliberately split:

- Procurement Data MCP Server: read-only context retrieval.
- Procurement Workflow MCP Server: controlled local mock workflow records.

This teaches a core enterprise architecture principle: separate context
retrieval tools from workflow and action tools.

## Tools

Data MCP Server:

- `search_purchase_orders`
- `search_invoice_exceptions`
- `search_vendor_history`

Workflow MCP Server:

- `create_procurement_followup`
- `escalate_procurement_issue`

`search_purchase_orders` is for PO status, delivery status, goods receipt
status, overdue POs, PO amount, and expected delivery date.

`search_invoice_exceptions` is for blocked invoices, payment blocks, price
variance, quantity variance, missing goods receipt exceptions, and invoice
exception status.

## MCP Modes

Local learning mode uses real stdio MCP server entry points:

```bash
npm run mcp:data
npm run mcp:workflow
```

Vercel demo mode uses an MCP-compatible in-process adapter. This avoids
requiring Vercel to spawn long-running stdio MCP processes while preserving the
same tool names, schemas, structured errors, guardrails, and trace format.

Future production mode can move the MCP servers to Streamable HTTP on a
separate runtime such as Railway, Render, Fly.io, AWS, or a containerized
service.

## Guided Demo Scenarios

The lab ships five one-click scenarios, each written for a specific executive
audience (AP manager, CFO/controls, sourcing lead, end-to-end demo, and
risk/compliance). Each scenario card explains what to watch and maps the run
to a Claude Architect exam concept. The "Ask it to break the rules" scenario
deliberately requests an unsafe payment action so visitors can watch the
workflow server reject it with a structured permission error.

## Live Streaming

`POST /api/agent/stream` returns Server-Sent Events. Every agent-loop event
(model turn, stop reason, tool request, hook decision, MCP route, retry, final
response) streams to the browser as it happens, so the UI shows the agent
working in real time. `POST /api/agent` remains available as a non-streaming
fallback.

## Cost & Token Tracking

Each run aggregates `usage.input_tokens` and `usage.output_tokens` from the
Anthropic Messages API across all model turns and estimates cost using Claude
Haiku 4.5 list pricing ($1/MTok input, $5/MTok output, overridable via env).
The UI shows model turns, tokens, and estimated cost per triage run.

## Public-Deployment Guardrails

Because the hosted demo exposes a real Claude key server-side, three
deterministic guardrails protect it:

- Per-IP rate limit (`RATE_LIMIT_PER_MINUTE`, default 6)
- Prompt length cap (`MAX_MESSAGE_CHARS`, default 1500)
- Daily spend budget (`DAILY_BUDGET_USD`, default $5) — when reached, runs
  fall back gracefully to the deterministic mock planner and say so

State is in-memory per serverless instance, which is documented as a demo
limitation; production systems would use Redis or a gateway policy. The
lesson is the same one the before-tool hook teaches: policy enforcement must
be deterministic code the model cannot bypass.

## Agentic Loop

The orchestrator inspects the model stop reason:

- `tool_use`: run the before-tool hook, route through the MCP client, return the
  result to the model, and continue.
- `end_turn`: stop and return the final answer.

The loop is capped by `AGENT_MAX_ITERATIONS`, defaulting to 8. This prevents
runaway tool-use loops.

## Structured Errors

Every tool returns one of these shapes:

```json
{ "success": true, "data": {} }
```

```json
{
  "success": false,
  "error": {
    "errorCategory": "transient | validation | permission",
    "isRetryable": true,
    "message": "Human-readable explanation",
    "details": {}
  }
}
```

Transient errors may be retried. Validation and permission errors are not
retried.

## Business-Rule Hook

`beforeToolExecutionHook` enforces deterministic policy before tool execution.

Any workflow action involving an amount greater than `$25,000` is blocked and
redirected to `escalate_procurement_issue`.

Read-only search tools are allowed even when high-value amounts are mentioned,
because gathering context is not the same as processing a transaction.

## Workflow Guardrails

The workflow server rejects unsafe language such as:

- approve payment
- release payment
- clear payment block
- close PO
- approve invoice
- release invoice

This is defense in depth: the app-level hook protects before execution, and the
workflow server protects its own boundary.

## Claude Haiku Configuration

Claude calls must happen server-side. Never expose `ANTHROPIC_API_KEY` in the
browser.

Create `.env.local` by copying `.env.local.example`:

```bash
copy .env.local.example .env.local
```

Then edit `.env.local`:

```text
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
NEXT_PUBLIC_LAB_TITLE=Procurement Exception Triage Agent
AGENT_MAX_ITERATIONS=8
AGENT_APPROVAL_THRESHOLD=25000
```

The current Anthropic docs list Claude Haiku 4.5 as
`claude-haiku-4-5-20251001` with alias `claude-haiku-4-5`. Keep the model ID in
`.env.local` instead of hardcoding it through the app.

When both `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` are present, the app uses
Anthropic's Messages API with real client-side tool use:

1. Claude returns `stop_reason: "tool_use"` and a `tool_use` block.
2. The orchestrator runs the business-rule hook.
3. The MCP client executes the selected local tool.
4. The app sends the result back to Claude as a `tool_result` block.
5. Claude either asks for another tool or returns `end_turn`.

If either environment variable is missing, the app clearly falls back to the
deterministic mock planner so the lab still runs locally.

## Run Locally

```bash
cd "000 Agentic AI/procurement-exception-triage-agent"
npm install
npm run dev
```

Open:

```text
http://localhost:3000/lab/procurement-exception-triage-agent
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

## GitHub

```bash
cd "000 Agentic AI/procurement-exception-triage-agent"
git init
git add .
git commit -m "Initial procurement exception triage agent lab with MCP servers"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

Suggested repo name:

```text
procurement-exception-triage-agent
```

## Vercel Deployment

1. Push project to GitHub.
2. Open Vercel.
3. Import the GitHub repository.
4. Confirm the framework is Next.js.
5. Add environment variables:
   `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `NEXT_PUBLIC_LAB_TITLE`,
   `AGENT_MAX_ITERATIONS`, and `AGENT_APPROVAL_THRESHOLD`.
6. Deploy Preview.
7. Test the lab app.
8. Promote to Production.
9. Copy the production URL.
10. Add the link to the EleganceAI.ai Lab section.

Hosted Vercel mode uses the MCP-compatible in-process adapter in version 1.
Local learning mode uses real stdio MCP servers.

## SAP Extension Path

Version 2 can replace mock data with:

- SAP S/4HANA purchase order APIs
- SAP invoice verification data
- SAP Business Partner supplier data
- SAP workflow approvals
- SAP Ariba supplier scorecards
- ServiceNow, Jira, Teams, or email draft integrations

The same governance pattern should remain: read-only retrieval, controlled
workflow tools, deterministic business rules, structured errors, and
human-in-the-loop escalation.

## Claude Architect Certification Map

This lab covers:

- MCP tool definition
- Similar tool disambiguation
- Agentic loop stop reasons
- Tool result passing
- Structured errors
- Retryability
- Deterministic hooks
- Defense-in-depth guardrails
- Human-in-the-loop escalation
- Observability through traces

Enterprise agents should not only know how to act. They should also know when
not to act.
