import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { getDefaultStudentAvatar } from "@/lib/avatar-presets";
import {
  createStudentConsultantLink,
  createStudentParentLink,
  getUserRecordByEmail,
} from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import type {
  StudentActivityEntry,
  StudentApplicationProfile,
  StudentCompetitionEntry,
  TimelineLane,
  UserRole,
} from "@/lib/types";

type Row = Record<string, unknown>;

const sheetAliases = {
  student_account: ["student_account"],
  application_profile: ["application_profile"],
  competitions: ["competitions"],
  activities: ["activities"],
  tasks: ["tasks"],
  milestones: ["milestones"],
  notes: ["notes"],
  bindings: ["bindings"],
  vocabulary_packs: ["vocabulary_packs"],
  vocabulary_words: ["vocabulary_words"],
  homework_questions: ["homework_questions"],
  reading_passages: ["reading_passages"],
} as const;

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

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Student workbook import requires Supabase-backed storage.",
      },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Missing workbook file.",
      },
      { status: 400 }
    );
  }

  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Please upload the .xlsx template workbook.",
      },
      { status: 400 }
    );
  }

  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
    const studentAccountRow = getFirstSheetRow(workbook, "student_account");

    if (!studentAccountRow) {
      return NextResponse.json(
        {
          success: false,
          trace_id: trace.traceId,
          decision_id: trace.decisionId,
          message: "The workbook must include one row in the student_account sheet.",
        },
        { status: 400 }
      );
    }

    const warnings: string[] = [];
    const studentEmail = requiredString(studentAccountRow, "email");
    const studentName = requiredString(studentAccountRow, "name");
    const studentPassword = asString(studentAccountRow.password) ?? "terra123";
    const grade = asString(studentAccountRow.grade) ?? "Grade 11";
    const school = asString(studentAccountRow.school) ?? "TBD School";
    const phase = normalizeStudentPhase(studentAccountRow.phase);
    const avatar = asString(studentAccountRow.avatar) ?? getDefaultStudentAvatar();
    const targetCountries = splitCsvCell(studentAccountRow.target_countries);
    const dreamSchools = splitCsvCell(studentAccountRow.dream_schools);
    const intendedMajor = asString(studentAccountRow.intended_major) ?? "";

    let studentUser = await getUserRecordByEmail(studentEmail);
    let createdUser = false;

    if (studentUser && studentUser.role !== "student") {
      return NextResponse.json(
        {
          success: false,
          trace_id: trace.traceId,
          decision_id: trace.decisionId,
          message: `The email ${studentEmail} already belongs to a ${studentUser.role} account.`,
        },
        { status: 409 }
      );
    }

    if (!studentUser) {
      const authResult = await supabase.auth.admin.createUser({
        email: studentEmail,
        password: studentPassword,
        email_confirm: true,
        user_metadata: {
          role: "student",
          name: studentName,
        },
      });

      if (authResult.error || !authResult.data.user) {
        throw new Error(authResult.error?.message || "Failed to create student auth account.");
      }

      createdUser = true;
      studentUser = {
        id: authResult.data.user.id,
        email: studentEmail,
        password: "",
        name: studentName,
        role: "student",
        profileId: "",
        avatar,
      };
    }

    await supabase.from("users").upsert({
      id: studentUser.id,
      email: studentEmail,
      role: "student",
      name: studentName,
      avatar,
    });

    const { data: existingProfileRow } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", studentUser.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingProfileRow?.id) {
      await supabase
        .from("profiles")
        .update({
          school,
          grade_or_title: grade,
          bio: "Imported student profile",
        })
        .eq("id", existingProfileRow.id);
    } else {
      await supabase.from("profiles").insert({
        user_id: studentUser.id,
        school,
        grade_or_title: grade,
        bio: "Imported student profile",
      });
    }

    const { data: existingStudentRow } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", studentUser.id)
      .maybeSingle();

    const studentId = existingStudentRow?.id ? String(existingStudentRow.id) : crypto.randomUUID();
    const createdStudent = !existingStudentRow;

    await supabase.from("students").upsert({
      id: studentId,
      user_id: studentUser.id,
      name: studentName,
      grade,
      school,
      phase,
      target_countries: targetCountries,
      dream_schools: dreamSchools,
      intended_major: intendedMajor,
      completion: existingStudentRow?.completion ?? 0,
      check_in_streak: existingStudentRow?.check_in_streak ?? 0,
      mastery_average: existingStudentRow?.mastery_average ?? 0,
      avatar,
    });

    const { data: existingApplicationProfile } = await supabase
      .from("student_application_profiles")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    const applicationRow = getFirstSheetRow(workbook, "application_profile");
    const competitions = normalizeCompetitionEntries(getSheetRows(workbook, "competitions"));
    const activities = normalizeActivityEntries(getSheetRows(workbook, "activities"));
    const applicationProfile = buildApplicationProfile({
      studentId,
      studentName,
      school,
      existing: existingApplicationProfile as Row | null,
      row: applicationRow,
      competitions,
      activities,
    });

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

    const tasksImported = await importTasks({
      supabase,
      studentId,
      rows: getSheetRows(workbook, "tasks"),
    });
    const milestonesImported = await importMilestones({
      supabase,
      studentId,
      rows: getSheetRows(workbook, "milestones"),
    });
    const notesImported = await importNotes({
      supabase,
      studentId,
      rows: getSheetRows(workbook, "notes"),
      warnings,
    });
    const { parentBindings, consultantBindings } = await importBindings({
      studentId,
      rows: getSheetRows(workbook, "bindings"),
      warnings,
    });
    const { packCount: vocabularyPacksImported, wordCount: vocabularyWordsImported } = await importVocabularySheets({
      supabase,
      studentId,
      packRows: getSheetRows(workbook, "vocabulary_packs"),
      wordRows: getSheetRows(workbook, "vocabulary_words"),
      warnings,
    });
    const homeworkQuestionsImported = await importHomeworkQuestionSheets({
      supabase,
      studentId,
      rows: getSheetRows(workbook, "homework_questions"),
    });
    const readingPassagesImported = await importReadingPassageSheets({
      supabase,
      studentId,
      rows: getSheetRows(workbook, "reading_passages"),
    });

    if (!createdUser && !asString(studentAccountRow.password)) {
      warnings.push("Existing student account reused. Password was not changed by this import.");
    }

    if (createdUser && !asString(studentAccountRow.password)) {
      warnings.push("No password was provided for the new student account. Default password terra123 was used.");
    }

    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: "/admin/dashboard",
      action: "student_workbook_imported",
      targetType: "student_import",
      targetId: studentId,
      status: "success",
      inputSummary: `Workbook ${file.name} for ${studentEmail}`,
      outputSummary: `Imported student ${studentName} with ${tasksImported} tasks, ${milestonesImported} milestones`,
    });

    return NextResponse.json({
      success: true,
      entity_id: studentId,
      trace_id: trace.traceId,
      decision_id: trace.decisionId,
      message: "Student workbook imported.",
      data: {
        studentName,
        createdUser,
        createdStudent,
        tasksImported,
        milestonesImported,
        notesImported,
        parentBindings,
        consultantBindings,
        vocabularyPacksImported,
        vocabularyWordsImported,
        homeworkQuestionsImported,
        readingPassagesImported,
        warnings,
      },
    });
  } catch (error) {
    finishTrace(trace, {
      actorId: session.userId,
      actorRole: session.role,
      page: "/admin/dashboard",
      action: "student_workbook_imported",
      targetType: "student_import",
      targetId: file.name,
      status: "error",
      inputSummary: `Workbook ${file.name}`,
      outputSummary: error instanceof Error ? error.message : "Import failed",
      errorCode: "student_import_failed",
    });

    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: error instanceof Error ? error.message : "Student import failed.",
      },
      { status: 500 }
    );
  }
}

