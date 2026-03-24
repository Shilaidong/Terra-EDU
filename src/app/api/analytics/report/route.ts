import { NextResponse } from "next/server";

import { getAnalyticsData } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

export async function GET() {
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

  const analytics = await getAnalyticsData();
  const csv = [
    "date,active_students,task_completion_rate,milestone_hit_rate,at_risk_count",
    `${analytics.date},${analytics.activeStudents},${analytics.taskCompletionRate},${analytics.milestoneHitRate},${analytics.atRiskCount}`,
  ].join("\n");

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/consultant/analytics",
    action: "analytics_report_exported",
    targetType: "analytics_report",
    targetId: analytics.date,
    status: "success",
    inputSummary: "Requested cohort export",
    outputSummary: `CSV generated for ${analytics.date}`,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="terra-analytics-${analytics.date}.csv"`,
    },
  });
}
