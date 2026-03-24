import { NextResponse } from "next/server";
import { z } from "zod";

import { createMilestone } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  title: z.string().min(1),
  eventDate: z.string().min(1),
  status: z.enum(["upcoming", "done"]),
});

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
        message: "Invalid milestone payload.",
      },
      { status: 400 }
    );
  }

  const milestone = createMilestone(parsed.data);

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/timeline",
    action: "milestone_created",
    targetType: "milestone",
    targetId: milestone.id,
    status: "success",
    inputSummary: `${milestone.title} on ${milestone.eventDate}`,
    outputSummary: `Milestone created as ${milestone.status}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: milestone.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Milestone created.",
    data: milestone,
  });
}