async function importTasks({
  supabase,
  studentId,
  rows,
}: {
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>;
  studentId: string;
  rows: Row[];
}) {
  const validRows = rows.filter((row) => asString(row.title));

  if (!validRows.length) {
    return 0;
  }

  const { data: existingRows } = await supabase.from("tasks").select("*").eq("student_id", studentId);
  const existing = existingRows ?? [];

  const payload = validRows.map((row) => {
    const title = asString(row.title) ?? "Imported task";
    const startDate = asString(row.start_date) ?? todayString();
    const endDate = asString(row.end_date) ?? startDate;
    const matched = existing.find(
      (item) =>
        String(item.title) === title &&
        String(item.start_date) === startDate &&
        String(item.end_date) === endDate
    );
    const lane = normalizeTimelineLane(row.timeline_lane);

    return {
      id: matched?.id ?? crypto.randomUUID(),
      student_id: studentId,
      title,
      description: asString(row.description) ?? "",
      start_date: startDate,
      end_date: endDate,
      timeline_lane: lane,
      due_label: asString(row.due_label) ?? `Imported plan · ${endDate}`,
      due_date: asString(row.due_date) ?? endDate,
      category: asString(row.category) ?? laneCategory(lane),
      priority: normalizePriority(row.priority),
      status: normalizeTaskStatus(row.status),
      owner_role: normalizeOwnerRole(row.owner_role),
    };
  });

  await supabase.from("tasks").upsert(payload);
  return payload.length;
}

