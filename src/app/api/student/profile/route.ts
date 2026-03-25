import { NextResponse } from "next/server";
import { z } from "zod";

import { avatarPresetValues } from "@/lib/avatar-presets";
import { updateStudentProfile } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession, setSession } from "@/lib/session";

const studentPhaseValues = ["Planning", "Application", "Submission", "Decision", "Visa"] as const;

const schema = z.object({
  studentId: z.string(),
  name: z.string().min(1),
  grade: z.string().min(1),
  school: z.string().min(1),
  phase: z.enum(studentPhaseValues),
  targetCountries: z.array(z.string()).min(1),
  dreamSchools: z.array(z.string()).min(1),
  intendedMajor: z.string().min(1),
  avatar: z.enum(avatarPresetValues),
});

export async function PATCH(request: Request) {
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
        message: "Invalid profile payload.",
      },
      { status: 400 }
    );
  }

  const student = updateStudentProfile(parsed.data.studentId, parsed.data);

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

  await setSession({
    userId: session.userId,
    role: session.role,
    name: student.name,
    email: session.email,
    avatar: student.avatar,
    authSource: session.authSource,
    authUserId: session.authUserId,
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/settings",
    action: "student_profile_updated",
    targetType: "student",
    targetId: student.id,
    status: "success",
    inputSummary: "Updated name, grade, school, phase, avatar, target countries, dream schools, and major",
    outputSummary: `${student.name}, ${student.grade}, ${student.school}, phase ${student.phase}, major ${student.intendedMajor}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: student.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Profile updated.",
    data: student,
  });
}
