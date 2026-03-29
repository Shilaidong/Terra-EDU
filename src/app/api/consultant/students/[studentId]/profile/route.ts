import { NextResponse } from "next/server";
import { z } from "zod";

import { updateStudentProfile } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const studentPhaseValues = ["Planning", "Application", "Submission", "Decision", "Visa"] as const;

const schema = z.object({
  grade: z.string().min(1),
  school: z.string().min(1),
  phase: z.enum(studentPhaseValues),
  targetCountries: z.array(z.string()),
  dreamSchools: z.array(z.string()),
  intendedMajor: z.string(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ studentId: string }> }
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
        message: "Invalid student profile payload.",
      },
      { status: 400 }
    );
  }

  const studentId = (await context.params).studentId;
  const student = await updateStudentProfile(studentId, parsed.data);

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

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/consultant/students/[studentId]",
    action: "consultant_student_profile_updated",
    targetType: "student",
    targetId: student.id,
    status: "success",
    inputSummary: "Consultant updated student grade, school, phase, and goals",
    outputSummary: `${student.name}, ${student.grade}, ${student.school}, phase ${student.phase}, major ${student.intendedMajor}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: student.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Student profile updated.",
    data: student,
  });
}