async function importMilestones({
  supabase,
  studentId,
  rows,
}: {
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>;
  studentId: string;
  rows: Row[];
}) {
  const validRows = rows.filter((row) => asString(row.title) && asString(row.event_date));

  if (!validRows.length) {
    return 0;
  }

  const { data: existingRows } = await supabase.from("milestones").select("*").eq("student_id", studentId);
  const existing = existingRows ?? [];

  const payload = validRows.map((row) => {
    const title = asString(row.title) ?? "Imported milestone";
    const eventDate = asString(row.event_date) ?? todayString();
    const matched = existing.find(
      (item) => String(item.title) === title && String(item.event_date) === eventDate
    );

    return {
      id: matched?.id ?? crypto.randomUUID(),
      student_id: studentId,
      title,
      event_date: eventDate,
      date_label: formatMilestoneLabel(eventDate),
      status: normalizeMilestoneStatus(row.status),
      type: "deadline",
    };
  });

  await supabase.from("milestones").upsert(payload);
  return payload.length;
}

async function importNotes({
  supabase,
  studentId,
  rows,
  warnings,
}: {
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>;
  studentId: string;
  rows: Row[];
  warnings: string[];
}) {
  const validRows = rows.filter((row) => asString(row.title) && asString(row.summary));

  if (!validRows.length) {
    return 0;
  }

  const { data: existingRows } = await supabase.from("advisor_notes").select("*").eq("student_id", studentId);
  const existing = existingRows ?? [];
  const payload: Record<string, unknown>[] = [];

  for (const row of validRows) {
    const consultantEmail = asString(row.consultant_email);
    if (!consultantEmail) {
      warnings.push(`Skipped note "${asString(row.title) ?? "Untitled"}" because consultant_email was blank.`);
      continue;
    }

    const consultant = await getUserRecordByEmail(consultantEmail);
    if (!consultant || consultant.role !== "consultant") {
      warnings.push(`Skipped note "${asString(row.title) ?? "Untitled"}" because consultant ${consultantEmail} was not found.`);
      continue;
    }

    const title = asString(row.title) ?? "Imported note";
    const summary = asString(row.summary) ?? "";
    const matched = existing.find(
      (item) =>
        String(item.title) === title &&
        String(item.summary) === summary &&
        String(item.consultant_id) === consultant.id
    );

    payload.push({
      id: matched?.id ?? crypto.randomUUID(),
      student_id: studentId,
      consultant_id: consultant.id,
      title,
      summary,
      created_at: asString(row.created_at) ?? new Date().toISOString(),
    });
  }

  if (payload.length > 0) {
    await supabase.from("advisor_notes").upsert(payload);
  }

  return payload.length;
}

async function importBindings({
  studentId,
  rows,
  warnings,
}: {
  studentId: string;
  rows: Row[];
  warnings: string[];
}) {
  let parentBindings = 0;
  let consultantBindings = 0;

  for (const row of rows.filter((item) => asString(item.kind) && asString(item.email))) {
    const kind = normalizeBindingKind(row.kind);
    const email = asString(row.email) ?? "";
    const user = await getUserRecordByEmail(email);

    if (!kind) {
      warnings.push(`Skipped binding for ${email} because kind must be parent or consultant.`);
      continue;
    }

    if (!user) {
      warnings.push(`Skipped ${kind} binding for ${email} because the account does not exist yet.`);
      continue;
    }

    if (user.role !== kind) {
      warnings.push(`Skipped ${email} because it is a ${user.role} account, not ${kind}.`);
      continue;
    }

    if (kind === "parent") {
      await createStudentParentLink(studentId, user.id);
      parentBindings += 1;
    } else {
      await createStudentConsultantLink(studentId, user.id);
      consultantBindings += 1;
    }
  }

  return { parentBindings, consultantBindings };
}

