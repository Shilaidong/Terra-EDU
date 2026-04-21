import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createReadingTrainingRecord,
  getCurrentStudentData,
  getStudentReadingTrainingData,
} from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  date: z.string().min(1),
  materialTitle: z.string().min(1),
  trainingType: z.string().min(1),
  durationMinutes: z.coerce.number().min(0),
  completedUnits: z.string().min(1),
  comprehension: z.coerce.number().min(1).max(5),
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

  const records = await getStudentReadingTrainingData(student.id);
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
    return NextResponse.json({ success: false, message: "Invalid reading payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  if (parsed.data.studentId !== student.id) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const record = createReadingTrainingRecord(parsed.data);
  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_reading_created",
    targetType: "reading_training_record",
    targetId: record.id,
    status: "success",
    inputSummary: record.materialTitle,
    outputSummary: `Saved reading session on ${record.date}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: record.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Reading training saved.",
    data: record,
  });
}
