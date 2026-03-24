import { NextResponse } from "next/server";
import { z } from "zod";

import { createContentItem } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  type: z.enum(["course", "chapter", "competition", "school", "major"]),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  country: z.string().optional(),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(["Safety", "Match", "Reach"]),
  status: z.enum(["published", "draft"]),
});

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
        message: "Invalid content payload.",
      },
      { status: 400 }
    );
  }

  const item = createContentItem({
    ...parsed.data,
    source: "manual",
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/consultant/content",
    action: "content_item_created",
    targetType: "content_item",
    targetId: item.id,
    status: "success",
    inputSummary: item.title,
    outputSummary: `${item.type} created as ${item.status}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: item.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Content item created.",
    data: item,
  });
}
