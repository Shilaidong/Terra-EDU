import { NextResponse } from "next/server";
import { z } from "zod";

import { getLinkedStudentIdsForConsultant, getStudentApplicationProfileData, updateStudentApplicationProfile } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  planningBookMarkdown: z.string().default(""),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ studentId: string }> }
) {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session || session.role !== "consultant") {
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
        message: "Invalid consultant document hub payload.",
      },
      { status: 400 }
    );
  }

  try {
    const studentId = (await context.params).studentId;
    const linkedStudentIds = await getLinkedStudentIdsForConsultant(session.userId);

    if (!linkedStudentIds.includes(studentId)) {
      return NextResponse.json(
        {
          success: false,
          trace_id: trace.traceId,
          decision_id: trace.decisionId,
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    const existing = await getStudentApplicationProfileData(studentId);

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          trace_id: trace.traceId,
          decision_id: trace.decisionId,
          message: "Student application profile not found.",
        },
        { status: 404 }
      );
    }

    const rest = { ...existing };
    delete (rest as { studentId?: string }).studentId;
    const profile = await updateStudentApplicationProfile(studentId, {
      ...rest,
      planningBookMarkdown: parsed.data.planningBookMarkdown,
    });

    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: "/consultant/students/[studentId]",
      action: "consultant_planning_book_updated",
      targetType: "student_application_profile",
      targetId: studentId,
      status: "success",
      inputSummary: "Updated planning book markdown",
      outputSummary: `${profile.planningBookMarkdown.length} planning book chars`,
    });

    return NextResponse.json({
      success: true,
      entity_id: studentId,
      trace_id: trace.traceId,
      decision_id: trace.decisionId,
      message: "Planning book updated.",
      data: profile,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: error instanceof Error ? error.message : "Planning book update failed.",
      },
      { status: 500 }
    );
  }
}
