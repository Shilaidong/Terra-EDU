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

  const parsed = schema.safeParse(await request.json());

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

  const task = await updateTaskStatus((await context.params).taskId, parsed.data.status);

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
    page: "/consultant/students/[studentId]",
    action: "consultant_task_status_updated",
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

  const task = await deleteTask((await context.params).taskId);

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
    page: "/consultant/students/[studentId]",
    action: "consultant_task_deleted",
    targetType: "task",
    targetId: task.id,
    status: "success",
    inputSummary: `Delete ${task.title}`,
    outputSummary: `${task.title} removed from consultant workspace`,
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
