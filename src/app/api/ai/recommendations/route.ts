import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentStudentData, getStudentTasksData } from "@/lib/data";
import { createTraceContext, finishTrace, logAiArtifact } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  page: z.string(),
  feature: z.string(),
  prompt: z.string().min(1),
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
        message: "Invalid AI request payload.",
      },
      { status: 400 }
    );
  }

  const student = await getCurrentStudentData(session);
  const tasks = student ? await getStudentTasksData(student.id) : [];
  const openTasks = tasks.filter((task) => task.status !== "done");

  const recommendations = [
    `Prioritize ${openTasks[0]?.title ?? "the next milestone-driven task"} before adding more reach activities.`,
    "Keep weekly mastery check-ins flowing so the consultant dashboard sees fresh learning evidence.",
    `Tie essay language back to ${student?.intendedMajor ?? "the primary academic direction"} for stronger narrative alignment.`,
  ];

  const summary = `${student?.name ?? "The student"} is strongest when concrete evidence leads the story. The current best move is to finish the highest-priority open task, maintain study consistency, and keep the application narrative focused.`;

  logAiArtifact({
    studentId: parsed.data.studentId,
    role: session.role,
    page: parsed.data.page,
    feature: parsed.data.feature,
    model: "gpt-4.1-mini-simulated",
    promptVersion: "launch-v1",
    inputSummary: parsed.data.prompt,
    outputSummary: summary,
    sources: ["student profile", "task queue", "content library"],
    traceId: trace.traceId,
    decisionId: trace.decisionId,
    status: "success",
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: parsed.data.page,
    action: "ai_recommendation_generated",
    targetType: "ai_artifact",
    targetId: parsed.data.feature,
    status: "success",
    inputSummary: parsed.data.prompt,
    outputSummary: summary,
  });

  return NextResponse.json({
    success: true,
    entity_id: parsed.data.studentId,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "AI recommendation generated.",
    data: {
      summary,
      recommendations,
      sources: ["student profile", "task queue", "content library"],
      trace_id: trace.traceId,
      decision_id: trace.decisionId,
    },
  });
}
