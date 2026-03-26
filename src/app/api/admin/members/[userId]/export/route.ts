import { NextResponse } from "next/server";

import { getAdminMemberExportData } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session || session.role !== "admin") {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  const { userId } = await context.params;
  const payload = await getAdminMemberExportData(userId);

  if (!payload) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Member not found.",
      },
      { status: 404 }
    );
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/admin/dashboard",
    action: "admin_member_exported",
    targetType: "user_export",
    targetId: userId,
    status: "success",
    inputSummary: `Export member ${payload.user.email}`,
    outputSummary: "JSON export generated",
  });

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="terra-member-${payload.user.role}-${payload.user.email.replace(/[^a-zA-Z0-9_.-]/g, "_")}.json"`,
    },
  });
}
