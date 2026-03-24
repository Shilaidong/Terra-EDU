import { NextResponse } from "next/server";

import { getEnvSummary, getMissingProductionEnv } from "@/lib/env";
import { getStoreSnapshotData } from "@/lib/data";

export async function GET() {
  const store = await getStoreSnapshotData();
  const env = getEnvSummary();

  return NextResponse.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env,
    missing_env_keys: getMissingProductionEnv(),
    counts: {
      users: store.users.length,
      students: store.students.length,
      tasks: store.tasks.length,
      content_items: store.contentItems.length,
      audit_logs: store.auditLogs.length,
      ai_artifacts: store.aiArtifacts.length,
    },
  });
}
