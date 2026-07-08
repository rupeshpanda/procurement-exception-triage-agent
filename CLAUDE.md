# Procurement Exception Triage Agent — Project Notes

Enterprise agentic AI lab for the eleganceai.ai Lab section and Claude
Architect exam practice. Read README.md for full architecture.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind, Vitest
- Claude Haiku via raw Anthropic Messages API (`src/agent/anthropicClient.ts`)
  — deliberately raw HTTP, not the SDK, to teach the wire-level tool-use loop
- Two MCP servers: `procurement-data` (read-only) and `procurement-workflow`
  (governed actions); in-process adapter on Vercel, stdio locally
- Deterministic before-tool hook blocks workflow actions > $25,000 and
  redirects to `escalate_procurement_issue`

## Status (2026-07-08)

- Tests: 31 passing (`npm test`). Build passes (`npm run build`).
- GitHub (public): https://github.com/rupeshpanda/procurement-exception-triage-agent
  — pushes to `main` auto-deploy via connected Vercel project.
- Vercel: project `procurement-exception-triage-agent`, team
  `rupesh-s-eleganceai`. Production: https://procurement-exception-triage-agent.vercel.app
  (lab page at `/lab/procurement-exception-triage-agent`).
- Env vars set on Vercel production: ANTHROPIC_MODEL, NEXT_PUBLIC_LAB_TITLE,
  AGENT_MAX_ITERATIONS, AGENT_APPROVAL_THRESHOLD, RATE_LIMIT_PER_MINUTE,
  MAX_MESSAGE_CHARS, DAILY_BUDGET_USD.

## Features shipped this session

- SSE streaming agent loop (`/api/agent/stream`) with live UI timeline
- Five guided demo scenarios with executive narratives + exam-concept mapping
  (`src/config/demoScenarios.ts`), incl. a guardrail probe that yields a
  structured permission error
- Token usage + per-run cost estimation (Haiku 4.5: $1/$5 per MTok)
- Public-deployment guardrails (`src/security/`): per-IP rate limit,
  prompt-length cap, daily budget with graceful mock fallback (in-memory —
  documented demo limitation)
- SAP-realistic mock data: SAP doc numbers, company codes, payment block
  codes, M8 blocking messages, three-way-match detail; third vendor
  (Meridian Logistics Group, critical risk)

## Next steps

1. **Rotate the Anthropic API key** — the first key was accidentally pasted
   into ANTHROPIC_MODEL and echoed in a public API error response before the
   error-sanitization fix landed. Create a new key at console.anthropic.com,
   update it in Vercel (Production), redeploy, and delete the old key.
2. Add a Lab card on eleganceai.ai linking to the production URL.
3. Optional: point a subdomain (e.g. labs.eleganceai.ai) at the Vercel project.
4. Do not merge this app into the eleganceai.ai codebase unless explicitly asked.

## Live-mode status (2026-07-08, later session)

- Production is on live Claude Haiku (`mode: anthropic`), verified end to end:
  real tool-use loops, hook block on $42K action redirecting to escalation,
  ~$0.005–0.006 per triage run.
- Env-var gotchas learned: piping values via PowerShell `echo` can store empty
  strings — use bash `printf 'value' | vercel env add ...`. Sensitive vars
  pull as empty from `vercel env pull`; that is expected.
- Upstream Anthropic error bodies are logged server-side only and never
  returned to clients (they can echo request fields).

## Working agreements

- Run `npm test` and `npm run build` before changing code.
- Keep the app learning-first: agent loop, MCP tools, hooks, structured
  errors, governance, auditability, SAP/enterprise mapping.
- Explain-as-we-build: tie changes to Claude Architect exam concepts and end
  sessions with 2–3 quiz questions.
