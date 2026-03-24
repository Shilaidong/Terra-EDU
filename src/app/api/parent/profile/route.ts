import { NextResponse } from "next/server";
import { z } from "zod";

import { avatarPresetValues } from "@/lib/avatar-presets";
import { updateUserProfile } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession, setSession } from "@/lib/session";

const schema = z.object({
  userId: z.string(),
  name: z.string().min(1),
  avatar: z.enum(avatarPresetValues),
});

export async function PATCH(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session || session.role !== "parent") {
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

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success || parsed.data.userId !== session.userId) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Invalid profile payload.",
      },
      { status: 400 }
    );
  }

  const user = updateUserProfile(parsed.data.userId, parsed.data);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Parent account not found.",
      },
      { status: 404 }
    );
  }

  await setSession({
    userId: session.userId,
    role: session.role,
    name: user.name,
    email: session.email,
    avatar: user.avatar,
    authSource: session.authSource,
    authUserId: session.authUserId,
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/parent/settings",
    action: "parent_profile_updated",
    targetType: "user",
    targetId: user.id,
    status: "success",
    inputSummary: "Updated parent display name and avatar",
    outputSummary: `${user.name} avatar updated`,
  });

  return NextResponse.json({
    success: true,
    entity_id: user.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Profile updated.",
    data: user,
  });
}
