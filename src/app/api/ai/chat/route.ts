import { NextResponse } from "next/server";
import { z } from "zod";

import { generateChatSummary } from "@/lib/ai/provider";
import {
  getCurrentStudentData,
  getStudentCheckInsData,
  getStudentMilestonesData,
  getStudentNotesData,
  getStudentTasksData,
} from "@/lib/data";
import { createTraceContext, finishTrace, logAiArtifact } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  question: z.string().min(1),
});

export async function POST(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Invalid AI chat payload.",
      },
      { status: 400 }
    );
  }

  const student = await getCurrentStudentData(session);
  const [tasks, milestones, checkIns, notes] = student
    ? await Promise.all([
        getStudentTasksData(student.id),
        getStudentMilestonesData(student.id),
        getStudentCheckInsData(student.id),
        getStudentNotesData(student.id),
      ])
    : [[], [], [], []];

  try {
    const result = await generateChatSummary({
      question: parsed.data.question,
      student,
      tasks,
      milestones,
      checkIns,
      notes,
    });

    logAiArtifact({
      studentId: parsed.data.studentId,
      role: session.role,
      page: "/student/dashboard",
      feature: "ai_chat",
      model: result.model,
      promptVersion: result.promptVersion,
      inputSummary: parsed.data.question,
      outputSummary: result.summary,
      sources: result.sources,
      traceId: trace.traceId,
      decisionId: trace.decisionId,
      status: "success",
    });

    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: "/student/dashboard",
      action: "ai_chat_answered",
      targetType: "ai_artifact",
      targetId: "ai_chat",
      status: "success",
      inputSummary: parsed.data.question,
      outputSummary: result.summary,
    });

    return NextResponse.json({
      success: true,
      entity_id: parsed.data.studentId,
      trace_id: trace.traceId,
      decision_id: trace.decisionId,
      message: "AI answer generated.",
      data: {
        summary: result.summary,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
      },
    });
  } catch (error) {
    const outputSummary = error instanceof Error ? error.message : "AI answer failed.";

    logAiArtifact({
      studentId: parsed.data.studentId,
      role: session.role,
      page: "/student/dashboard",
      feature: "ai_chat",
      model: "MiniMax-M2.7",
      promptVersion: "minimax-m2.7-v1",
      inputSummary: parsed.data.question,
      outputSummary,
      sources: [],
      traceId: trace.traceId,
      decisionId: trace.decisionId,
      status: "error",
      errorCode: "ai_provider_error",
    });

    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: "/student/dashboard",
      action: "ai_chat_answered",
      targetType: "ai_artifact",
      targetId: "ai_chat",
      status: "error",
      inputSummary: parsed.data.question,
      outputSummary,
      errorCode: "ai_provider_error",
    });

    return NextResponse.json(
      {
        success: false,
        entity_id: parsed.data.studentId,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: outputSummary,
      },
      { status: 502 }
    );
  }
}
