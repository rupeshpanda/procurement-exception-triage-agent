import type { TraceEvent, TraceEventType } from "@/types/trace";

export function createTraceEvent(
  type: TraceEventType,
  title: string,
  detail: string,
  metadata?: Record<string, unknown>
): TraceEvent {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date().toISOString(),
    title,
    detail,
    metadata
  };
}
