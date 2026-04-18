import { NextResponse } from "next/server";
import { z } from "zod";

import { avatarPresetValues, getDefaultStudentAvatar } from "@/lib/avatar-presets";
import { getUserRecordByEmail } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { getSession } from "@/lib/session";
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
  const session = await getSession();

  if (!session || session.role !== "admin") {
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
        message: "Invalid member payload.",
      },
      { status: 400 }
    );
  }

  const { role, name, email, password, grade, school } = parsed.data;

  if (role === "student" && (!grade?.trim() || !school?.trim())) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Student creation requires grade and school.",
      },
      { status: 400 }
    );
  }

  const existing = await getUserRecordByEmail(email);
  if (existing) {
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

  try {
    const supabase = getSupabaseAdminClient();

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
      const avatar =
        role === "student"
          ? avatarPresetValues[0]
          : role === "parent"
            ? avatarPresetValues[2]
            : avatarPresetValues[1];

      await supabase.from("users").upsert({
        id: userId,
        email,
        role,
        name,
        avatar,
      });

      await supabase.from("profiles").insert({
        user_id: userId,
        school: role === "student" ? school?.trim() || "" : "Terra Edu",
        grade_or_title:
          role === "student"
            ? grade?.trim() || ""
            : role === "parent"
              ? "Parent Account"
              : "Consultant Account",
        bio:
          role === "student"
            ? "Admin-created student account"
            : role === "parent"
              ? "Admin-created parent account pending student binding"
              : "Admin-created consultant account pending student assignment",
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
        actorId: session.userId,
        actorRole: session.role,
        page: "/admin/dashboard",
        action: "admin_member_created",
        targetType: role,
        targetId: entityId,
        status: "success",
        inputSummary: `${role} created for ${email}`,
        outputSummary: "Member created by admin",
      });

      return NextResponse.json({
        success: true,
        entity_id: entityId,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Member created.",
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
      avatar:
        role === "student"
          ? avatarPresetValues[0]
          : role === "parent"
            ? avatarPresetValues[2]
            : avatarPresetValues[1],
    };

    store.users.unshift(newUser);
    store.profiles.unshift({
      id: newUser.profileId,
      school: role === "student" ? school?.trim() || "" : "Terra Edu",
      gradeOrTitle:
        role === "student"
          ? grade?.trim() || ""
          : role === "parent"
            ? "Parent Account"
            : "Consultant Account",
      bio: "Admin-created account",
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
      actorId: session.userId,
      actorRole: session.role,
      page: "/admin/dashboard",
      action: "admin_member_created",
      targetType: role,
      targetId: entityId,
      status: "success",
      inputSummary: `${role} created for ${email}`,
      outputSummary: "Local member created by admin",
    });

    return NextResponse.json({
      success: true,
      entity_id: entityId,
      trace_id: trace.traceId,
      decision_id: trace.decisionId,
      message: "Member created.",
    });
  } catch (error) {
    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: "/admin/dashboard",
      action: "admin_member_created",
      targetType: role,
      targetId: email,
      status: "error",
      errorCode: "ADMIN_MEMBER_CREATE_FAILED",
      inputSummary: `${role} create for ${email}`,
      outputSummary: error instanceof Error ? error.message : "Member creation failed",
    });

    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: error instanceof Error ? error.message : "Member creation failed.",
      },
      { status: 500 }
    );
  }
}
