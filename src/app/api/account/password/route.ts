import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { getCurrentUserData, updateUserPassword } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function PATCH(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session) {
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

  const currentUser = await getCurrentUserData(session);
  if (!currentUser) {
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

  const { currentPassword, newPassword } = parsed.data;

  try {
    if (session.authSource === "supabase") {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const admin = getSupabaseAdminClient();

      if (!url || !anonKey || !admin) {
        throw new Error("Supabase auth is not configured.");
      }

      const verifier = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { error: verificationError } = await verifier.auth.signInWithPassword({
        email: session.email,
        password: currentPassword,
      });

      if (verificationError) {
        return NextResponse.json(
          {
            success: false,
            trace_id: trace.traceId,
            decision_id: trace.decisionId,
            message: "Current password is incorrect.",
          },
          { status: 400 }
        );
      }

      const authUserId = session.authUserId ?? currentUser.id;
      const { error: updateError } = await admin.auth.admin.updateUserById(authUserId, {
        password: newPassword,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      if (currentUser.password !== currentPassword) {
        return NextResponse.json(
          {
            success: false,
            trace_id: trace.traceId,
            decision_id: trace.decisionId,
            message: "Current password is incorrect.",
          },
          { status: 400 }
        );
      }
    }

    updateUserPassword(session.userId, newPassword);

    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: `/${session.role}/settings`,
      action: "account_password_updated",
      targetType: "user",
      targetId: session.userId,
      status: "success",
      inputSummary: "Password changed by account owner",
      outputSummary: "Password updated",
    });

    return NextResponse.json({
      success: true,
      entity_id: session.userId,
      trace_id: trace.traceId,
      decision_id: trace.decisionId,
      message: "Password updated.",
    });
  } catch (error) {
    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: `/${session.role}/settings`,
      action: "account_password_updated",
      targetType: "user",
      targetId: session.userId,
      status: "error",
      errorCode: "PASSWORD_UPDATE_FAILED",
      inputSummary: "Password change attempted",
      outputSummary: error instanceof Error ? error.message : "Password update failed",
    });

    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: error instanceof Error ? error.message : "Password update failed.",
      },
      { status: 500 }
    );
  }
}
