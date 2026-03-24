import { NextResponse } from "next/server";
import { z } from "zod";

import { createCheckIn } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  curriculum: z.string().min(1),
  chapter: z.string().min(1),
  mastery: z.number().min(1).max(5),
  notes: z.string().min(1),
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
        message: "Invalid check-in payload.",
      },
      { status: 400 }
    );
  }

  const record = createCheckIn({
    ...parsed.data,
    date: new Date().toISOString().slice(0, 10),
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "checkin_saved",
    targetType: "checkin",
    targetId: record.id,
    status: "success",
    inputSummary: `${record.curriculum} / ${record.chapter}`,
    outputSummary: `Mastery ${record.mastery}/5 saved`,
  });

  return NextResponse.json({
    success: true,
    entity_id: record.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Check-in saved.",
    data: record,
  });
}
