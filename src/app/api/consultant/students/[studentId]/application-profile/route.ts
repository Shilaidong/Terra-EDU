import { NextResponse } from "next/server";
import { z } from "zod";

import { getLinkedStudentIdsForConsultant, updateStudentApplicationProfile } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
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
  ).max(10).default([]),
  activities: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      grades: z.string(),
      timeCommitment: z.string(),
      impact: z.string(),
    })
  ).max(20).default([]),
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

  try {
    const studentId = (await context.params).studentId;
    const linkedStudentIds = await getLinkedStudentIdsForConsultant(session.userId);

    if (!linkedStudentIds.includes(studentId)) {
      return NextResponse.json(
        {
          success: false,
          trace_id: trace.traceId,
          decision_id: trace.decisionId,
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    const profile = await updateStudentApplicationProfile(studentId, parsed.data);

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
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: error instanceof Error ? error.message : "Student application profile update failed.",
      },
      { status: 500 }
    );
  }
}
