import { NextResponse } from "next/server";
import { z } from "zod";

import { createTask } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";
import type { TimelineLane } from "@/lib/types";

const schema = z.object({
  studentId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  dueLabel: z.string().min(1),
  dueDate: z.string().min(1),
  category: z.string().min(1),
  priority: z.enum(["Low", "Medium", "High"]),
  ownerRole: z.enum(["consultant"]),
});

function inferTimelineLane(category: string): TimelineLane {
  const normalized = category.toLowerCase();

  if (normalized.includes("exam") || normalized.includes("ielts") || normalized.includes("toefl")) {
    return "standardized_exams";
  }

  if (normalized.includes("competition")) {
    return "competitions";
  }

  if (normalized.includes("document") || normalized.includes("material") || normalized.includes("deadline") || normalized.includes("finance")) {
    return "application_progress";
  }

  if (normalized.includes("activity") || normalized.includes("research")) {
    return "activities";
  }

  return "application_progress";
}

export async function POST(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session || session.role !== "consultant") {
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
        message: "Invalid consultant task payload.",
      },
      { status: 400 }
    );
  }

  const task = createTask({
    ...parsed.data,
    startDate: parsed.data.dueDate,
    endDate: parsed.data.dueDate,
    timelineLane: inferTimelineLane(parsed.data.category),
    status: "pending",
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/consultant/students",
    action: "consultant_task_created",
    targetType: "task",
    targetId: task.id,
    status: "success",
    inputSummary: task.title,
    outputSummary: `Task created for ${task.studentId}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: task.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Task created.",
    data: task,
  });
}
