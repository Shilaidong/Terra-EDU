import { NextResponse } from "next/server";
import { z } from "zod";

import {
  generateConsultantWeeklyReport,
  generateMeetingSummary,
  generateParentWeeklySummary,
  generateTaskBreakdown,
  getAiProviderConfig,
  type AiWorkflowKind,
} from "@/lib/ai/provider";
import {
  getCurrentStudentData,
  getParentOverviewData,
  getStudentByIdData,
  getStudentCheckInsData,
  getStudentMilestonesData,
  getStudentNotesData,
  getStudentTasksData,
} from "@/lib/data";
import { createTraceContext, finishTrace, logAiArtifact } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  kind: z.enum([
    "student_task_breakdown",
    "consultant_weekly_report",
    "consultant_meeting_summary",
    "parent_weekly_summary",
  ] satisfies [AiWorkflowKind, ...AiWorkflowKind[]]),
  studentId: z.string(),
  page: z.string(),
  text: z.string().optional(),
});

export async function POST(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session) {
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
        message: "Invalid AI workflow payload.",
      },
      { status: 400 }
    );
  }

  const { kind, studentId, page, text } = parsed.data;

  if (kind === "student_task_breakdown" && session.role !== "student") {
    return unauthorized(trace);
  }

  if ((kind === "consultant_weekly_report" || kind === "consultant_meeting_summary") && session.role !== "consultant") {
    return unauthorized(trace);
  }

  if (kind === "parent_weekly_summary" && session.role !== "parent") {
    return unauthorized(trace);
  }

  const student =
    session.role === "student"
      ? await getCurrentStudentData(session)
      : session.role === "parent"
        ? (await getParentOverviewData()).student
        : await getStudentByIdData(studentId);

  if (!student) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Student not found.",
      },
      { status: 404 }
    );
  }

  if (session.role !== "consultant" && student.id !== studentId) {
    return unauthorized(trace);
  }

  const [tasks, milestones, checkIns, notes] = await Promise.all([
    getStudentTasksData(student.id),
    getStudentMilestonesData(student.id),
    getStudentCheckInsData(student.id),
    getStudentNotesData(student.id),
  ]);

  try {
    const result = await runWorkflow({
      kind,
      text,
      student,
      tasks,
      milestones,
      checkIns,
      notes,
    });

    logAiArtifact({
      studentId: student.id,
      role: session.role,
      page,
      feature: kind,
      model: result.model,
      promptVersion: result.promptVersion,
      inputSummary: text?.trim() || `${kind} requested`,
      outputSummary: result.summary,
      sources: result.sources,
      traceId: trace.traceId,
      decisionId: trace.decisionId,
      status: "success",
    });

    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page,
      action: `${kind}_generated`,
      targetType: "ai_artifact",
      targetId: kind,
      status: "success",
      inputSummary: text?.trim() || `${kind} requested`,
      outputSummary: result.summary,
    });

    return NextResponse.json({
      success: true,
      entity_id: student.id,
      trace_id: trace.traceId,
      decision_id: trace.decisionId,
      message: "AI workflow generated.",
      data: {
        ...result.payload,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
      },
    });
  } catch (error) {
    const provider = getAiProviderConfig();
    const outputSummary = error instanceof Error ? error.message : "AI workflow failed.";

    logAiArtifact({
      studentId: student.id,
      role: session.role,
      page,
      feature: kind,
      model: provider.model,
      promptVersion: provider.promptVersion,
      inputSummary: text?.trim() || `${kind} requested`,
      outputSummary,
      sources: [],
      traceId: trace.traceId,
      decisionId: trace.decisionId,
      status: "error",
      errorCode: "ai_provider_error",
    });

    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page,
      action: `${kind}_generated`,
      targetType: "ai_artifact",
      targetId: kind,
      status: "error",
      inputSummary: text?.trim() || `${kind} requested`,
      outputSummary,
      errorCode: "ai_provider_error",
    });

    return NextResponse.json(
      {
        success: false,
        entity_id: student.id,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: outputSummary,
      },
      { status: 502 }
    );
  }
}

async function runWorkflow(input: {
  kind: AiWorkflowKind;
  text?: string;
  student: NonNullable<Awaited<ReturnType<typeof getStudentByIdData>>>;
  tasks: Awaited<ReturnType<typeof getStudentTasksData>>;
  milestones: Awaited<ReturnType<typeof getStudentMilestonesData>>;
  checkIns: Awaited<ReturnType<typeof getStudentCheckInsData>>;
  notes: Awaited<ReturnType<typeof getStudentNotesData>>;
}) {
  if (input.kind === "student_task_breakdown") {
    if (!input.text?.trim()) {
      throw new Error("Please enter the task you want AI to break down.");
    }

    const result = await generateTaskBreakdown({
      goal: input.text,
      student: input.student,
      tasks: input.tasks,
      milestones: input.milestones,
    });

    return {
      model: result.model,
      promptVersion: result.promptVersion,
      sources: result.sources,
      summary: result.summary,
      payload: {
        title: result.title,
        summary: result.summary,
        steps: result.steps,
        sources: result.sources,
      },
    };
  }

  if (input.kind === "consultant_weekly_report") {
    const result = await generateConsultantWeeklyReport({
      student: input.student,
      tasks: input.tasks,
      milestones: input.milestones,
      checkIns: input.checkIns,
      notes: input.notes,
    });

    return {
      model: result.model,
      promptVersion: result.promptVersion,
      sources: result.sources,
      summary: result.summary,
      payload: {
        summary: result.summary,
        progress: result.progress,
        risks: result.risks,
        nextActions: result.nextActions,
        sources: result.sources,
      },
    };
  }

  if (input.kind === "consultant_meeting_summary") {
    if (!input.text?.trim()) {
      throw new Error("Please paste the meeting transcript before generating the summary.");
    }

    const result = await generateMeetingSummary({
      student: input.student,
      transcript: input.text,
    });

    return {
      model: result.model,
      promptVersion: result.promptVersion,
      sources: result.sources,
      summary: result.summary,
      payload: {
        summary: result.summary,
        studentFeedback: result.studentFeedback,
        parentFeedback: result.parentFeedback,
        consultantAdvice: result.consultantAdvice,
        followUps: result.followUps,
        risks: result.risks,
        sources: result.sources,
      },
    };
  }

  const result = await generateParentWeeklySummary({
    student: input.student,
    tasks: input.tasks,
    milestones: input.milestones,
    checkIns: input.checkIns,
    notes: input.notes,
  });

  return {
    model: result.model,
    promptVersion: result.promptVersion,
    sources: result.sources,
    summary: result.summary,
    payload: {
      summary: result.summary,
      progress: result.progress,
      nextFocus: result.nextFocus,
      parentSupport: result.parentSupport,
      sources: result.sources,
    },
  };
}

function unauthorized(trace: ReturnType<typeof createTraceContext>) {
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
