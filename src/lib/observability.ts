import * as Sentry from "@sentry/nextjs";

import { getStore } from "@/lib/store";
import { persistAiArtifact, persistAuditLog } from "@/lib/server/persistence";
import type { AiArtifact, AuditLog, UserRole } from "@/lib/types";

export interface TraceContext {
  traceId: string;
  decisionId: string;
  startedAt: number;
}

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function createTraceContext(): TraceContext {
  return {
    traceId: makeId("trace"),
    decisionId: makeId("decision"),
    startedAt: Date.now(),
  };
}

export function logAudit(input: Omit<AuditLog, "id" | "timestamp">) {
  const store = getStore();

  const record: AuditLog = {
    id: makeId("audit"),
    timestamp: new Date().toISOString(),
    ...input,
  };

  store.auditLogs.unshift(record);
  void persistAuditLog(record);
}

export function logAiArtifact(
  input: Omit<AiArtifact, "id" | "createdAt"> & { studentId?: string }
) {
  const store = getStore();

  const artifact: AiArtifact = {
    id: makeId("ai"),
    createdAt: new Date().toISOString(),
    ...input,
  };

  store.aiArtifacts.unshift(artifact);
  void persistAiArtifact(artifact);
}

export function structuredLog(entry: Record<string, unknown>) {
  console.log(JSON.stringify(entry));
  if (entry.level === "error") {
    Sentry.captureMessage(JSON.stringify(entry), "error");
  }
}

export function finishTrace(
  context: TraceContext,
  payload: {
    actorId: string;
    actorRole: UserRole;
    page: string;
    action: string;
    targetType: string;
    targetId: string;
    inputSummary: string;
    outputSummary: string;
    status: "success" | "error";
    errorCode?: string;
  }
) {
  const latencyMs = Date.now() - context.startedAt;

  logAudit({
    traceId: context.traceId,
    decisionId: context.decisionId,
    actorId: payload.actorId,
    actorRole: payload.actorRole,
    page: payload.page,
    action: payload.action,
    targetType: payload.targetType,
    targetId: payload.targetId,
    status: payload.status,
    latencyMs,
    inputSummary: payload.inputSummary,
    outputSummary: payload.outputSummary,
    errorCode: payload.errorCode,
  });

  structuredLog({
    level: payload.status === "success" ? "info" : "error",
    trace_id: context.traceId,
    decision_id: context.decisionId,
    actor_id: payload.actorId,
    role: payload.actorRole,
    page: payload.page,
    action: payload.action,
    target_type: payload.targetType,
    target_id: payload.targetId,
    latency_ms: latencyMs,
    status: payload.status,
    error_code: payload.errorCode,
  });

  if (payload.status === "error") {
    Sentry.captureMessage(
      `${payload.action} failed on ${payload.page} (${context.traceId})`,
      "error"
    );
  }

  return latencyMs;
}
