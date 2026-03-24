import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentStudentData } from "@/lib/data";
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
  const summary = `${student?.name ?? "The student"} should focus on the highest-priority application task, protect the study streak, and keep all updates visible to the consultant. This answer was generated in lightweight launch mode for reliability and traceability.`;

  logAiArtifact({
    studentId: parsed.data.studentId,
    role: session.role,
    page: "/student/dashboard",
    feature: "ai_chat",
    model: "gpt-4.1-mini-simulated",
    promptVersion: "launch-v1",
    inputSummary: parsed.data.question,
    outputSummary: summary,
    sources: ["student profile", "task queue"],
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
    outputSummary: summary,
  });

  return NextResponse.json({
    success: true,
    entity_id: parsed.data.studentId,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "AI answer generated.",
    data: {
      summary,
      trace_id: trace.traceId,
      decision_id: trace.decisionId,
    },
  });
}
