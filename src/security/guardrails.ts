// In-memory request guardrails for the public demo deployment.
//
// These protect the ANTHROPIC_API_KEY budget on a public URL:
// 1. Per-IP sliding-window rate limit
// 2. Prompt length cap
// 3. Daily spend budget with graceful fallback to the mock planner
//
// Limitation (documented deliberately for the lab): state is per serverless
// instance, so limits are approximate on Vercel. That is acceptable for a
// demo guardrail; a production system would use Redis/Upstash or an API
// gateway policy. The pattern — deterministic pre-request policy checks that
// the model cannot bypass — is the same either way.

export const GUARDRAIL_LIMITS = {
  requestsPerMinute: Number(process.env.RATE_LIMIT_PER_MINUTE ?? 6),
  maxMessageChars: Number(process.env.MAX_MESSAGE_CHARS ?? 1500),
  dailyBudgetUsd: Number(process.env.DAILY_BUDGET_USD ?? 5)
};

const WINDOW_MS = 60_000;

const requestLog = new Map<string, number[]>();
let spendDayKey = currentDayKey();
let spendTodayUsd = 0;

function currentDayKey() {
  return new Date().toISOString().slice(0, 10);
}

function rollDayIfNeeded() {
  const key = currentDayKey();
  if (key !== spendDayKey) {
    spendDayKey = key;
    spendTodayUsd = 0;
  }
}

export function checkRateLimit(clientId: string, now = Date.now()) {
  const cutoff = now - WINDOW_MS;
  const recent = (requestLog.get(clientId) ?? []).filter((t) => t > cutoff);

  if (recent.length >= GUARDRAIL_LIMITS.requestsPerMinute) {
    const retryAfterSeconds = Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
    requestLog.set(clientId, recent);
    return { allowed: false as const, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
  }

  recent.push(now);
  requestLog.set(clientId, recent);
  return { allowed: true as const };
}

export function checkMessageLength(message: string) {
  if (message.length > GUARDRAIL_LIMITS.maxMessageChars) {
    return {
      allowed: false as const,
      maxChars: GUARDRAIL_LIMITS.maxMessageChars
    };
  }
  return { allowed: true as const };
}

export function isDailyBudgetExhausted() {
  rollDayIfNeeded();
  return spendTodayUsd >= GUARDRAIL_LIMITS.dailyBudgetUsd;
}

export function recordSpend(costUsd: number) {
  rollDayIfNeeded();
  spendTodayUsd += costUsd;
}

export function getSpendTodayUsd() {
  rollDayIfNeeded();
  return spendTodayUsd;
}

/** Test-only helper to reset in-memory state between test cases. */
export function resetGuardrailState() {
  requestLog.clear();
  spendDayKey = currentDayKey();
  spendTodayUsd = 0;
}

export function clientIdFromRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
