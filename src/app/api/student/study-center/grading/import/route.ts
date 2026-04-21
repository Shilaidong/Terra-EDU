import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentStudentData, importHomeworkQuestions } from "@/lib/data";
import { asString, readFirstSheetRows, readWorkbook } from "@/lib/study-center-import";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
});

export async function POST(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ success: false, message: "Unauthorized.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const parsed = schema.safeParse({ studentId: formData.get("studentId") });
  if (!(file instanceof File) || !parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid homework import payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }
  if (student.id !== parsed.data.studentId) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const workbook = readWorkbook(file, await file.arrayBuffer());
  const rows = readFirstSheetRows(workbook)
    .map((row) => ({
      subject: asString(row.subject),
      prompt: asString(row.prompt),
      correctAnswer: asString(row.correct_answer),
      explanation: asString(row.explanation),
    }))
    .filter((row) => row.subject && row.prompt && row.correctAnswer);

  if (rows.length === 0) {
    return NextResponse.json({ success: false, message: "Template is empty. Please fill subject, prompt, and correct_answer.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const questions = await importHomeworkQuestions({ studentId: student.id, rows });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_homework_imported",
    targetType: "homework_question_bank",
    targetId: student.id,
    status: "success",
    inputSummary: `${rows.length} questions`,
    outputSummary: "Homework question bank imported",
  });

  return NextResponse.json({ success: true, data: questions, trace_id: trace.traceId, decision_id: trace.decisionId });
}
