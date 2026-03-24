import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateUser } from "@/lib/auth";
import { getCurrentStudentData } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getDefaultRoute } from "@/lib/routes";
import { setSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["student", "parent", "consultant"]),
});

export async function POST(request: Request) {
  const trace = createTraceContext();
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    finishTrace(trace, {
      actorId: "anonymous",
      actorRole: "student",
      page: "/login",
      action: "login_failed",
      targetType: "session",
      targetId: "invalid_payload",
      status: "error",
      errorCode: "INVALID_PAYLOAD",
      inputSummary: "Malformed login payload",
      outputSummary: "Rejected request before auth check",
    });

    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Invalid login payload.",
      },
      { status: 400 }
    );
  }

  const { email, password, role } = parsed.data;
  const authResult = await authenticateUser({ email, password, role });

  if (!("session" in authResult)) {
    finishTrace(trace, {
      actorId: "anonymous",
      actorRole: role,
      page: "/login",
      action: "login_failed",
      targetType: "session",
      targetId: email,
      status: "error",
      errorCode: authResult.code,
      inputSummary: `Attempted login for ${email}`,
      outputSummary: authResult.error,
    });

    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: authResult.error,
      },
      { status: 401 }
    );
  }

  const session = authResult.session;
  const student = session.role === "student" ? await getCurrentStudentData(session) : null;
  const nextSession = {
    ...session,
    avatar: student?.avatar ?? session.avatar,
  };
  await setSession(nextSession);

  finishTrace(trace, {
    actorId: nextSession.userId,
    actorRole: nextSession.role,
    page: "/login",
    action: "login_success",
    targetType: "session",
    targetId: nextSession.userId,
    status: "success",
    inputSummary: `Email login for ${nextSession.email}`,
    outputSummary: `Redirect to ${getDefaultRoute(nextSession.role)} via ${nextSession.authSource ?? "demo"}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: nextSession.userId,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Login successful.",
    data: {
      redirectTo: getDefaultRoute(nextSession.role),
    },
  });
}
