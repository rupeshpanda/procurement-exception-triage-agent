import { failTool, succeedTool } from "@/errors/toolError";
import {
  createProcurementFollowupSchema,
  escalateProcurementIssueSchema
} from "@/tools/toolSchemas";
import { containsUnsafeWorkflowLanguage } from "@/tools/workflowGuards";
import type {
  CreateProcurementFollowupInput,
  EscalateProcurementIssueInput
} from "@/types/tools";

export const createdFollowups: Array<CreateProcurementFollowupInput & {
  taskId: string;
  status: "created";
  createdAt: string;
}> = [];

export const createdEscalations: Array<EscalateProcurementIssueInput & {
  escalationId: string;
  status: "pending_review";
  createdAt: string;
}> = [];

export function createProcurementFollowup(input: CreateProcurementFollowupInput) {
  const parsed = createProcurementFollowupSchema.safeParse(input);
  if (!parsed.success) {
    return failTool("validation", "Invalid follow-up task input.", {
      reason: parsed.error.flatten()
    });
  }

  const unsafePhrase = containsUnsafeWorkflowLanguage(
    parsed.data.title,
    parsed.data.description
  );

  if (unsafePhrase) {
    return failTool(
      "permission",
      "This action requires human approval and cannot be completed by the agent.",
      {
        reason: `The request appears to involve a restricted workflow action: ${unsafePhrase}.`
      }
    );
  }

  const task = {
    ...parsed.data,
    taskId: `TASK-${String(createdFollowups.length + 1).padStart(5, "0")}`,
    status: "created" as const,
    createdAt: new Date().toISOString()
  };

  createdFollowups.push(task);

  return succeedTool({
    taskId: task.taskId,
    status: task.status,
    title: task.title,
    dueDate: task.dueDate,
    priority: task.priority
  });
}

export function escalateProcurementIssue(input: EscalateProcurementIssueInput) {
  const parsed = escalateProcurementIssueSchema.safeParse(input);
  if (!parsed.success) {
    return failTool("validation", "Invalid escalation input.", {
      reason: parsed.error.flatten()
    });
  }

  const escalation = {
    ...parsed.data,
    escalationId: `ESC-${String(createdEscalations.length + 1).padStart(5, "0")}`,
    status: "pending_review" as const,
    createdAt: new Date().toISOString()
  };

  createdEscalations.push(escalation);

  return succeedTool({
    escalationId: escalation.escalationId,
    status: escalation.status,
    riskLevel: escalation.riskLevel,
    reason: escalation.reason
  });
}
