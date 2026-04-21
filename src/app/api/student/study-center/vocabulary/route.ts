import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createVocabularyStudyRecord,
  getCurrentStudentData,
  getStudentVocabularyStudyData,
} from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  date: z.string().min(1),
  packName: z.string().min(1),
  newWordsCount: z.coerce.number().min(0),
  reviewWordsCount: z.coerce.number().min(0),
  completed: z.boolean(),
  mastery: z.coerce.number().min(1).max(5),
  notes: z.string().default(""),
});

export async function GET() {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session || session.role !== "student") {
    return NextResponse.json({ success: false, message: "Unauthorized.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 401 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  const records = await getStudentVocabularyStudyData(student.id);
  return NextResponse.json({ success: true, data: records, trace_id: trace.traceId, decision_id: trace.decisionId });
}

export async function POST(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session || session.role !== "student") {
    return NextResponse.json({ success: false, message: "Unauthorized.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid vocabulary study payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  if (parsed.data.studentId !== student.id) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const record = createVocabularyStudyRecord(parsed.data);

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_vocabulary_created",
    targetType: "vocabulary_study_record",
    targetId: record.id,
    status: "success",
    inputSummary: `${record.packName} · ${record.newWordsCount}/${record.reviewWordsCount}`,
    outputSummary: `Saved vocabulary study on ${record.date}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: record.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Vocabulary study record saved.",
    data: record,
  });
}
