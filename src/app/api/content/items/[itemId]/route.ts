import { NextResponse } from "next/server";
import { z } from "zod";

import { updateContentItem } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  type: z.enum(["course", "chapter", "competition", "school", "major"]),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  country: z.string().optional(),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(["Safety", "Match", "Reach"]),
  status: z.enum(["published", "draft"]).default("published"),
  schoolDetails: z
    .object({
      ranking: z.string().optional(),
      city: z.string().optional(),
      tuitionUsd: z.number().optional(),
      acceptanceRate: z.string().optional(),
    })
    .optional(),
  majorDetails: z
    .object({
      degree: z.string().optional(),
      stemEligible: z.boolean().optional(),
      recommendedBackground: z.string().optional(),
      careerPaths: z.array(z.string()).default([]),
    })
    .optional(),
  competitionDetails: z
    .object({
      organizer: z.string().optional(),
      eligibility: z.string().optional(),
      award: z.string().optional(),
      season: z.string().optional(),
    })
    .optional(),
  courseDetails: z
    .object({
      provider: z.string().optional(),
      format: z.enum(["Online", "Offline", "Hybrid"]).optional(),
      durationWeeks: z.number().optional(),
      workload: z.string().optional(),
    })
    .optional(),
  chapterDetails: z
    .object({
      curriculum: z.string().optional(),
      sequence: z.string().optional(),
      estimatedHours: z.number().optional(),
      keySkill: z.string().optional(),
    })
    .optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
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

  const { itemId } = await context.params;
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

  const item = await updateContentItem(itemId, parsed.data);

  if (!item) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Content item not found.",
      },
      { status: 404 }
    );
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/consultant/content",
    action: "content_item_updated",
    targetType: "content_item",
    targetId: item.id,
    status: "success",
    inputSummary: item.title,
    outputSummary: `${item.type} updated`,
  });

  return NextResponse.json({
    success: true,
    entity_id: item.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Content item updated.",
    data: item,
  });
}
