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
    finishTrace(trace, {
      actorId: session?.userId ?? "anonymous",
      actorRole: session?.role ?? "admin",
      page: "/admin/dashboard",
      action: "admin_member_export_failed",
      targetType: "user_export",
      targetId: "unauthorized",
      status: "error",
      errorCode: "UNAUTHORIZED",
      inputSummary: "Attempted admin member export without admin session",
      outputSummary: "Unauthorized export request rejected",
    });

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
    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: "/admin/dashboard",
      action: "admin_member_export_failed",
      targetType: "user_export",
      targetId: userId,
      status: "error",
      errorCode: "MEMBER_NOT_FOUND",
      inputSummary: `Export member ${userId}`,
      outputSummary: "Requested member not found",
    });

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
