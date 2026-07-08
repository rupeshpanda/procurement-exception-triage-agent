"use client";

import { useMemo, useState } from "react";
import { demoScenarios, type DemoScenario } from "@/config/demoScenarios";
import type { AgentResponse, TraceEvent } from "@/types/trace";

const fallbackResponse: AgentResponse = {
  finalAnswer: "",
  modelInfo: {
    provider: "anthropic-compatible simulator",
    model: "Mock Claude Haiku planner",
    mode: "mock",
    note:
      "This local lab run uses a deterministic mock planner. The Anthropic Claude Haiku client is implemented server-side and can be enabled with ANTHROPIC_API_KEY and ANTHROPIC_MODEL."
  },
  usage: {
    modelTurns: 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0
  },
  executiveSummary: {
    totalExceptionValue: 0,
    delayedPoCount: 0,
    blockedInvoiceCount: 0,
    escalationsCreated: 0,
    followupsCreated: 0,
    highRiskVendors: [],
    humanApprovalRequired: false,
    headline: "Run a triage request to generate the executive summary."
  },
  auditTrail: [],
  enterpriseReadiness: {
    controls: [],
    integrationRoadmap: [],
    pilotKpis: [],
    currentLimitations: []
  },
  learningModules: [],
  trace: [],
  toolTraces: [],
  learningNotes: []
};

const TIMELINE_EVENT_TYPES = [
  "model_request",
  "model_stop_reason",
  "tool_call",
  "hook_decision",
  "mcp_route",
  "retry",
  "final_response"
];

