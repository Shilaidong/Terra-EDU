import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteMemberAccount, getUserByIdData } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  confirmation: z.string().min(1),
});

export async function DELETE(
  request: Request,
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
  const targetUser = await getUserByIdData(userId);

  if (!targetUser || targetUser.role === "admin") {
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

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success || parsed.data.confirmation.trim() !== targetUser.email) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Confirmation text does not match the member email.",
      },
      { status: 400 }
    );
  }

  const deletedUser = await deleteMemberAccount(userId);

  if (!deletedUser) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Member deletion failed.",
      },
      { status: 500 }
    );
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/admin/dashboard",
    action: "admin_member_deleted",
    targetType: "user",
    targetId: deletedUser.id,
    status: "success",
    inputSummary: `Delete member ${deletedUser.email}`,
    outputSummary: "Member and related records deleted",
  });

  return NextResponse.json({
    success: true,
    entity_id: deletedUser.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Member deleted.",
  });
}
