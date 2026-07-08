import { describe, expect, it } from "vitest";
import { shouldRetryToolResult } from "@/errors/retryPolicy";

describe("structured error handling", () => {
  it("retries transient errors only within the attempt limit", () => {
    expect(
      shouldRetryToolResult(
        {
          success: false,
          error: {
            errorCategory: "transient",
            isRetryable: true,
            message: "Timeout"
          }
        },
        0
      )
    ).toBe(true);
  });

  it("does not retry validation errors", () => {
    expect(
      shouldRetryToolResult(
        {
          success: false,
          error: {
            errorCategory: "validation",
            isRetryable: false,
            message: "Bad due date"
          }
        },
        0
      )
    ).toBe(false);
  });
});
