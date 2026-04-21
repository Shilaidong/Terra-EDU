import { NextResponse } from "next/server";
import { z } from "zod";

import { generateHomeworkGradingAnalysis } from "@/lib/ai/provider";
import {
  createHomeworkGradingRecord,
  getCurrentStudentData,
  getStudentApplicationProfileData,
  getStudentHomeworkGradingData,
} from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  assignmentTitle: z.string().min(1),
  promptContent: z.string().min(1),
  studentAnswer: z.string().min(1),
  referenceAnswer: z.string().optional().default(""),
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

  const records = await getStudentHomeworkGradingData(student.id);
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
    return NextResponse.json({ success: false, message: "Invalid grading payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  if (parsed.data.studentId !== student.id) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const applicationProfile = await getStudentApplicationProfileData(student.id);
  const analysis = await generateHomeworkGradingAnalysis({
    student,
    applicationProfile,
    assignmentTitle: parsed.data.assignmentTitle,
    promptContent: parsed.data.promptContent,
    studentAnswer: parsed.data.studentAnswer,
    referenceAnswer: parsed.data.referenceAnswer,
  });

  const record = createHomeworkGradingRecord({
    studentId: student.id,
    date: new Date().toISOString().slice(0, 10),
    assignmentTitle: parsed.data.assignmentTitle,
    promptContent: parsed.data.promptContent,
    studentAnswer: parsed.data.studentAnswer,
    referenceAnswer: parsed.data.referenceAnswer,
    overallEvaluation: analysis.overallEvaluation,
    errorAnalysis: analysis.errorAnalysis,
    remediationPlan: analysis.remediationPlan,
    nextStep: analysis.nextStep,
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_grading_created",
    targetType: "homework_grading_record",
    targetId: record.id,
    status: "success",
    inputSummary: record.assignmentTitle,
    outputSummary: "Generated AI grading result",
  });

  return NextResponse.json({
    success: true,
    entity_id: record.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Homework grading result generated.",
    data: record,
  });
}
