import type { ErrorCategory, ToolError, ToolResult } from "@/types/tools";

export function createToolError(
  errorCategory: ErrorCategory,
  message: string,
  details?: Record<string, unknown>
): ToolError {
  return {
    errorCategory,
    isRetryable: errorCategory === "transient",
    message,
    details
  };
}

export function failTool<T>(
  errorCategory: ErrorCategory,
  message: string,
  details?: Record<string, unknown>
): ToolResult<T> {
  return {
    success: false,
    error: createToolError(errorCategory, message, details)
  };
}

export function succeedTool<T>(data: T): ToolResult<T> {
  return {
    success: true,
    data
  };
}
