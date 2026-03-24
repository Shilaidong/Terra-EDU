import type { AiArtifact, AuditLog } from "@/lib/types";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

export async function persistAuditLog(log: AuditLog) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  await supabase.from("audit_logs").insert({
    id: log.id,
    created_at: log.timestamp,
    trace_id: log.traceId,
    decision_id: log.decisionId,
    actor_id: log.actorId,
    actor_role: log.actorRole,
    page: log.page,
    action: log.action,
    target_type: log.targetType,
    target_id: log.targetId,
    status: log.status,
    latency_ms: log.latencyMs,
    input_summary: log.inputSummary,
    output_summary: log.outputSummary,
    error_code: log.errorCode ?? null,
  });
}

export async function persistAiArtifact(artifact: AiArtifact) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return;
  }

  await supabase.from("ai_artifacts").insert({
    id: artifact.id,
    created_at: artifact.createdAt,
    student_id: artifact.studentId ?? null,
    role: artifact.role,
    page: artifact.page,
    feature: artifact.feature,
    model: artifact.model,
    prompt_version: artifact.promptVersion,
    input_summary: artifact.inputSummary,
    output_summary: artifact.outputSummary,
    sources: artifact.sources,
    trace_id: artifact.traceId,
    decision_id: artifact.decisionId,
    status: artifact.status,
    error_code: artifact.errorCode ?? null,
  });
}
