# Procurement Exception Triage Agent

## A Practical Enterprise Agentic AI Prototype

Procurement teams often work across purchase orders, invoices, goods receipts,
supplier performance data, and approval workflows. Exceptions are rarely solved
from one screen.

This lab shows how an enterprise agent can investigate delayed purchase orders,
blocked invoices, missing goods receipts, vendor risk, and escalation rules
using governed tools and human-in-the-loop controls.

Example request:

```text
Check Apex delayed POs, review invoice INV-90031, check vendor history, create a follow-up for tomorrow, and escalate anything above $25,000.
```

Architecture:

```text
Next.js Lab App
   +
Claude Haiku Agent Orchestrator
   +
MCP Client Layer
   +
Procurement Data MCP Server
   +
Procurement Workflow MCP Server
```

The data server is read-only. The workflow server can create local mock
follow-up and escalation records, but it cannot approve payments, release
invoices, close POs, or modify SAP data.

Enterprise agents should not only know how to act. They should also know when
not to act.

The value of enterprise AI will not come from the model alone. It will come from
connecting models to business context, enterprise tools, process knowledge,
approval rules, and human-in-the-loop controls.

The SAP extension path includes SAP S/4HANA purchase order APIs, invoice
verification, supplier master data, SAP Ariba scorecards, and workflow approval
integration.
