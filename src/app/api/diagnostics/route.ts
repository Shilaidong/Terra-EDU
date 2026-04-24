import { NextResponse } from "next/server";

import { getAiArtifactsData, getRecentAuditLogsData } from "@/lib/data";
import { getEnvSummary, getMissingProductionEnv } from "@/lib/env";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      timestamp: new Date().toISOString(),
      environment: getEnvSummary(),
      missing_env_keys: getMissingProductionEnv(),
      recent_audit_logs: await getRecentAuditLogsData(10),
      recent_ai_artifacts: await getAiArtifactsData(10),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
