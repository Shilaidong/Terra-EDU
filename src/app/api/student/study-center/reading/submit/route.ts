import { NextResponse } from "next/server";
import { z } from "zod";

import { createReadingQuizAttempt, getCurrentStudentData, getReadingPassageById } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const questionSchema = z.object({
  stem: z.string(),
  options: z.array(z.string()).length(4),
  answerIndex: z.coerce.number().min(0).max(3),
  explanation: z.string(),
});

const schema = z.object({
  studentId: z.string(),
  passageId: z.string(),
  questions: z.array(questionSchema).length(5),
  selectedAnswers: z.array(z.coerce.number().min(0).max(3)).length(5),
});

export async function POST(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ success: false, message: "Unauthorized.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid reading submission payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }
  if (student.id !== parsed.data.studentId) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const passage = await getReadingPassageById(student.id, parsed.data.passageId);
  if (!passage) {
    return NextResponse.json({ success: false, message: "Reading passage not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  const attempt = await createReadingQuizAttempt({
    studentId: student.id,
    passageId: passage.id,
    title: passage.title,
    questions: parsed.data.questions,
    selectedAnswers: parsed.data.selectedAnswers,
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_reading_submitted",
    targetType: "reading_passage",
    targetId: passage.id,
    status: "success",
    inputSummary: passage.title,
    outputSummary: `${attempt.correctCount}/${attempt.totalQuestions}`,
  });

  return NextResponse.json({ success: true, data: attempt, trace_id: trace.traceId, decision_id: trace.decisionId });
}
