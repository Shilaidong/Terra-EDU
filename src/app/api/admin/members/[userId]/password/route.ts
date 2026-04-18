import { NextResponse } from "next/server";
import { z } from "zod";

import { getUserByIdData, updateUserPassword } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { getSession } from "@/lib/session";

const schema = z.object({
  newPassword: z.string().min(6),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
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

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Invalid password payload.",
      },
      { status: 400 }
    );
  }

  const { userId } = await params;
  const user = await getUserByIdData(userId);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "User not found.",
      },
      { status: 404 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();

    if (supabase) {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: parsed.data.newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }
    }

    updateUserPassword(user.id, parsed.data.newPassword);

    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: "/admin/dashboard",
      action: "admin_password_reset",
      targetType: "user",
      targetId: user.id,
      status: "success",
      inputSummary: `Admin reset password for ${user.email}`,
      outputSummary: "Password reset without deleting data",
    });

    return NextResponse.json({
      success: true,
      entity_id: user.id,
      trace_id: trace.traceId,
      decision_id: trace.decisionId,
      message: "Password reset.",
    });
  } catch (error) {
    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: "/admin/dashboard",
      action: "admin_password_reset",
      targetType: "user",
      targetId: user.id,
      status: "error",
      errorCode: "ADMIN_PASSWORD_RESET_FAILED",
      inputSummary: `Admin reset password for ${user.email}`,
      outputSummary: error instanceof Error ? error.message : "Password reset failed",
    });

    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: error instanceof Error ? error.message : "Password reset failed.",
      },
      { status: 500 }
    );
  }
}
