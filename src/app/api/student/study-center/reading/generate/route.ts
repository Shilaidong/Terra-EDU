import { NextResponse } from "next/server";
import { z } from "zod";

import { generateReadingQuiz } from "@/lib/ai/provider";
import { getCurrentStudentData, getReadingPassageById, getStudentApplicationProfileData } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  passageId: z.string(),
});

export async function POST(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ success: false, message: "Unauthorized.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid reading quiz payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
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

  const applicationProfile = await getStudentApplicationProfileData(student.id);
  const quiz = await generateReadingQuiz({
    student,
    applicationProfile,
    title: passage.title,
    passage: passage.passage,
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_reading_generated",
    targetType: "reading_passage",
    targetId: passage.id,
    status: "success",
    inputSummary: passage.title,
    outputSummary: "Generated 5 reading questions",
  });

  return NextResponse.json({
    success: true,
    data: {
      passage,
      questions: quiz.questions,
    },
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
  });
}
