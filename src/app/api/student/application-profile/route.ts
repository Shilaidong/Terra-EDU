import { NextResponse } from "next/server";
import { z } from "zod";

import { updateStudentApplicationProfile } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
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
        message: "Invalid application profile payload.",
      },
      { status: 400 }
    );
  }

  const { studentId, ...profileInput } = parsed.data;
  const profile = updateStudentApplicationProfile(studentId, profileInput);

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/documents",
    action: "student_application_profile_updated",
    targetType: "student_application_profile",
    targetId: studentId,
    status: "success",
    inputSummary: "Updated Common App style student application profile",
    outputSummary: `${profile.highSchoolName}, ${profile.curriculumSystem}, ${profile.intendedStartTerm}`,
  });

  return NextResponse.json({
    success: true,
    entity_id: studentId,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Application profile updated.",
    data: profile,
  });
}
