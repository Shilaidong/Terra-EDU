import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteMilestone, updateMilestone } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  title: z.string().min(1),
  eventDate: z.string().min(1),
  status: z.enum(["upcoming", "done"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ milestoneId: string }> }
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

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Invalid milestone payload.",
      },
      { status: 400 }
    );
  }

  const params = await context.params;
  const milestone = await updateMilestone(params.milestoneId, parsed.data);

  if (!milestone) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Milestone not found.",
      },
      { status: 404 }
    );
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/timeline",
    action: "milestone_updated",
    targetType: "milestone",
    targetId: milestone.id,
    status: "success",
    inputSummary: `${milestone.title} on ${milestone.eventDate}`,
    outputSummary: `Milestone updated as ${milestone.status}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: milestone.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Milestone updated.",
    data: milestone,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ milestoneId: string }> }
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
  const milestone = await deleteMilestone(params.milestoneId);

  if (!milestone) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Milestone not found.",
      },
      { status: 404 }
    );
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/timeline",
    action: "milestone_deleted",
    targetType: "milestone",
    targetId: milestone.id,
    status: "success",
    inputSummary: `Delete ${milestone.title}`,
    outputSummary: `${milestone.title} removed`,
  });

  return NextResponse.json({
    success: true,
    entity_id: milestone.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Milestone deleted.",
    data: milestone,
  });
}
