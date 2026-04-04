import { NextResponse } from "next/server";
import { z } from "zod";

import { avatarPresetValues, getDefaultStudentAvatar } from "@/lib/avatar-presets";
import { getUserRecordByEmail } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { consumeRateLimit, getRequestIdentity } from "@/lib/rate-limit";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { getStore } from "@/lib/store";
import type { StudentApplicationProfile, StudentRecord, User } from "@/lib/types";

const schema = z.object({
  role: z.enum(["student", "parent", "consultant"]),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  grade: z.string().optional(),
  school: z.string().optional(),
});

export async function POST(request: Request) {
  const trace = createTraceContext();
  const body = await request.json();
  const parsed = schema.safeParse(body);
  const requestIdentity = getRequestIdentity(request);

  if (!parsed.success) {
    finishTrace(trace, {
      actorId: "anonymous",
      actorRole: "student",
      page: "/register",
      action: "public_registration_failed",
      targetType: "registration",
      targetId: "invalid_payload",
      status: "error",
      errorCode: "INVALID_PAYLOAD",
      inputSummary: "Malformed public registration payload",
      outputSummary: "Rejected before account creation",
    });

    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Invalid registration payload.",
      },
      { status: 400 }
    );
  }

  const { role, name, email, password, grade, school } = parsed.data;
  const rateLimit = consumeRateLimit({
    scope: "auth:register",
    key: `${requestIdentity}:${email.toLowerCase()}:${role}`,
    limit: 4,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    finishTrace(trace, {
      actorId: "anonymous",
      actorRole: role,
      page: "/register",
      action: "public_registration_rate_limited",
      targetType: "registration",
      targetId: email,
      status: "error",
      errorCode: "RATE_LIMITED",
      inputSummary: `Registration throttled for ${email}`,
      outputSummary: `Retry after ${rateLimit.retryAfterSeconds} seconds`,
    });

    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Too many registration attempts. Please wait a bit and try again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  if (role === "student" && (!grade?.trim() || !school?.trim())) {
    finishTrace(trace, {
      actorId: "anonymous",
      actorRole: role,
      page: "/register",
      action: "public_registration_failed",
      targetType: "registration",
      targetId: email,
      status: "error",
      errorCode: "MISSING_STUDENT_FIELDS",
      inputSummary: `Registration missing school data for ${email}`,
      outputSummary: "Student registration requires grade and school",
    });

    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Student registration requires grade and school.",
      },
      { status: 400 }
    );
  }

  const existing = await getUserRecordByEmail(email);
  if (existing) {
    finishTrace(trace, {
      actorId: "anonymous",
      actorRole: role,
      page: "/register",
      action: "public_registration_failed",
      targetType: "registration",
      targetId: email,
      status: "error",
      errorCode: "EMAIL_EXISTS",
      inputSummary: `Duplicate registration for ${email}`,
      outputSummary: "Email already registered",
    });

    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "This email has already been registered.",
      },
      { status: 409 }
    );
  }

  const supabase = getSupabaseAdminClient();

  try {
    if (supabase) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, name },
      });

      if (error || !data.user) {
        throw new Error(error?.message || "Supabase signup failed.");
      }

      const userId = data.user.id;

      await supabase.from("users").upsert({
        id: userId,
        email,
        role,
        name,
        avatar: role === "student" ? avatarPresetValues[0] : role === "parent" ? avatarPresetValues[2] : avatarPresetValues[1],
      });

      await supabase.from("profiles").insert({
        user_id: userId,
        school: role === "student" ? school?.trim() || "" : "Terra Edu",
        grade_or_title: role === "student" ? grade?.trim() || "" : role === "parent" ? "Parent Account" : "Consultant Account",
        bio:
          role === "student"
            ? "New student registration"
            : role === "parent"
              ? "New parent registration pending student binding"
              : "New consultant registration pending student assignment",
      });

      let entityId = userId;

      if (role === "student") {
        const studentId = crypto.randomUUID();
        entityId = studentId;

        await supabase.from("students").insert({
          id: studentId,
          user_id: userId,
          name,
          grade: grade?.trim() || "Grade 11",
          school: school?.trim() || "TBD School",
          phase: "Planning",
          target_countries: [],
          dream_schools: [],
          intended_major: "",
          completion: 0,
          check_in_streak: 0,
          mastery_average: 0,
          avatar: getDefaultStudentAvatar(),
        });

        const [firstName = "", ...restName] = name.split(" ");
        const applicationProfile: StudentApplicationProfile = {
          studentId,
          legalFirstName: firstName,
          legalLastName: restName.join(" "),
          preferredName: firstName,
          dateOfBirth: "",
          citizenship: "",
          birthCountry: "",
          phoneNumber: "",
          addressLine1: "",
          city: "",
          stateProvince: "",
          postalCode: "",
          countryOfResidence: "",
          highSchoolName: school?.trim() || "",
          curriculumSystem: "",
          graduationYear: "",
          gpa: "",
          classRank: "",
          englishProficiencyStatus: "",
          intendedStartTerm: "",
          passportCountry: "",
          additionalContext: "",
          transcriptSourceMarkdown: "",
          transcriptStructuredMarkdown: "",
          planningBookMarkdown: "",
          competitions: Array.from({ length: 10 }, () => ({ name: "", field: "", year: "", level: "", result: "" })),
          activities: Array.from({ length: 20 }, () => ({ name: "", role: "", grades: "", timeCommitment: "", impact: "" })),
        };

        await supabase.from("student_application_profiles").upsert({
          student_id: studentId,
          legal_first_name: applicationProfile.legalFirstName,
          legal_last_name: applicationProfile.legalLastName,
          preferred_name: applicationProfile.preferredName,
          date_of_birth: applicationProfile.dateOfBirth,
          citizenship: applicationProfile.citizenship,
          birth_country: applicationProfile.birthCountry,
          phone_number: applicationProfile.phoneNumber,
          address_line_1: applicationProfile.addressLine1,
          city: applicationProfile.city,
          state_province: applicationProfile.stateProvince,
          postal_code: applicationProfile.postalCode,
          country_of_residence: applicationProfile.countryOfResidence,
          high_school_name: applicationProfile.highSchoolName,
          curriculum_system: applicationProfile.curriculumSystem,
          graduation_year: applicationProfile.graduationYear,
          gpa: applicationProfile.gpa,
          class_rank: applicationProfile.classRank,
          english_proficiency_status: applicationProfile.englishProficiencyStatus,
          intended_start_term: applicationProfile.intendedStartTerm,
          passport_country: applicationProfile.passportCountry,
          additional_context: applicationProfile.additionalContext,
          transcript_source_markdown: applicationProfile.transcriptSourceMarkdown,
          transcript_structured_markdown: applicationProfile.transcriptStructuredMarkdown,
          planning_book_markdown: applicationProfile.planningBookMarkdown,
          competitions: applicationProfile.competitions,
          activities: applicationProfile.activities,
        });
      }

      finishTrace(trace, {
        actorId: userId,
        actorRole: role,
        page: "/register",
        action: "public_registration_created",
        targetType: role,
        targetId: entityId,
        status: "success",
        inputSummary: `${role} registration for ${email}`,
        outputSummary: "Public registration completed",
      });

      return NextResponse.json({
        success: true,
        entity_id: entityId,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message:
          role === "student"
            ? "Registration complete. You can now log in."
            : "Registration complete. An administrator can now bind this account to a student.",
      });
    }

    const store = getStore();
    const userId = crypto.randomUUID();
    const newUser: User = {
      id: userId,
      email,
      password,
      name,
      role,
      profileId: crypto.randomUUID(),
      avatar: role === "student" ? avatarPresetValues[0] : role === "parent" ? avatarPresetValues[2] : avatarPresetValues[1],
    };
    store.users.unshift(newUser);
    store.profiles.unshift({
      id: newUser.profileId,
      school: role === "student" ? school?.trim() || "" : "Terra Edu",
      gradeOrTitle: role === "student" ? grade?.trim() || "" : role === "parent" ? "Parent Account" : "Consultant Account",
      bio: "Public registration",
    });

    let entityId = userId;
    if (role === "student") {
      const studentId = crypto.randomUUID();
      entityId = studentId;
      const student: StudentRecord = {
        id: studentId,
        userId,
        name,
        grade: grade?.trim() || "Grade 11",
        school: school?.trim() || "TBD School",
        phase: "Planning",
        targetCountries: [],
        dreamSchools: [],
        intendedMajor: "",
        completion: 0,
        checkInStreak: 0,
        masteryAverage: 0,
        avatar: getDefaultStudentAvatar(),
      };
      store.students.unshift(student);
      const [firstName = "", ...restName] = name.split(" ");
      store.applicationProfiles.unshift({
        studentId,
        legalFirstName: firstName,
        legalLastName: restName.join(" "),
        preferredName: firstName,
        dateOfBirth: "",
        citizenship: "",
        birthCountry: "",
        phoneNumber: "",
        addressLine1: "",
        city: "",
        stateProvince: "",
        postalCode: "",
        countryOfResidence: "",
        highSchoolName: school?.trim() || "",
        curriculumSystem: "",
        graduationYear: "",
        gpa: "",
        classRank: "",
        englishProficiencyStatus: "",
        intendedStartTerm: "",
        passportCountry: "",
        additionalContext: "",
        transcriptSourceMarkdown: "",
        transcriptStructuredMarkdown: "",
        planningBookMarkdown: "",
        competitions: Array.from({ length: 10 }, () => ({ name: "", field: "", year: "", level: "", result: "" })),
        activities: Array.from({ length: 20 }, () => ({ name: "", role: "", grades: "", timeCommitment: "", impact: "" })),
      });
    }

    finishTrace(trace, {
      actorId: userId,
      actorRole: role,
      page: "/register",
      action: "public_registration_created",
      targetType: role,
      targetId: entityId,
      status: "success",
      inputSummary: `${role} registration for ${email}`,
      outputSummary: "Local registration completed",
    });

    return NextResponse.json({
      success: true,
      entity_id: entityId,
      trace_id: trace.traceId,
      decision_id: trace.decisionId,
      message:
        role === "student"
          ? "Registration complete. You can now log in."
          : "Registration complete. An administrator can now bind this account to a student.",
    });
  } catch (error) {
    finishTrace(trace, {
      actorId: "anonymous",
      actorRole: role,
      page: "/register",
      action: "public_registration_failed",
      targetType: "registration",
      targetId: email,
      status: "error",
      errorCode: "REGISTRATION_FAILED",
      inputSummary: `Registration attempt for ${email}`,
      outputSummary: error instanceof Error ? error.message : "Unknown registration failure",
    });

    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: error instanceof Error ? error.message : "Registration failed.",
      },
      { status: 500 }
    );
  }
}
