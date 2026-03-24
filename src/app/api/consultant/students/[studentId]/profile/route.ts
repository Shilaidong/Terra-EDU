import { NextResponse } from "next/server";
import { z } from "zod";

import { avatarPresetValues } from "@/lib/avatar-presets";
import { updateStudentProfile } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  name: z.string().min(1),
  grade: z.string().min(1),
  school: z.string().min(1),
  targetCountries: z.array(z.string()).min(1),
  dreamSchools: z.array(z.string()).min(1),
  intendedMajor: z.string().min(1),
  avatar: z.enum(avatarPresetValues),
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
  const student = updateStudentProfile(studentId, parsed.data);

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
    inputSummary: "Consultant updated student profile basics and goals",
    outputSummary: `${student.name}, ${student.grade}, ${student.school}, major ${student.intendedMajor}`,
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
