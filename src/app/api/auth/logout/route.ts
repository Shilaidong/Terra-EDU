import { NextResponse } from "next/server";

import { createTraceContext, finishTrace } from "@/lib/observability";
import { clearSession, getSession } from "@/lib/session";

export async function POST() {
  const trace = createTraceContext();
  const session = await getSession();

  await clearSession();

  finishTrace(trace, {
    actorId: session?.userId ?? "anonymous",
    actorRole: session?.role ?? "student",
    page: "logout",
    action: "logout",
    targetType: "session",
    targetId: session?.userId ?? "anonymous",
    status: "success",
    inputSummary: "Logout requested",
    outputSummary: "Session cleared",
  });

  return NextResponse.json({
    success: true,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Logged out.",
  });
}
