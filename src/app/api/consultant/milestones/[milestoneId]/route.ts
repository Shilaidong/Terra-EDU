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
        message: "Invalid milestone payload.",
      },
      { status: 400 }
    );
  }

  const milestone = await updateMilestone((await context.params).milestoneId, parsed.data);

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
    page: "/consultant/students/[studentId]",
    action: "consultant_milestone_updated",
    targetType: "milestone",
    targetId: milestone.id,
    status: "success",
    inputSummary: `${milestone.title} on ${milestone.eventDate}`,
    outputSummary: `Deadline updated as ${milestone.status}`,
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

  const milestone = await deleteMilestone((await context.params).milestoneId);

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
    page: "/consultant/students/[studentId]",
    action: "consultant_milestone_deleted",
    targetType: "milestone",
    targetId: milestone.id,
    status: "success",
    inputSummary: `Delete ${milestone.title}`,
    outputSummary: `${milestone.title} removed from workspace`,
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
