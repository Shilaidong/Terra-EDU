import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdvisorNote, getLinkedStudentIdsForConsultant } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  title: z.string().min(1),
  summary: z.string().min(1),
});

export async function POST(request: Request) {
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
        message: "Invalid advisor note payload.",
      },
      { status: 400 }
    );
  }

  const linkedStudentIds = await getLinkedStudentIdsForConsultant(session.userId);

  if (!linkedStudentIds.includes(parsed.data.studentId)) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "This student is not assigned to the current consultant.",
      },
      { status: 403 }
    );
  }

  const note = createAdvisorNote({
    studentId: parsed.data.studentId,
    consultantId: session.userId,
    title: parsed.data.title,
    summary: parsed.data.summary,
    createdAt: new Date().toISOString(),
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/consultant/students/[studentId]",
    action: "consultant_note_created",
    targetType: "advisor_note",
    targetId: note.id,
    status: "success",
    inputSummary: note.title,
    outputSummary: `Advisor note created for ${note.studentId}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: note.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Advisor note created.",
    data: note,
  });
}