async function importVocabularySheets({
  supabase,
  studentId,
  packRows,
  wordRows,
  warnings,
}: {
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>;
  studentId: string;
  packRows: Row[];
  wordRows: Row[];
  warnings: string[];
}) {
  const validPackRows = packRows.filter((row) => asString(row.pack_name));
  if (!validPackRows.length) {
    return { packCount: 0, wordCount: 0 };
  }

  const { data: existingPacksRows } = await supabase.from("vocabulary_packs").select("*").eq("student_id", studentId);
  const existingPacks = existingPacksRows ?? [];

  const packPayload = validPackRows.map((row) => {
    const packName = asString(row.pack_name) ?? "Imported vocabulary pack";
    const matched = existingPacks.find((item) => String(item.name) === packName);
    return {
      id: matched?.id ?? crypto.randomUUID(),
      student_id: studentId,
      name: packName,
      daily_new_count: asNumber(row.daily_new_count) ?? 10,
      daily_review_count: asNumber(row.daily_review_count) ?? 20,
      total_words: 0,
      active: normalizeBoolean(row.active, true),
      created_at: matched?.created_at ?? new Date().toISOString(),
    };
  });

  await supabase.from("vocabulary_packs").upsert(packPayload);

  const packMap = new Map(packPayload.map((item) => [String(item.name), String(item.id)]));
  const validWordRows = wordRows.filter((row) => asString(row.word) && asString(row.meaning) && asString(row.pack_name));
  const { data: existingWordRows } = await supabase.from("vocabulary_word_items").select("*").eq("student_id", studentId);
  const existingWords = existingWordRows ?? [];

  const wordPayload: Record<string, unknown>[] = [];
  for (const row of validWordRows) {
    const packName = asString(row.pack_name) ?? "";
    const packId = packMap.get(packName);
    if (!packId) {
      warnings.push(`Skipped vocabulary word "${asString(row.word) ?? "Untitled"}" because pack "${packName}" was not found.`);
      continue;
    }
    const word = asString(row.word) ?? "";
    const matched = existingWords.find(
      (item) => String(item.pack_id) === packId && String(item.word) === word
    );
    wordPayload.push({
      id: matched?.id ?? crypto.randomUUID(),
      student_id: studentId,
      pack_id: packId,
      word,
      meaning: asString(row.meaning) ?? "",
      notes: asString(row.notes) ?? "",
      sort_order: asNumber(row.sort_order) ?? wordPayload.length + 1,
      introduced_on: null,
      next_review_on: null,
      review_stage: 0,
      total_attempts: matched?.total_attempts ?? 0,
      correct_attempts: matched?.correct_attempts ?? 0,
      completed: normalizeBoolean(row.completed, Boolean(matched?.completed)),
    });
  }

  if (wordPayload.length > 0) {
    await supabase.from("vocabulary_word_items").upsert(wordPayload);
  }

  const totalsByPack = new Map<string, number>();
  for (const item of wordPayload) {
    const packId = String(item.pack_id);
    totalsByPack.set(packId, (totalsByPack.get(packId) ?? 0) + 1);
  }
  for (const pack of packPayload) {
    await supabase
      .from("vocabulary_packs")
      .update({ total_words: totalsByPack.get(String(pack.id)) ?? 0 })
      .eq("id", pack.id);
  }

  return { packCount: packPayload.length, wordCount: wordPayload.length };
}

async function importHomeworkQuestionSheets({
  supabase,
  studentId,
  rows,
}: {
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>;
  studentId: string;
  rows: Row[];
}) {
  const validRows = rows.filter((row) => asString(row.subject) && asString(row.prompt) && asString(row.correct_answer));
  if (!validRows.length) {
    return 0;
  }

  const { data: existingRows } = await supabase.from("homework_question_items").select("*").eq("student_id", studentId);
  const existing = existingRows ?? [];

  const payload = validRows.map((row, index) => {
    const subject = asString(row.subject) ?? "Imported subject";
    const prompt = asString(row.prompt) ?? "Imported prompt";
    const matched = existing.find(
      (item) => String(item.subject) === subject && String(item.prompt) === prompt
    );

    return {
      id: matched?.id ?? crypto.randomUUID(),
      student_id: studentId,
      subject,
      prompt,
      correct_answer: asString(row.correct_answer) ?? "",
      explanation: asString(row.explanation) ?? "",
      sort_order: asNumber(row.sort_order) ?? index + 1,
      completed: normalizeBoolean(row.completed, Boolean(matched?.completed)),
      created_at: matched?.created_at ?? new Date().toISOString(),
    };
  });

  await supabase.from("homework_question_items").upsert(payload);
  return payload.length;
}

