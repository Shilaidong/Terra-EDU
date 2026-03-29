import { NextResponse } from "next/server";
import { z } from "zod";

import { updateStudentApplicationProfile } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  legalFirstName: z.string().default(""),
  legalLastName: z.string().default(""),
  preferredName: z.string().default(""),
  dateOfBirth: z.string().default(""),
  citizenship: z.string().default(""),
  birthCountry: z.string().default(""),
  phoneNumber: z.string().default(""),
  addressLine1: z.string().default(""),
  city: z.string().default(""),
  stateProvince: z.string().default(""),
  postalCode: z.string().default(""),
  countryOfResidence: z.string().default(""),
  highSchoolName: z.string().default(""),
  curriculumSystem: z.string().default(""),
  graduationYear: z.string().default(""),
  gpa: z.string().default(""),
  classRank: z.string().default(""),
  englishProficiencyStatus: z.string().default(""),
  intendedStartTerm: z.string().default(""),
  passportCountry: z.string().default(""),
  additionalContext: z.string().default(""),
  transcriptSourceMarkdown: z.string().default(""),
  transcriptStructuredMarkdown: z.string().default(""),
  planningBookMarkdown: z.string().default(""),
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

  try {
    const { studentId, ...profileInput } = parsed.data;
    const profile = await updateStudentApplicationProfile(studentId, profileInput);

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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: error instanceof Error ? error.message : "Application profile update failed.",
      },
      { status: 500 }
    );
  }
}
