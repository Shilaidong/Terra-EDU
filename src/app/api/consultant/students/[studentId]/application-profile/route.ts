import { NextResponse } from "next/server";
import { z } from "zod";

import { updateStudentApplicationProfile } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  legalFirstName: z.string().min(1),
  legalLastName: z.string().min(1),
  preferredName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  citizenship: z.string().min(1),
  birthCountry: z.string().min(1),
  phoneNumber: z.string().min(1),
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  stateProvince: z.string().min(1),
  postalCode: z.string().min(1),
  countryOfResidence: z.string().min(1),
  highSchoolName: z.string().min(1),
  curriculumSystem: z.string().min(1),
  graduationYear: z.string().min(1),
  gpa: z.string().min(1),
  classRank: z.string().min(1),
  englishProficiencyStatus: z.string().min(1),
  intendedStartTerm: z.string().min(1),
  passportCountry: z.string().min(1),
  additionalContext: z.string().default(""),
  competitions: z.array(
    z.object({
      name: z.string(),
      field: z.string(),
      year: z.string(),
      level: z.string(),
      result: z.string(),
    })
  ).length(10),
  activities: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      grades: z.string(),
      timeCommitment: z.string(),
      impact: z.string(),
    })
  ).length(20),
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
        message: "Invalid student application profile payload.",
      },
      { status: 400 }
    );
  }

  const studentId = (await context.params).studentId;
  const profile = updateStudentApplicationProfile(studentId, parsed.data);

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/consultant/students/[studentId]",
    action: "consultant_student_application_profile_updated",
    targetType: "student_application_profile",
    targetId: studentId,
    status: "success",
    inputSummary: "Consultant updated Common App style student application profile, competitions, and activities",
    outputSummary: `${profile.highSchoolName}, ${profile.curriculumSystem}, ${profile.competitions.filter((item) => item.name.trim()).length} competitions, ${profile.activities.filter((item) => item.name.trim()).length} activities`,
  });

  return NextResponse.json({
    success: true,
    entity_id: studentId,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Student application profile updated.",
    data: profile,
  });
}
