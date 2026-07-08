import type { ToolResult } from "@/types/tools";

export function shouldRetryToolResult(result: ToolResult<unknown>, attempt: number) {
  return !result.success && result.error.isRetryable && attempt < 2;
}
