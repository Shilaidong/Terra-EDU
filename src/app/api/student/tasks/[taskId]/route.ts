import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteTask, updateTaskStatus } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  status: z.enum(["pending", "in_progress", "done"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
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

  const params = await context.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Invalid status payload.",
      },
      { status: 400 }
    );
  }

  const task = await updateTaskStatus(params.taskId, parsed.data.status);

  if (!task) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Task not found.",
      },
      { status: 404 }
    );
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/timeline",
    action: "task_status_updated",
    targetType: "task",
    targetId: task.id,
    status: "success",
    inputSummary: `Set task status to ${task.status}`,
    outputSummary: `${task.title} is now ${task.status}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: task.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Task updated.",
    data: task,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
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

  const params = await context.params;
  const task = await deleteTask(params.taskId);

  if (!task) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Task not found.",
      },
      { status: 404 }
    );
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/timeline",
    action: "timeline_task_deleted",
    targetType: "task",
    targetId: task.id,
    status: "success",
    inputSummary: `Delete ${task.title}`,
    outputSummary: `${task.title} removed from timeline`,
  });

  return NextResponse.json({
    success: true,
    entity_id: task.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Task deleted.",
    data: task,
  });
}
