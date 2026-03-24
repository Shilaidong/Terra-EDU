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
  timelineLane: z.enum(["standardized_exams", "application_progress", "activities", "competitions"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  priority: z.enum(["Low", "Medium", "High"]),
});

function getLaneCategory(lane: TimelineLane) {
  switch (lane) {
    case "standardized_exams":
      return "Exams";
    case "activities":
      return "Activities";
    case "competitions":
      return "Competition";
    default:
      return "Application";
  }
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
    dueLabel: `Consultant scheduled · ${parsed.data.endDate}`,
    dueDate: parsed.data.endDate,
    category: getLaneCategory(parsed.data.timelineLane),
    ownerRole: "consultant",
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
