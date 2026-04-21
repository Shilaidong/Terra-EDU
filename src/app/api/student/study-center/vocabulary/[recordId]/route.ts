import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteVocabularyStudyRecord,
  getCurrentStudentData,
  getStudentVocabularyStudyData,
  updateVocabularyStudyRecord,
} from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  date: z.string().min(1).optional(),
  packName: z.string().min(1).optional(),
  newWordsCount: z.coerce.number().min(0).optional(),
  reviewWordsCount: z.coerce.number().min(0).optional(),
  completed: z.boolean().optional(),
  mastery: z.coerce.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  reviewStage: z.coerce.number().min(0).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ recordId: string }> }
) {
  const trace = createTraceContext();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ success: false, message: "Unauthorized.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 401 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid vocabulary study payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const recordId = (await context.params).recordId;
  const ownsRecord = (await getStudentVocabularyStudyData(student.id)).some((item) => item.id === recordId);
  if (!ownsRecord) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const record = await updateVocabularyStudyRecord(recordId, parsed.data);
  if (!record) {
    return NextResponse.json({ success: false, message: "Record not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_vocabulary_updated",
    targetType: "vocabulary_study_record",
    targetId: record.id,
    status: "success",
    inputSummary: record.packName,
    outputSummary: `Updated vocabulary study on ${record.date}`,
  });

  return NextResponse.json({ success: true, data: record, trace_id: trace.traceId, decision_id: trace.decisionId, entity_id: record.id, message: "Vocabulary study record updated." });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ recordId: string }> }
) {
  const trace = createTraceContext();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ success: false, message: "Unauthorized.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 401 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  const recordId = (await context.params).recordId;
  const ownsRecord = (await getStudentVocabularyStudyData(student.id)).some((item) => item.id === recordId);
  if (!ownsRecord) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const record = await deleteVocabularyStudyRecord(recordId);
  if (!record) {
    return NextResponse.json({ success: false, message: "Record not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_vocabulary_deleted",
    targetType: "vocabulary_study_record",
    targetId: record.id,
    status: "success",
    inputSummary: record.packName,
    outputSummary: "Deleted vocabulary study record",
  });

  return NextResponse.json({ success: true, data: record, trace_id: trace.traceId, decision_id: trace.decisionId, entity_id: record.id, message: "Vocabulary study record deleted." });
}
