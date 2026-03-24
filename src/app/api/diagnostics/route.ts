import { NextResponse } from "next/server";

import { getAiArtifactsData, getRecentAuditLogsData } from "@/lib/data";
import { getEnvSummary, getMissingProductionEnv } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: getEnvSummary(),
    missing_env_keys: getMissingProductionEnv(),
    recent_audit_logs: await getRecentAuditLogsData(10),
    recent_ai_artifacts: await getAiArtifactsData(10),
  });
}
