import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteHomeworkGradingRecord,
  getCurrentStudentData,
  getStudentHomeworkGradingData,
  updateHomeworkGradingRecord,
} from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  assignmentTitle: z.string().min(1).optional(),
  promptContent: z.string().min(1).optional(),
  studentAnswer: z.string().min(1).optional(),
  referenceAnswer: z.string().optional(),
  overallEvaluation: z.string().min(1).optional(),
  errorAnalysis: z.string().min(1).optional(),
  remediationPlan: z.string().min(1).optional(),
  nextStep: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
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
    return NextResponse.json({ success: false, message: "Invalid grading payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const recordId = (await context.params).recordId;
  const ownsRecord = (await getStudentHomeworkGradingData(student.id)).some((item) => item.id === recordId);
  if (!ownsRecord) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const record = await updateHomeworkGradingRecord(recordId, parsed.data);
  if (!record) {
    return NextResponse.json({ success: false, message: "Record not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_grading_updated",
    targetType: "homework_grading_record",
    targetId: record.id,
    status: "success",
    inputSummary: record.assignmentTitle,
    outputSummary: "Updated homework grading result",
  });

  return NextResponse.json({ success: true, data: record, trace_id: trace.traceId, decision_id: trace.decisionId, entity_id: record.id, message: "Homework grading result updated." });
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
  const ownsRecord = (await getStudentHomeworkGradingData(student.id)).some((item) => item.id === recordId);
  if (!ownsRecord) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const record = await deleteHomeworkGradingRecord(recordId);
  if (!record) {
    return NextResponse.json({ success: false, message: "Record not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_grading_deleted",
    targetType: "homework_grading_record",
    targetId: record.id,
    status: "success",
    inputSummary: record.assignmentTitle,
    outputSummary: "Deleted homework grading result",
  });

  return NextResponse.json({ success: true, data: record, trace_id: trace.traceId, decision_id: trace.decisionId, entity_id: record.id, message: "Homework grading result deleted." });
}
