import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteCheckIn, updateCheckIn } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const patchSchema = z.object({
  curriculum: z.string().min(1).optional(),
  chapter: z.string().min(1).optional(),
  mastery: z.number().min(1).max(5).optional(),
  notes: z.string().min(1).optional(),
  date: z.string().min(1).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ checkInId: string }> }
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
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Invalid check-in update payload.",
      },
      { status: 400 }
    );
  }

  const record = await updateCheckIn((await params).checkInId, parsed.data);

  if (!record) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Check-in not found.",
      },
      { status: 404 }
    );
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "checkin_updated",
    targetType: "checkin",
    targetId: record.id,
    status: "success",
    inputSummary: `${record.curriculum} / ${record.chapter}`,
    outputSummary: `Check-in updated to mastery ${record.mastery}/5`,
  });

  return NextResponse.json({
    success: true,
    entity_id: record.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Check-in updated.",
    data: record,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ checkInId: string }> }
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

  const record = await deleteCheckIn((await params).checkInId);

  if (!record) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Check-in not found.",
      },
      { status: 404 }
    );
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "checkin_deleted",
    targetType: "checkin",
    targetId: record.id,
    status: "success",
    inputSummary: `${record.curriculum} / ${record.chapter}`,
    outputSummary: "Check-in deleted",
  });

  return NextResponse.json({
    success: true,
    entity_id: record.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Check-in deleted.",
    data: record,
  });
}
