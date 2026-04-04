import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentStudentData, getStudentApplicationProfileData, updateStudentApplicationProfile } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  transcriptSourceMarkdown: z.string().default(""),
  transcriptStructuredMarkdown: z.string().default(""),
});

export async function PATCH(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session || session.role !== "student") {
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
        message: "Invalid document hub payload.",
      },
      { status: 400 }
    );
  }

  try {
    const { studentId, transcriptSourceMarkdown, transcriptStructuredMarkdown } = parsed.data;
    const currentStudent = await getCurrentStudentData(session);

    if (!currentStudent) {
      return NextResponse.json(
        {
          success: false,
          trace_id: trace.traceId,
          decision_id: trace.decisionId,
          message: "Student profile not found.",
        },
        { status: 404 }
      );
    }

    if (currentStudent.id !== studentId) {
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
      transcriptSourceMarkdown,
      transcriptStructuredMarkdown,
    });

    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: "/student/documents",
      action: "student_document_hub_updated",
      targetType: "student_application_profile",
      targetId: studentId,
      status: "success",
      inputSummary: "Updated transcript markdown and parsed transcript markdown",
      outputSummary: `${profile.transcriptSourceMarkdown.length} raw chars, ${profile.transcriptStructuredMarkdown.length} structured chars`,
    });

    return NextResponse.json({
      success: true,
      entity_id: studentId,
      trace_id: trace.traceId,
      decision_id: trace.decisionId,
      message: "Document hub updated.",
      data: profile,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: error instanceof Error ? error.message : "Document hub update failed.",
      },
      { status: 500 }
    );
  }
}
