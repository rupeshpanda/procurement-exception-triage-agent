import { beforeEach, describe, expect, it } from "vitest";
import {
  GUARDRAIL_LIMITS,
  checkMessageLength,
  checkRateLimit,
  isDailyBudgetExhausted,
  recordSpend,
  resetGuardrailState
} from "@/security/guardrails";
import { POST } from "../app/api/agent/route";

describe("guardrails", () => {
  beforeEach(() => {
    resetGuardrailState();
  });

  it("allows requests under the per-minute limit and blocks above it", () => {
    const now = Date.now();
    for (let i = 0; i < GUARDRAIL_LIMITS.requestsPerMinute; i += 1) {
      expect(checkRateLimit("10.0.0.1", now).allowed).toBe(true);
    }
    const blocked = checkRateLimit("10.0.0.1", now);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("tracks rate limits per client", () => {
    const now = Date.now();
    for (let i = 0; i < GUARDRAIL_LIMITS.requestsPerMinute; i += 1) {
      checkRateLimit("10.0.0.1", now);
    }
    expect(checkRateLimit("10.0.0.2", now).allowed).toBe(true);
  });

  it("resets the window after a minute", () => {
    const now = Date.now();
    for (let i = 0; i < GUARDRAIL_LIMITS.requestsPerMinute; i += 1) {
      checkRateLimit("10.0.0.1", now);
    }
    expect(checkRateLimit("10.0.0.1", now + 61_000).allowed).toBe(true);
  });

  it("rejects over-long messages", () => {
    const tooLong = "x".repeat(GUARDRAIL_LIMITS.maxMessageChars + 1);
    expect(checkMessageLength(tooLong).allowed).toBe(false);
    expect(checkMessageLength("Why is INV-90031 blocked?").allowed).toBe(true);
  });

  it("marks the daily budget exhausted once spend reaches the cap", () => {
    expect(isDailyBudgetExhausted()).toBe(false);
    recordSpend(GUARDRAIL_LIMITS.dailyBudgetUsd);
    expect(isDailyBudgetExhausted()).toBe(true);
  });

  it("returns a structured 429 from the API route when rate limited", async () => {
    const makeRequest = () =>
      new Request("http://localhost/api/agent", {
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.9" },
        body: JSON.stringify({ message: "Why is invoice INV-90031 blocked?" })
      });

    let lastResponse: Response | undefined;
    for (let i = 0; i < GUARDRAIL_LIMITS.requestsPerMinute + 1; i += 1) {
      lastResponse = await POST(makeRequest());
    }

    expect(lastResponse?.status).toBe(429);
    const payload = await lastResponse?.json();
    expect(payload.error.errorCategory).toBe("transient");
    expect(payload.error.isRetryable).toBe(true);
    expect(lastResponse?.headers.get("retry-after")).toBeTruthy();
  });
});
