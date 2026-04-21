import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteReadingTrainingRecord,
  getCurrentStudentData,
  getStudentReadingTrainingData,
  updateReadingTrainingRecord,
} from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  date: z.string().min(1).optional(),
  materialTitle: z.string().min(1).optional(),
  trainingType: z.string().min(1).optional(),
  durationMinutes: z.coerce.number().min(0).optional(),
  completedUnits: z.string().min(1).optional(),
  comprehension: z.coerce.number().min(1).max(5).optional(),
  notes: z.string().optional(),
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
    return NextResponse.json({ success: false, message: "Invalid reading payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const recordId = (await context.params).recordId;
  const ownsRecord = (await getStudentReadingTrainingData(student.id)).some((item) => item.id === recordId);
  if (!ownsRecord) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const record = await updateReadingTrainingRecord(recordId, parsed.data);
  if (!record) {
    return NextResponse.json({ success: false, message: "Record not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_reading_updated",
    targetType: "reading_training_record",
    targetId: record.id,
    status: "success",
    inputSummary: record.materialTitle,
    outputSummary: `Updated reading session on ${record.date}`,
  });

  return NextResponse.json({ success: true, data: record, trace_id: trace.traceId, decision_id: trace.decisionId, entity_id: record.id, message: "Reading training updated." });
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
  const ownsRecord = (await getStudentReadingTrainingData(student.id)).some((item) => item.id === recordId);
  if (!ownsRecord) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const record = await deleteReadingTrainingRecord(recordId);
  if (!record) {
    return NextResponse.json({ success: false, message: "Record not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_reading_deleted",
    targetType: "reading_training_record",
    targetId: record.id,
    status: "success",
    inputSummary: record.materialTitle,
    outputSummary: "Deleted reading training record",
  });

  return NextResponse.json({ success: true, data: record, trace_id: trace.traceId, decision_id: trace.decisionId, entity_id: record.id, message: "Reading training deleted." });
}
