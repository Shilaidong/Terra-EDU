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

const laneMeta: Record<TimelineLane, { category: string; dueLabel: string }> = {
  standardized_exams: {
    category: "Standardized Exams",
    dueLabel: "Tracked in exam lane",
  },
  application_progress: {
    category: "Application Progress",
    dueLabel: "Tracked in application lane",
  },
  activities: {
    category: "Activities",
    dueLabel: "Tracked in activity lane",
  },
  competitions: {
    category: "Competitions",
    dueLabel: "Tracked in competition lane",
  },
};

export async function POST(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session || session.role !== "student") {
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
        message: "Invalid timeline task payload.",
      },
      { status: 400 }
    );
  }

  const meta = laneMeta[parsed.data.timelineLane];
  const task = createTask({
    studentId: parsed.data.studentId,
    title: parsed.data.title,
    description: parsed.data.description,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    timelineLane: parsed.data.timelineLane,
    dueLabel: meta.dueLabel,
    dueDate: parsed.data.endDate,
    category: meta.category,
    priority: parsed.data.priority,
    status: "pending",
    ownerRole: "student",
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/timeline",
    action: "timeline_task_created",
    targetType: "task",
    targetId: task.id,
    status: "success",
    inputSummary: `${task.title} from ${task.startDate} to ${task.endDate}`,
    outputSummary: `Task created in ${task.timelineLane}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: task.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Timeline task created.",
    data: task,
  });
}
