import {
  checkMessageLength,
  checkRateLimit,
  clientIdFromRequest,
  isDailyBudgetExhausted
} from "@/security/guardrails";

export type RequestPolicyResult =
  | { ok: true; message: string; forceMock: boolean; forceMockReason?: string }
  | {
      ok: false;
      status: number;
      retryAfterSeconds?: number;
      error: {
        errorCategory: "transient" | "validation";
        isRetryable: boolean;
        message: string;
      };
    };

export async function applyRequestPolicy(request: Request): Promise<RequestPolicyResult> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      status: 400,
      error: {
        errorCategory: "validation",
        isRetryable: false,
        message: "Request body must be valid JSON."
      }
    };
  }

  const message =
    body && typeof body === "object" && typeof (body as { message?: unknown }).message === "string"
      ? (body as { message: string }).message.trim()
      : "";

  if (!message) {
    return {
      ok: false,
      status: 400,
      error: {
        errorCategory: "validation",
        isRetryable: false,
        message: "Request body must include a non-empty message string."
      }
    };
  }

  const lengthCheck = checkMessageLength(message);
  if (!lengthCheck.allowed) {
    return {
      ok: false,
      status: 400,
      error: {
        errorCategory: "validation",
        isRetryable: false,
        message: `Request is too long. Keep the procurement request under ${lengthCheck.maxChars} characters.`
      }
    };
  }

  const rate = checkRateLimit(clientIdFromRequest(request));
  if (!rate.allowed) {
    return {
      ok: false,
      status: 429,
      retryAfterSeconds: rate.retryAfterSeconds,
      error: {
        errorCategory: "transient",
        isRetryable: true,
        message: `Rate limit reached. Try again in about ${rate.retryAfterSeconds} seconds.`
      }
    };
  }

  const budgetExhausted = isDailyBudgetExhausted();
  return {
    ok: true,
    message,
    forceMock: budgetExhausted,
    forceMockReason: budgetExhausted
      ? "The demo's daily Claude budget has been reached, so this run used the deterministic mock planner. Live Claude Haiku mode resumes tomorrow."
      : undefined
  };
}