export function LabWorkspace() {
  const [message, setMessage] = useState(demoScenarios[3].prompt);
  const [activeScenario, setActiveScenario] = useState<DemoScenario | null>(
    demoScenarios[3]
  );
  const [response, setResponse] = useState<AgentResponse>(fallbackResponse);
  const [liveTrace, setLiveTrace] = useState<TraceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const hookEvents = useMemo(
    () => response.trace.filter((event) => event.type === "hook_decision"),
    [response.trace]
  );

  const toolResultText = useMemo(() => formatToolResults(response), [response]);

  const timelineEvents = isLoading
    ? liveTrace.filter((event) => TIMELINE_EVENT_TYPES.includes(event.type))
    : response.trace.filter((event) => TIMELINE_EVENT_TYPES.includes(event.type));

  function selectScenario(scenario: DemoScenario) {
    setActiveScenario(scenario);
    setMessage(scenario.prompt);
  }

  async function runAgent() {
    setIsLoading(true);
    setError("");
    setLiveTrace([]);

    try {
      const streamed = await runAgentStreaming(message, (event) =>
        setLiveTrace((current) => [...current, event])
      );

      if (streamed) {
        setResponse(streamed);
        return;
      }

      // Fallback for environments where SSE is unavailable.
      const result = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message })
      });
      const payload = await result.json();
      if (!result.ok) {
        throw new Error(payload.error?.message ?? "Agent request failed.");
      }
      setResponse(payload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Agent request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <section className="border-b border-[var(--line)] bg-[#f3efe4]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                EleganceAI.ai Lab
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 md:text-5xl">
                Procurement Exception Triage Agent
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-700">
                An enterprise agentic AI pilot: Claude Haiku investigates delayed
                POs, blocked invoices, and vendor risk through governed MCP
                tools — with deterministic hooks, structured errors, and
                human-review escalation you can watch live.
              </p>
            </div>
            <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 lg:max-w-md">
              Demo boundary: mock procurement data only. The agent cannot
              approve payments, release invoices, change purchase orders, or
              touch production systems — and the demo shows why that matters.
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Guided scenarios — pick one, then run
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {demoScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => selectScenario(scenario)}
                  className={`rounded border p-3 text-left transition ${
                    activeScenario?.id === scenario.id
                      ? "border-[var(--accent-strong)] bg-white shadow-sm"
                      : "border-zinc-300 bg-white/60 hover:border-[var(--accent)]"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-strong)]">
                    {scenario.audience}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-zinc-950">
                    {scenario.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex flex-col gap-5">
          <div className="rounded border border-[var(--line)] bg-white p-4">
            <label className="text-sm font-semibold text-zinc-900" htmlFor="prompt">
              Procurement request
            </label>
            <textarea
              id="prompt"
              className="mt-3 min-h-28 w-full resize-y rounded border border-zinc-300 px-3 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)]"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={runAgent}
                disabled={isLoading}
              >
                {isLoading ? "Agent running…" : "Run triage"}
              </button>
              {isLoading ? (
                <span className="text-sm text-zinc-600">
                  Streaming the agent loop live — watch the timeline below.
                </span>
              ) : null}
            </div>
            {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
          </div>

          {activeScenario ? (
            <div className="rounded border border-[var(--accent)] bg-[#fbfaf5] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                Why this scenario matters — {activeScenario.audience}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-800">
                {activeScenario.executiveNarrative}
              </p>
              <ul className="mt-3 grid gap-1.5 text-sm leading-6 text-zinc-700">
                {activeScenario.whatToWatch.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded bg-zinc-100 px-3 py-2 text-xs leading-5 text-zinc-600">
                <span className="font-semibold">Claude Architect exam concept:</span>{" "}
                {activeScenario.examConcept}
              </p>
            </div>
          ) : null}

          <Panel title={isLoading ? "Agent Loop — Live" : "Agent Loop Timeline"}>
            <div className="grid gap-3">
              {timelineEvents.length ? (
                timelineEvents.map((event, index) => (
                  <TimelineRow key={event.id} event={event} index={index} />
                ))
              ) : (
                <p className="text-sm leading-6 text-zinc-600">
                  Run a request to watch the loop unfold step by step: model
                  turn → stop reason → tool request → hook decision → MCP route
                  → final response.
                </p>
              )}
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
                  Waiting for the next event…
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel title="Agent Answer">
            <pre className="whitespace-pre-wrap text-sm leading-6 text-zinc-800">
              {response.finalAnswer || "Run a triage request to see the final answer."}
            </pre>
          </Panel>

          <Panel title="Executive Summary">
            <div className="grid gap-4">
              <p className="text-sm leading-6 text-zinc-700">
                {response.executiveSummary.headline}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Metric
                  label="Exception Value Reviewed"
                  value={formatCurrency(response.executiveSummary.totalExceptionValue)}
                />
                <Metric
                  label="Delayed POs"
                  value={String(response.executiveSummary.delayedPoCount)}
                />
                <Metric
                  label="Blocked Invoices"
                  value={String(response.executiveSummary.blockedInvoiceCount)}
                />
                <Metric
                  label="Follow-ups Created"
                  value={String(response.executiveSummary.followupsCreated)}
                />
                <Metric
                  label="Escalations Created"
                  value={String(response.executiveSummary.escalationsCreated)}
                />
                <Metric
                  label="Human Approval"
                  value={
                    response.executiveSummary.humanApprovalRequired
                      ? "Required"
                      : "Not required"
                  }
                />
              </div>
              {response.executiveSummary.highRiskVendors.length ? (
                <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                  High-risk vendor pattern detected:{" "}
                  {response.executiveSummary.highRiskVendors.join(", ")}
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel title="Run Cost & Tokens">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Model Turns" value={String(response.usage.modelTurns)} />
              <Metric
                label="Input Tokens"
                value={response.usage.inputTokens.toLocaleString()}
              />
              <Metric
                label="Output Tokens"
                value={response.usage.outputTokens.toLocaleString()}
              />
              <Metric
                label="Est. Cost (Haiku)"
                value={
                  response.modelInfo.mode === "anthropic"
                    ? `$${response.usage.estimatedCostUsd.toFixed(4)}`
                    : "$0 (mock)"
                }
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              A full multi-tool triage on Claude Haiku typically costs a fraction
              of a cent — the economics a CIO asks about before piloting.
            </p>
          </Panel>

          <Panel title="Tool Result Data">
            <textarea
              className="min-h-72 w-full resize-y rounded border border-zinc-300 bg-zinc-50 px-3 py-3 font-mono text-xs leading-5 text-zinc-800 outline-none"
              readOnly
              value={
                toolResultText ||
                "Tool result data will appear here after the agent calls MCP tools."
              }
            />
          </Panel>

          <Panel title="MCP Tool Trace">
            <div className="grid gap-3">
              {response.toolTraces.length ? (
                response.toolTraces.map((toolTrace, index) => (
                  <div key={`${toolTrace.toolName}-${index}`} className="rounded border border-zinc-200 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      <span>{toolTrace.toolName}</span>
                      <span className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
                        {toolTrace.server}
                      </span>
                      {toolTrace.blockedByHook ? (
                        <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">
                          redirected by hook
                        </span>
                      ) : null}
                      {toolTrace.result && !toolTrace.result.success ? (
                        <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                          structured error
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 grid gap-2 text-sm leading-6 text-zinc-700">
                      <p>
                        <span className="font-semibold text-zinc-900">Purpose:</span>{" "}
                        {describeToolPurpose(toolTrace.toolName)}
                      </p>
                      <p>
                        <span className="font-semibold text-zinc-900">Input:</span>{" "}
                        <code className="break-words rounded bg-zinc-100 px-1 py-0.5 text-xs">
                          {JSON.stringify(toolTrace.input)}
                        </code>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-600">No tools have run yet.</p>
              )}
            </div>
          </Panel>

          <Panel title="Audit Trail">
            <div className="grid gap-3">
              {response.auditTrail.length ? (
                response.auditTrail.map((entry) => (
                  <div key={entry.id} className="rounded border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-950">{entry.action}</p>
                      <span className="rounded bg-white px-2 py-1 text-xs text-zinc-600">
                        {entry.actor}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-zinc-700">
                      <span className="font-semibold">Control:</span> {entry.control}
                    </p>
                    <p className="text-sm leading-6 text-zinc-700">
                      <span className="font-semibold">Outcome:</span> {entry.outcome}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-zinc-600">
                  Audit events will appear after a run. They record the user
                  request, planner identity, hook decisions, MCP routing, and
                  structured tool outcomes.
                </p>
              )}
            </div>
          </Panel>
        </div>

        <aside className="flex flex-col gap-5">
          <Panel title="Agent Runtime">
            <div className="grid gap-3 text-sm leading-6 text-zinc-700">
              <RuntimeRow label="Planner" value={response.modelInfo.model} />
              <RuntimeRow label="Provider" value={response.modelInfo.provider} />
              <RuntimeRow label="Mode" value={response.modelInfo.mode} />
              <p className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-blue-900">
                {response.modelInfo.note}
              </p>
            </div>
          </Panel>

          <Panel title="Hook Policy">
            <div className="grid gap-2 text-sm leading-6 text-zinc-700">
              <p>
                The hook runs before every MCP tool call. It checks the tool
                name, input, and original request before execution.
              </p>
              <p>
                Read-only lookup tools are allowed even when a high-value amount
                is mentioned.
              </p>
              <p>
                Workflow actions above $25,000 are blocked and redirected to a
                pending human-review escalation.
              </p>
            </div>
          </Panel>

          <Panel title="Hook Decisions">
            <div className="grid gap-3">
              {hookEvents.length ? (
                hookEvents.map((event) => (
                  <HookDecisionCard key={event.id} event={event} />
                ))
              ) : (
                <p className="text-sm text-zinc-600">Hook decisions appear after tool requests.</p>
              )}
            </div>
          </Panel>

          <Panel title="Learning Notes">
            <div className="grid gap-4 text-sm leading-6 text-zinc-700">
              {(response.learningModules.length
                ? response.learningModules
                : [
                    {
                      title: "Claude Tool Use Loop",
                      concept:
                        "Claude returns tool_use when it needs enterprise context.",
                      whatToObserve:
                        "Run a prompt and watch the model/tool/hook sequence appear.",
                      enterpriseMapping:
                        "The model reasons, but enterprise systems supply facts and controls."
                    }
                  ]
              ).map((module) => (
                <LearningBlock
                  key={module.title}
                  title={module.title}
                  body={`${module.concept} Observe: ${module.whatToObserve} Enterprise mapping: ${module.enterpriseMapping}`}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Enterprise Controls">
            <List
              items={
                response.enterpriseReadiness.controls.length
                  ? response.enterpriseReadiness.controls
                  : ["Controls will appear after a run."]
              }
            />
          </Panel>

          <Panel title="Integration Roadmap">
            <div className="grid gap-3">
              {response.enterpriseReadiness.integrationRoadmap.length ? (
                response.enterpriseReadiness.integrationRoadmap.map((item) => (
                  <div key={item.labCapability} className="rounded border border-zinc-200 bg-zinc-50 p-3">
                    <p className="text-sm font-semibold text-zinc-950">
                      {item.labCapability}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-700">
                      {item.enterpriseSystem}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-600">
                      {item.productionNotes}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-zinc-600">
                  Run the lab to see how mock tools map to SAP, Ariba, ServiceNow,
                  Jira, Teams, and workflow systems.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Pilot KPIs">
            <List
              items={
                response.enterpriseReadiness.pilotKpis.length
                  ? response.enterpriseReadiness.pilotKpis
                  : ["Pilot KPIs will appear after a run."]
              }
            />
          </Panel>

          <Panel title="Current Limits">
            <List
              items={
                response.enterpriseReadiness.currentLimitations.length
                  ? response.enterpriseReadiness.currentLimitations
                  : ["Limitations will appear after a run."]
              }
            />
          </Panel>

          <Panel title="Architecture">
            <div className="grid gap-2 text-sm leading-6 text-zinc-700">
              <p>Next.js Lab App</p>
              <p>Claude Haiku Agent Orchestrator</p>
              <p>MCP Client Layer</p>
              <p>Procurement Data MCP Server</p>
              <p>Procurement Workflow MCP Server</p>
              <p>Business-Rule Hook and Trace Layer</p>
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}

async function runAgentStreaming(
  message: string,
  onEvent: (event: TraceEvent) => void
): Promise<AgentResponse | null> {
  const result = await fetch("/api/agent/stream", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message })
  });

  if (!result.ok) {
    const payload = await result.json().catch(() => null);
    throw new Error(payload?.error?.message ?? "Agent request failed.");
  }

  if (!result.body || !result.headers.get("content-type")?.includes("text/event-stream")) {
    return null;
  }

  const reader = result.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResponse: AgentResponse | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      const eventMatch = chunk.match(/^event: (.+)$/m);
      const dataMatch = chunk.match(/^data: (.+)$/m);
      if (!eventMatch || !dataMatch) {
        continue;
      }

      const eventName = eventMatch[1];
      const data = JSON.parse(dataMatch[1]);

      if (eventName === "trace") {
        onEvent(data as TraceEvent);
      } else if (eventName === "result") {
        finalResponse = data as AgentResponse;
      } else if (eventName === "error") {
        throw new Error(data.message ?? "Agent run failed.");
      }
    }
  }

  return finalResponse;
}

function TimelineRow({
  event,
  index
}: Readonly<{
  event: TraceEvent;
  index: number;
}>) {
  const badge = timelineBadge(event);
  return (
    <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
        {index + 1}
      </div>
      <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-zinc-950">{event.title}</p>
          {badge ? (
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
              {badge.label}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-6 text-zinc-700">
          {translateTraceEvent(event)}
        </p>
      </div>
    </div>
  );
}

function timelineBadge(event: TraceEvent) {
  switch (event.type) {
    case "model_request":
      return { label: "model", className: "bg-blue-100 text-blue-800" };
    case "model_stop_reason":
      return { label: "stop reason", className: "bg-indigo-100 text-indigo-800" };
    case "tool_call":
      return { label: "tool request", className: "bg-purple-100 text-purple-800" };
    case "hook_decision": {
      const blocked = (event.metadata as { allowed?: boolean } | undefined)?.allowed === false;
      return blocked
        ? { label: "hook: blocked", className: "bg-amber-100 text-amber-800" }
        : { label: "hook: allowed", className: "bg-emerald-100 text-emerald-800" };
    }
    case "mcp_route":
      return { label: "mcp route", className: "bg-teal-100 text-teal-800" };
    case "retry":
      return { label: "retry", className: "bg-orange-100 text-orange-800" };
    case "final_response":
      return { label: "final", className: "bg-zinc-200 text-zinc-800" };
    default:
      return null;
  }
}

function Metric({
  label,
  value
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function List({ items }: Readonly<{ items: string[] }>) {
  return (
    <ul className="grid gap-2 text-sm leading-6 text-zinc-700">
      {items.map((item) => (
        <li key={item} className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function LearningBlock({
  title,
  body
}: Readonly<{
  title: string;
  body: string;
}>) {
  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
      <p className="font-semibold text-zinc-950">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

function translateTraceEvent(event: TraceEvent) {
  if (event.type === "model_request") {
    return "The orchestrator asked the planner for the next step using the original request plus all tool results gathered so far.";
  }

  if (event.type === "model_stop_reason") {
    return event.detail;
  }

  if (event.type === "tool_call") {
    return "The planner selected a tool. The app has not executed it yet; first it must pass the business-rule hook.";
  }

  if (event.type === "hook_decision") {
    return event.detail;
  }

  if (event.type === "mcp_route") {
    return "The MCP client chose the correct enterprise boundary for the tool: read-only data server or controlled workflow server.";
  }

  if (event.type === "retry") {
    return "The tool returned a retryable transient error, so the orchestrator retried it automatically.";
  }

  if (event.type === "final_response") {
    return "The planner returned end_turn, so the orchestrator stopped and displayed the final answer.";
  }

  return event.detail;
}

function RuntimeRow({
  label,
  value
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-semibold text-zinc-900">{value}</span>
    </div>
  );
}

function HookDecisionCard({
  event
}: Readonly<{
  event: TraceEvent;
}>) {
  const decision = event.metadata as
    | {
        allowed?: boolean;
        reason?: string;
        redirectedToolName?: string;
        detectedAmount?: number;
      }
    | undefined;
  const blocked = decision?.allowed === false;

  return (
    <div
      className={`rounded border p-3 ${
        blocked ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <p className="text-sm font-semibold text-zinc-950">
        {blocked ? "Blocked before execution" : "Allowed before execution"}
      </p>
      <p className="mt-1 text-sm leading-6 text-zinc-700">{event.detail}</p>
      {blocked ? (
        <div className="mt-2 grid gap-1 text-sm leading-6 text-amber-900">
          <p>Detected amount: ${decision?.detectedAmount?.toLocaleString() ?? "unknown"}</p>
          <p>Redirected to: {decision?.redirectedToolName}</p>
        </div>
      ) : null}
    </div>
  );
}

function formatToolResults(response: AgentResponse) {
  if (!response.toolTraces.length) {
    return "";
  }

  return response.toolTraces
    .map((toolTrace, index) => {
      const heading = `${index + 1}. ${toolTrace.toolName} (${toolTrace.server})`;
      return `${heading}\n${JSON.stringify(toolTrace.result, null, 2)}`;
    })
    .join("\n\n");
}

function describeToolPurpose(toolName: string) {
  const descriptions: Record<string, string> = {
    search_purchase_orders:
      "Looks up PO status, delivery delay, amount, expected delivery, and goods receipt status.",
    search_invoice_exceptions:
      "Looks up blocked invoices, missing goods receipt, price variance, quantity variance, and payment block details.",
    search_vendor_history:
      "Looks up vendor risk, recurring issue patterns, late deliveries, invoice exceptions, and prior escalations.",
    create_procurement_followup:
      "Creates a local mock follow-up task without approving, releasing, or closing anything.",
    escalate_procurement_issue:
      "Creates a local mock pending-review escalation for human approval."
  };

  return descriptions[toolName] ?? "Runs a registered procurement MCP tool.";
}

function Panel({
  title,
  children
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded border border-[var(--line)] bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-600">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