async function importReadingPassageSheets({
  supabase,
  studentId,
  rows,
}: {
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>;
  studentId: string;
  rows: Row[];
}) {
  const validRows = rows.filter((row) => asString(row.title) && asString(row.passage));
  if (!validRows.length) {
    return 0;
  }

  const { data: existingRows } = await supabase.from("reading_passage_items").select("*").eq("student_id", studentId);
  const existing = existingRows ?? [];

  const payload = validRows.map((row, index) => {
    const title = asString(row.title) ?? "Imported passage";
    const matched = existing.find((item) => String(item.title) === title);
    return {
      id: matched?.id ?? crypto.randomUUID(),
      student_id: studentId,
      title,
      passage: asString(row.passage) ?? "",
      source: asString(row.source) ?? "",
      sort_order: asNumber(row.sort_order) ?? index + 1,
      created_at: matched?.created_at ?? new Date().toISOString(),
    };
  });

  await supabase.from("reading_passage_items").upsert(payload);
  return payload.length;
}

function getSheetRows(workbook: XLSX.WorkBook, target: keyof typeof sheetAliases) {
  const aliases = sheetAliases[target] as readonly string[];
  const sheetName = workbook.SheetNames.find((name) =>
    aliases.includes(name.trim().toLowerCase())
  );

  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
}

function getFirstSheetRow(workbook: XLSX.WorkBook, target: keyof typeof sheetAliases) {
  return getSheetRows(workbook, target)[0] ?? null;
}

function buildApplicationProfile(input: {
  studentId: string;
  studentName: string;
  school: string;
  existing: Row | null;
  row: Row | null;
  competitions: StudentCompetitionEntry[];
  activities: StudentActivityEntry[];
}): StudentApplicationProfile {
  const [firstName = "", ...lastNameParts] = input.studentName.split(" ");
  const base = input.existing ?? {};
  const row = input.row ?? {};

  return {
    studentId: input.studentId,
    legalFirstName: asString(row.legal_first_name) ?? asString(base.legal_first_name) ?? firstName,
    legalLastName: asString(row.legal_last_name) ?? asString(base.legal_last_name) ?? lastNameParts.join(" "),
    preferredName: asString(row.preferred_name) ?? asString(base.preferred_name) ?? firstName,
    dateOfBirth: asString(row.date_of_birth) ?? asString(base.date_of_birth) ?? "",
    citizenship: asString(row.citizenship) ?? asString(base.citizenship) ?? "",
    birthCountry: asString(row.birth_country) ?? asString(base.birth_country) ?? "",
    phoneNumber: asString(row.phone_number) ?? asString(base.phone_number) ?? "",
    addressLine1: asString(row.address_line_1) ?? asString(base.address_line_1) ?? "",
    city: asString(row.city) ?? asString(base.city) ?? "",
    stateProvince: asString(row.state_province) ?? asString(base.state_province) ?? "",
    postalCode: asString(row.postal_code) ?? asString(base.postal_code) ?? "",
    countryOfResidence: asString(row.country_of_residence) ?? asString(base.country_of_residence) ?? "",
    highSchoolName: asString(row.high_school_name) ?? asString(base.high_school_name) ?? input.school,
    curriculumSystem: asString(row.curriculum_system) ?? asString(base.curriculum_system) ?? "",
    graduationYear: asString(row.graduation_year) ?? asString(base.graduation_year) ?? "",
    gpa: asString(row.gpa) ?? asString(base.gpa) ?? "",
    classRank: asString(row.class_rank) ?? asString(base.class_rank) ?? "",
    englishProficiencyStatus:
      asString(row.english_proficiency_status) ?? asString(base.english_proficiency_status) ?? "",
    intendedStartTerm: asString(row.intended_start_term) ?? asString(base.intended_start_term) ?? "",
    passportCountry: asString(row.passport_country) ?? asString(base.passport_country) ?? "",
    additionalContext: asString(row.additional_context) ?? asString(base.additional_context) ?? "",
    transcriptSourceMarkdown:
      asString(row.transcript_source_markdown) ?? asString(base.transcript_source_markdown) ?? "",
    transcriptStructuredMarkdown:
      asString(row.transcript_structured_markdown) ?? asString(base.transcript_structured_markdown) ?? "",
    planningBookMarkdown:
      asString(row.planning_book_markdown) ?? asString(base.planning_book_markdown) ?? "",
    competitions: input.competitions,
    activities: input.activities,
  };
}

