import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentStudentData, submitVocabularyPractice } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  packId: z.string(),
  answers: z.array(
    z.object({
      wordItemId: z.string(),
      studentAnswer: z.string(),
    })
  ).min(1),
});

export async function POST(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ success: false, message: "Unauthorized.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid vocabulary practice payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }
  if (student.id !== parsed.data.studentId) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const result = await submitVocabularyPractice(parsed.data);

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_vocabulary_practiced",
    targetType: "vocabulary_pack",
    targetId: parsed.data.packId,
    status: "success",
    inputSummary: `${parsed.data.answers.length} answers`,
    outputSummary: `Accuracy ${result.accuracy}%`,
  });

  return NextResponse.json({ success: true, data: result, trace_id: trace.traceId, decision_id: trace.decisionId });
}
