import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentStudentData, submitHomeworkQuestionAnswer } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  questionId: z.string(),
  studentAnswer: z.string().min(1),
});

export async function POST(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ success: false, message: "Unauthorized.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid answer payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }
  if (student.id !== parsed.data.studentId) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const result = await submitHomeworkQuestionAnswer(parsed.data);
  if (!result) {
    return NextResponse.json({ success: false, message: "Question not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_homework_answered",
    targetType: "homework_question",
    targetId: result.question.id,
    status: "success",
    inputSummary: result.question.subject,
    outputSummary: result.attempt.correct ? "Answered correctly" : "Answered incorrectly",
  });

  return NextResponse.json({ success: true, data: result, trace_id: trace.traceId, decision_id: trace.decisionId });
}