function normalizeCompetitionEntries(rows: Row[]) {
  const normalized = rows
    .filter((row) => asString(row.name) || asString(row.field) || asString(row.result))
    .map((row) => ({
      name: asString(row.name) ?? "",
      field: asString(row.field) ?? "",
      year: asString(row.year) ?? "",
      level: asString(row.level) ?? "",
      result: asString(row.result) ?? "",
    }));

  while (normalized.length < 10) {
    normalized.push({ name: "", field: "", year: "", level: "", result: "" });
  }

  return normalized.slice(0, 10);
}

function normalizeActivityEntries(rows: Row[]) {
  const normalized = rows
    .filter((row) => asString(row.name) || asString(row.role) || asString(row.impact))
    .map((row) => ({
      name: asString(row.name) ?? "",
      role: asString(row.role) ?? "",
      grades: asString(row.grades) ?? "",
      timeCommitment: asString(row.time_commitment) ?? "",
      impact: asString(row.impact) ?? "",
    }));

  while (normalized.length < 20) {
    normalized.push({ name: "", role: "", grades: "", timeCommitment: "", impact: "" });
  }

  return normalized.slice(0, 20);
}

function normalizeStudentPhase(value: unknown) {
  const normalized = asString(value)?.trim();
  if (normalized === "Planning" || normalized === "Application" || normalized === "Submission" || normalized === "Decision" || normalized === "Visa") {
    return normalized;
  }
  return "Planning";
}

function normalizeTimelineLane(value: unknown): TimelineLane {
  const normalized = asString(value)?.trim();
  if (
    normalized === "standardized_exams" ||
    normalized === "application_progress" ||
    normalized === "activities" ||
    normalized === "competitions"
  ) {
    return normalized;
  }
  return "application_progress";
}

function normalizePriority(value: unknown) {
  const normalized = asString(value)?.trim();
  if (normalized === "Low" || normalized === "Medium" || normalized === "High") {
    return normalized;
  }
  return "Medium";
}

function normalizeTaskStatus(value: unknown) {
  const normalized = asString(value)?.trim();
  if (normalized === "pending" || normalized === "in_progress" || normalized === "done") {
    return normalized;
  }
  return "pending";
}

function normalizeMilestoneStatus(value: unknown) {
  const normalized = asString(value)?.trim();
  if (normalized === "upcoming" || normalized === "done") {
    return normalized;
  }
  return "upcoming";
}

function normalizeOwnerRole(value: unknown): Exclude<UserRole, "admin"> {
  const normalized = asString(value)?.trim();
  if (normalized === "student" || normalized === "parent" || normalized === "consultant") {
    return normalized;
  }
  return "consultant";
}

function normalizeBindingKind(value: unknown) {
  const normalized = asString(value)?.trim();
  if (normalized === "parent" || normalized === "consultant") {
    return normalized;
  }
  return null;
}

function normalizeBoolean(value: unknown, fallback = false) {
  const normalized = asString(value)?.toLowerCase();
  if (!normalized) return fallback;
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return fallback;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const text = asString(value);
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function requiredString(row: Row, key: string) {
  const value = asString(row[key]);
  if (!value) {
    throw new Error(`Missing required field "${key}" in student_account.`);
  }
  return value;
}

function asString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return undefined;
}

function splitCsvCell(value: unknown) {
  const text = asString(value);
  return text ? text.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function laneCategory(lane: TimelineLane) {
  switch (lane) {
    case "standardized_exams":
      return "Exams";
    case "activities":
      return "Activities";
    case "competitions":
      return "Competition";
    default:
      return "Application";
  }
}

function formatMilestoneLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}
