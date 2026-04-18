import { getStore } from "@/lib/store";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import type {
  AdvisorNote,
  AiArtifact,
  AnalyticsSnapshot,
  AuditLog,
  CheckInRecord,
  ContentItem,
  Milestone,
  SessionPayload,
  StudentActivityEntry,
  StudentApplicationProfile,
  StudentCompetitionEntry,
  StudentRecord,
  Task,
  TimelineLane,
  User,
  UserRole,
} from "@/lib/types";

type DbRow = Record<string, unknown>;
type StudentLiveMetrics = Pick<StudentRecord, "completion" | "checkInStreak" | "masteryAverage">;
type SchoolContentDetails = NonNullable<ContentItem["schoolDetails"]>;
type MajorContentDetails = NonNullable<ContentItem["majorDetails"]>;
type CompetitionContentDetails = NonNullable<ContentItem["competitionDetails"]>;
type CourseContentDetails = NonNullable<ContentItem["courseDetails"]>;
type ChapterContentDetails = NonNullable<ContentItem["chapterDetails"]>;
type ContentDetailMaps = {
  school: Map<string, SchoolContentDetails>;
  major: Map<string, MajorContentDetails>;
  competition: Map<string, CompetitionContentDetails>;
  course: Map<string, CourseContentDetails>;
  chapter: Map<string, ChapterContentDetails>;
};

export function getUserByCredentials(email: string, password: string, role: UserRole) {
  const store = getStore();

  return (
    store.users.find(
      (user) => user.email === email && user.password === password && user.role === role
    ) ?? null
  );
}

export function getUserById(userId: string) {
  const store = getStore();
  return store.users.find((user) => user.id === userId) ?? null;
}

export async function getUserByIdData(userId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getUserById(userId);
  }

  const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();

  if (!data) {
    return getUserById(userId);
  }

  return {
    id: String(data.id),
    email: String(data.email),
    password: "",
    name: String(data.name),
    role: data.role as UserRole,
    profileId: "",
    avatar: String(data.avatar ?? ""),
  } satisfies User;
}

export async function getUserRecordByEmail(email: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStore().users.find((user) => user.email === email) ?? null;
  }

  const { data } = await supabase.from("users").select("*").eq("email", email).maybeSingle();

  if (!data) {
    return getStore().users.find((user) => user.email === email) ?? null;
  }

  return {
    id: String(data.id),
    email: String(data.email),
    password: "",
    name: String(data.name),
    role: data.role as UserRole,
    profileId: "",
    avatar: String(data.avatar ?? getStore().users.find((user) => user.email === email)?.avatar ?? ""),
  };
}

export async function getCurrentUserData(session: SessionPayload) {
  const supabase = getSupabaseAdminClient();
  const fallbackUser = getUserById(session.userId);

  if (!supabase) {
    return fallbackUser;
  }

  const { data } = await supabase.from("users").select("*").eq("id", session.userId).maybeSingle();

  if (!data) {
    return fallbackUser;
  }

  return {
    id: String(data.id),
    email: String(data.email),
    password: fallbackUser?.password ?? "",
    name: String(data.name),
    role: data.role as UserRole,
    profileId: fallbackUser?.profileId ?? "",
    avatar: String(data.avatar ?? fallbackUser?.avatar ?? session.avatar ?? ""),
  } satisfies User;
}

export async function getAllUsersData() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStore().users;
  }

  const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });

  if (!data?.length) {
    return getStore().users;
  }

  return data.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    password: "",
    name: String(row.name),
    role: row.role as UserRole,
    profileId: "",
    avatar: String(row.avatar ?? ""),
  })) satisfies User[];
}

export async function getCurrentStudentData(session: SessionPayload) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getCurrentStudentFallback(session);
  }

  if (session.role === "student") {
    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", session.userId)
      .maybeSingle();

    if (data) {
      return mapStudent(data);
    }
  }

  const { data } = await supabase.from("students").select("*").limit(1).maybeSingle();
  return data ? mapStudent(data) : getCurrentStudentFallback(session);
}

export async function getStudentByIdData(studentId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStudentByIdFallback(studentId);
  }

  const { data } = await supabase.from("students").select("*").eq("id", studentId).maybeSingle();
  return data ? mapStudent(data) : getStudentByIdFallback(studentId);
}

export async function getStudentApplicationProfileData(studentId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStudentApplicationProfileFallback(studentId);
  }

  const { data } = await supabase
    .from("student_application_profiles")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (data) {
    return mapStudentApplicationProfile(data);
  }

  const student = await getStudentByIdData(studentId);
  return createDefaultStudentApplicationProfile(studentId, student);
}

export async function getStudentTasksData(studentId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStudentTasksFallback(studentId);
  }

  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return data?.length ? data.map(mapTask) : getStudentTasksFallback(studentId);
}

export async function getStudentMilestonesData(studentId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStudentMilestonesFallback(studentId);
  }

  const { data } = await supabase
    .from("milestones")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return data?.length ? data.map(mapMilestone) : getStudentMilestonesFallback(studentId);
}

export function createMilestone(input: Omit<Milestone, "id" | "dateLabel" | "type">) {
  const milestone: Milestone = {
    id: crypto.randomUUID(),
    ...input,
    type: "deadline",
    dateLabel: formatMilestoneLabel(input.eventDate),
  };

  getStore().milestones.unshift(milestone);
  void persistMilestone(milestone);
  return milestone;
}

export async function updateMilestone(
  milestoneId: string,
  input: Partial<Pick<Milestone, "title" | "eventDate" | "status">>
) {
  const store = getStore();
  const localMilestone = store.milestones.find((item) => item.id === milestoneId);

  if (localMilestone) {
    Object.assign(localMilestone, input);
    localMilestone.type = "deadline";
    if (input.eventDate) {
      localMilestone.dateLabel = formatMilestoneLabel(input.eventDate);
    }
    await persistMilestone(localMilestone);
    return localMilestone;
  }

  const persistedMilestone = await getPersistedMilestoneById(milestoneId);

  if (!persistedMilestone) {
    return null;
  }

  const updatedMilestone: Milestone = {
    ...persistedMilestone,
    ...input,
    type: "deadline",
    dateLabel: formatMilestoneLabel(input.eventDate ?? persistedMilestone.eventDate),
  };

  upsertMilestoneInStore(updatedMilestone);
  await persistMilestone(updatedMilestone);
  return updatedMilestone;
}

export async function deleteMilestone(milestoneId: string) {
  const store = getStore();
  const index = store.milestones.findIndex((item) => item.id === milestoneId);

  if (index !== -1) {
    const [milestone] = store.milestones.splice(index, 1);
    await removeMilestone(milestone.id);
    return milestone;
  }

  const persistedMilestone = await getPersistedMilestoneById(milestoneId);

  if (!persistedMilestone) {
    return null;
  }

  await removeMilestone(milestoneId);
  return persistedMilestone;
}

export async function getStudentCheckInsData(studentId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStudentCheckInsFallback(studentId);
  }

  const { data } = await supabase
    .from("checkin_records")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false });

  return data?.length ? data.map(mapCheckIn) : getStudentCheckInsFallback(studentId);
}

export async function getStudentNotesData(studentId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStudentNotesFallback(studentId);
  }

  const { data } = await supabase
    .from("advisor_notes")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return data?.length ? data.map(mapAdvisorNote) : getStudentNotesFallback(studentId);
}

export async function getAllStudentsData() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getAllStudentsFallback();
  }

  const { data } = await supabase.from("students").select("*").order("created_at", { ascending: false });
  return data?.length ? data.map(mapStudent) : getAllStudentsFallback();
}

export async function getContentItemsData() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getContentItemsFallback();
  }

  const { data } = await supabase.from("content_items").select("*").order("created_at", { ascending: false });
  if (!data?.length) {
    return getContentItemsFallback();
  }

  const detailMaps = await loadContentDetailMaps();
  return data.map((row) => mapContentItem(row, detailMaps));
}

export async function getAnalyticsData() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getAnalyticsFallback();
  }

  const { data } = await supabase
    .from("analytics_snapshots")
    .select("*")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapAnalytics(data) : getAnalyticsFallback();
}

export async function getConsultantLiveAnalyticsData() {
  const [students, tasks, milestones] = await Promise.all([
    getAllStudentsData(),
    getAllTasksData(),
    getAllMilestonesData(),
  ]);

  const studentsWithMetrics = await Promise.all(
    students.map(async (student) => {
      const metrics = await getStudentLiveMetricsData(student.id);
      const studentTasks = tasks.filter((task) => task.studentId === student.id);
      const studentMilestones = milestones.filter((milestone) => milestone.studentId === student.id);

      return {
        ...student,
        ...metrics,
        ...getConsultantRiskSignals(metrics, studentTasks, studentMilestones),
      };
    })
  );

  const atRiskCount = studentsWithMetrics.filter((student) => student.riskLevel === "high").length;

  return {
    id: "live-consultant-analytics",
    date: new Date().toISOString().slice(0, 10),
    activeStudents: students.length,
    taskCompletionRate: calculateTaskCompletion(tasks) / 100,
    milestoneHitRate: calculateMilestoneHitRate(milestones),
    atRiskCount,
  } satisfies AnalyticsSnapshot;
}

export async function getRecentAuditLogsData(limit = 8) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getRecentAuditLogsFallback(limit);
  }

  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return data?.length ? data.map(mapAuditLog) : getRecentAuditLogsFallback(limit);
}

export async function getAiArtifactsData(limit = 8) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getAiArtifactsFallback(limit);
  }

  const { data } = await supabase
    .from("ai_artifacts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return data?.length ? data.map(mapAiArtifact) : getAiArtifactsFallback(limit);
}

export function getUsersByRole(role: UserRole) {
  return getStore().users.filter((user) => user.role === role);
}

export async function updateTaskStatus(taskId: string, status: Task["status"]) {
  const store = getStore();
  const localTask = store.tasks.find((item) => item.id === taskId);

  if (localTask) {
    localTask.status = status;
    await persistTask(localTask);
    return localTask;
  }

  const persistedTask = await getPersistedTaskById(taskId);

  if (!persistedTask) {
    return null;
  }

  const updatedTask = {
    ...persistedTask,
    status,
  };

  upsertTaskInStore(updatedTask);
  await persistTask(updatedTask);
  return updatedTask;
}

export async function deleteTask(taskId: string) {
  const store = getStore();
  const index = store.tasks.findIndex((item) => item.id === taskId);

  if (index !== -1) {
    const [task] = store.tasks.splice(index, 1);
    await removeTask(task.id);
    return task;
  }

  const persistedTask = await getPersistedTaskById(taskId);

  if (!persistedTask) {
    return null;
  }

  await removeTask(taskId);
  return persistedTask;
}

export function createTask(input: Omit<Task, "id">) {
  const task: Task = {
    id: crypto.randomUUID(),
    ...input,
  };

  getStore().tasks.unshift(task);
  void persistTask(task);
  return task;
}

export function createCheckIn(input: Omit<CheckInRecord, "id">) {
  const record: CheckInRecord = {
    id: crypto.randomUUID(),
    ...input,
  };

  getStore().checkIns.unshift(record);
  void persistCheckIn(record);
  return record;
}

export async function updateCheckIn(
  checkInId: string,
  input: Partial<Pick<CheckInRecord, "curriculum" | "chapter" | "mastery" | "notes" | "date">>
) {
  const store = getStore();
  const localRecord = store.checkIns.find((item) => item.id === checkInId);

  if (localRecord) {
    Object.assign(localRecord, input);
    await persistCheckIn(localRecord);
    return localRecord;
  }

  const persistedRecord = await getPersistedCheckInById(checkInId);

  if (!persistedRecord) {
    return null;
  }

  const updatedRecord = {
    ...persistedRecord,
    ...input,
  };

  upsertCheckInInStore(updatedRecord);
  await persistCheckIn(updatedRecord);
  return updatedRecord;
}

export async function deleteCheckIn(checkInId: string) {
  const store = getStore();
  const index = store.checkIns.findIndex((item) => item.id === checkInId);

  if (index !== -1) {
    const [record] = store.checkIns.splice(index, 1);
    await removeCheckIn(record.id);
    return record;
  }

  const persistedRecord = await getPersistedCheckInById(checkInId);

  if (!persistedRecord) {
    return null;
  }

  await removeCheckIn(checkInId);
  return persistedRecord;
}

export async function updateStudentProfile(
  studentId: string,
  input: Partial<
    Pick<
      StudentRecord,
      "name" | "grade" | "school" | "targetCountries" | "dreamSchools" | "intendedMajor" | "phase" | "avatar"
    >
  >
) {
  const store = getStore();
  const localStudent = store.students.find((item) => item.id === studentId);
  const baseStudent = localStudent ?? (await getStudentByIdData(studentId));

  if (!baseStudent) {
    return null;
  }

  const student: StudentRecord = {
    ...baseStudent,
    ...input,
  };

  upsertStudentInStore(student);

  const localUser = store.users.find((user) => user.id === student.userId);
  const matchingUser = localUser ?? (student.userId ? await getUserByIdData(student.userId) : null);

  if (matchingUser && (input.name || input.avatar)) {
    const nextUser: User = {
      ...matchingUser,
      name: input.name ?? matchingUser.name,
      avatar: input.avatar ?? matchingUser.avatar,
    };

    upsertUserInStore(nextUser);
    void persistAppUser(nextUser.id, nextUser.name, nextUser.email, nextUser.role, nextUser.avatar);
  }

  void persistStudent(student);
  return student;
}

export function updateUserProfile(
  userId: string,
  input: Partial<Pick<User, "name" | "avatar">>
) {
  const user = getStore().users.find((item) => item.id === userId);

  if (!user) {
    return null;
  }

  Object.assign(user, input);
  void persistAppUser(user.id, user.name, user.email, user.role, user.avatar);
  return user;
}

export function updateUserPassword(userId: string, password: string) {
  const user = getStore().users.find((item) => item.id === userId);

  if (!user) {
    return null;
  }

  user.password = password;
  return user;
}

export async function updateStudentApplicationProfile(
  studentId: string,
  input: Omit<StudentApplicationProfile, "studentId">
) {
  const store = getStore();
  store.applicationProfiles ??= [];
  const localProfile = store.applicationProfiles.find((item) => item.studentId === studentId);
  const existingProfile = localProfile ?? (await getStudentApplicationProfileData(studentId));

  if (existingProfile) {
    const profile: StudentApplicationProfile = {
      ...existingProfile,
      ...input,
      studentId,
    };
    upsertApplicationProfileInStore(profile);
    await persistStudentApplicationProfile(profile);
    return profile;
  }

  const profile: StudentApplicationProfile = {
    studentId,
    ...input,
  };
  upsertApplicationProfileInStore(profile);
  await persistStudentApplicationProfile(profile);
  return profile;
}

export function createContentItem(input: Omit<ContentItem, "id">) {
  const item: ContentItem = {
    id: crypto.randomUUID(),
    ...input,
  };

  getStore().contentItems.unshift(item);
  void persistContentItem(item);
  return item;
}

export function createImportedContentItems(items: Omit<ContentItem, "id" | "source">[]) {
  return items.map((item) =>
    createContentItem({
      ...item,
      source: "import",
    })
  );
}

export async function updateContentItem(
  itemId: string,
  input: Omit<ContentItem, "id" | "source"> & Partial<Pick<ContentItem, "source" | "status">>
) {
  const store = getStore();
  const localItem = store.contentItems.find((item) => item.id === itemId);

  if (localItem) {
    const updatedItem = normalizeContentItemDetails({
      ...localItem,
      ...input,
      id: itemId,
      source: input.source ?? localItem.source,
      status: input.status ?? localItem.status,
    });

    Object.assign(localItem, updatedItem);
    await persistContentItem(localItem);
    return localItem;
  }

  const persistedItem = await getPersistedContentItemById(itemId);

  if (!persistedItem) {
    return null;
  }

  const updatedItem = normalizeContentItemDetails({
    ...persistedItem,
    ...input,
    id: itemId,
    source: input.source ?? persistedItem.source,
    status: input.status ?? persistedItem.status,
  });

  store.contentItems.unshift(updatedItem);
  await persistContentItem(updatedItem);
  return updatedItem;
}

export async function deleteContentItems(itemIds: string[]) {
  const uniqueIds = Array.from(new Set(itemIds));
  const store = getStore();
  const deletedItems = store.contentItems.filter((item) => uniqueIds.includes(item.id));

  if (deletedItems.length > 0) {
    store.contentItems = store.contentItems.filter((item) => !uniqueIds.includes(item.id));
  }

  await removeContentItems(uniqueIds);
  return deletedItems;
}

export function createAdvisorNote(input: Omit<AdvisorNote, "id">) {
  const note: AdvisorNote = {
    id: crypto.randomUUID(),
    ...input,
  };

  getStore().advisorNotes.unshift(note);
  void persistAdvisorNote(note);
  return note;
}

export async function getAdvisorNoteByIdData(noteId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStore().advisorNotes.find((note) => note.id === noteId) ?? null;
  }

  const { data } = await supabase.from("advisor_notes").select("*").eq("id", noteId).maybeSingle();
  return data ? mapAdvisorNote(data) : getStore().advisorNotes.find((note) => note.id === noteId) ?? null;
}

export async function updateAdvisorNote(
  noteId: string,
  input: Partial<Pick<AdvisorNote, "title" | "summary">>
) {
  const store = getStore();
  const localNote = store.advisorNotes.find((item) => item.id === noteId);

  if (localNote) {
    Object.assign(localNote, input);
    await persistAdvisorNote(localNote);
    return localNote;
  }

  const persistedNote = await getAdvisorNoteByIdData(noteId);

  if (!persistedNote) {
    return null;
  }

  const updatedNote = {
    ...persistedNote,
    ...input,
  };

  const existingIndex = store.advisorNotes.findIndex((item) => item.id === noteId);
  if (existingIndex === -1) {
    store.advisorNotes.unshift(updatedNote);
  } else {
    store.advisorNotes[existingIndex] = updatedNote;
  }

  await persistAdvisorNote(updatedNote);
  return updatedNote;
}

export async function deleteAdvisorNote(noteId: string) {
  const store = getStore();
  const index = store.advisorNotes.findIndex((item) => item.id === noteId);

  if (index !== -1) {
    const [note] = store.advisorNotes.splice(index, 1);
    await removeAdvisorNote(note.id);
    return note;
  }

  const persistedNote = await getAdvisorNoteByIdData(noteId);

  if (!persistedNote) {
    return null;
  }

  await removeAdvisorNote(noteId);
  return persistedNote;
}

export function getDemoAccounts() {
  return getStore().users.map((user) => ({
    role: user.role,
    email: user.email,
    password: user.password,
  }));
}

export function getAccessPlanDemoAccounts() {
  return getDemoAccounts().filter(
    (
      account
    ): account is {
      role: "student" | "parent" | "consultant";
      email: string;
      password: string;
    } =>
      account.role === "student" ||
      account.role === "parent" ||
      account.role === "consultant"
  );
}

export async function getStudentCompletionData(studentId: string) {
  const tasks = await getStudentTasksData(studentId);
  return calculateTaskCompletion(tasks);
}

export async function getStudentLiveMetricsData(studentId: string): Promise<StudentLiveMetrics> {
  const [tasks, checkIns] = await Promise.all([
    getStudentTasksData(studentId),
    getStudentCheckInsData(studentId),
  ]);

  return {
    completion: calculateTaskCompletion(tasks),
    checkInStreak: calculateCheckInStreak(checkIns),
    masteryAverage: calculateMasteryAverage(checkIns),
  };
}

export async function getLinkedStudentIdsForParent(parentUserId: string) {
  const links = await getStudentParentLinksData();
  return Array.from(new Set(links.filter((link) => link.parentUserId === parentUserId).map((link) => link.studentId)));
}

export async function getLinkedStudentIdsForConsultant(consultantUserId: string) {
  const links = await getStudentConsultantLinksData();
  return Array.from(
    new Set(links.filter((link) => link.consultantUserId === consultantUserId).map((link) => link.studentId))
  );
}

export async function getStudentParentLinksData() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStore().studentParentLinks;
  }

  const { data } = await supabase.from("student_parent_links").select("*").order("created_at", { ascending: false });
  if (!data?.length) {
    return getStore().studentParentLinks;
  }

  return data.map((row) => ({
    id: String(row.id),
    studentId: String(row.student_id),
    parentUserId: String(row.parent_user_id),
  }));
}

export async function getStudentConsultantLinksData() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStore().studentConsultantLinks;
  }

  const { data } = await supabase
    .from("student_consultant_links")
    .select("*")
    .order("created_at", { ascending: false });
  if (!data?.length) {
    return getStore().studentConsultantLinks;
  }

  return data.map((row) => ({
    id: String(row.id),
    studentId: String(row.student_id),
    consultantUserId: String(row.consultant_user_id),
  }));
}

export async function createStudentParentLink(studentId: string, parentUserId: string) {
  const existing = (await getStudentParentLinksData()).find(
    (link) => link.studentId === studentId && link.parentUserId === parentUserId
  );

  if (existing) {
    return existing;
  }

  const link = {
    id: crypto.randomUUID(),
    studentId,
    parentUserId,
  };

  getStore().studentParentLinks.unshift(link);
  void persistStudentParentLink(link);
  return link;
}

export async function createStudentConsultantLink(studentId: string, consultantUserId: string) {
  const existing = (await getStudentConsultantLinksData()).find(
    (link) => link.studentId === studentId && link.consultantUserId === consultantUserId
  );

  if (existing) {
    return existing;
  }

  const link = {
    id: crypto.randomUUID(),
    studentId,
    consultantUserId,
  };

  getStore().studentConsultantLinks.unshift(link);
  void persistStudentConsultantLink(link);
  return link;
}

export async function deleteStudentParentLink(linkId: string) {
  const store = getStore();
  const index = store.studentParentLinks.findIndex((link) => link.id === linkId);

  if (index !== -1) {
    const [link] = store.studentParentLinks.splice(index, 1);
    await removeStudentParentLink(link.id);
    return link;
  }

  const persistedLink = await getPersistedStudentParentLinkById(linkId);
  if (!persistedLink) {
    return null;
  }

  await removeStudentParentLink(linkId);
  return persistedLink;
}

export async function deleteStudentConsultantLink(linkId: string) {
  const store = getStore();
  const index = store.studentConsultantLinks.findIndex((link) => link.id === linkId);

  if (index !== -1) {
    const [link] = store.studentConsultantLinks.splice(index, 1);
    await removeStudentConsultantLink(link.id);
    return link;
  }

  const persistedLink = await getPersistedStudentConsultantLinkById(linkId);
  if (!persistedLink) {
    return null;
  }

  await removeStudentConsultantLink(linkId);
  return persistedLink;
}

export async function getParentOverviewData(session?: SessionPayload, selectedStudentId?: string) {
  const parentUserId = session?.userId;
  const linkedStudentIds = parentUserId ? await getLinkedStudentIdsForParent(parentUserId) : [];
  const students = await getAllStudentsData();
  const linkedStudents =
    linkedStudentIds.length > 0 ? students.filter((student) => linkedStudentIds.includes(student.id)) : [];
  const baseStudent =
    linkedStudents.length > 0
      ? linkedStudents.find((student) => student.id === selectedStudentId) ?? linkedStudents[0] ?? null
      : session?.role === "parent"
        ? null
        : (students[0] ?? null);

  if (!baseStudent) {
    return {
      student: null,
      linkedStudents,
      tasks: [],
      milestones: [],
      notes: [],
    };
  }

  const metrics = await getStudentLiveMetricsData(baseStudent.id);
  const student = {
    ...baseStudent,
    ...metrics,
  };
  return {
    student,
    linkedStudents,
    tasks: await getStudentTasksData(student.id),
    milestones: await getStudentMilestonesData(student.id),
    notes: await getStudentNotesData(student.id),
  };
}

export async function getConsultantOverviewData(session?: SessionPayload) {
  const [students, content, analytics, milestones] = await Promise.all([
    getAllStudentsData(),
    getContentItemsData(),
    getConsultantLiveAnalyticsData(),
    getAllMilestonesData(),
  ]);

  const tasks = await getAllTasksData();
  const linkedStudentIds =
    session?.role === "consultant" ? await getLinkedStudentIdsForConsultant(session.userId) : [];
  const scopedStudents =
    session?.role === "consultant" && linkedStudentIds.length > 0
      ? students.filter((student) => linkedStudentIds.includes(student.id))
      : session?.role === "consultant"
        ? []
        : students;
  const scopedTasks = tasks.filter((task) => scopedStudents.some((student) => student.id === task.studentId));
  const scopedMilestones = milestones.filter((milestone) =>
    scopedStudents.some((student) => student.id === milestone.studentId)
  );
  const studentsWithMetrics = await Promise.all(
    scopedStudents.map(async (student) => {
      const metrics = await getStudentLiveMetricsData(student.id);
      const studentTasks = scopedTasks.filter((task) => task.studentId === student.id);
      const studentMilestones = scopedMilestones.filter((milestone) => milestone.studentId === student.id);

      return {
        ...student,
        ...metrics,
        ...getConsultantRiskSignals(metrics, studentTasks, studentMilestones),
      };
    })
  );

  return {
    students: studentsWithMetrics,
    tasks: scopedTasks,
    milestones: scopedMilestones,
    notes: getStore().advisorNotes.filter((note) =>
      scopedStudents.some((student) => student.id === note.studentId)
    ),
    analytics:
      session?.role === "consultant"
        ? {
            id: "scoped-consultant-analytics",
            date: new Date().toISOString().slice(0, 10),
            activeStudents: studentsWithMetrics.length,
            taskCompletionRate: calculateTaskCompletion(scopedTasks) / 100,
            milestoneHitRate: calculateMilestoneHitRate(scopedMilestones),
            atRiskCount: studentsWithMetrics.filter((student) => student.riskLevel === "high").length,
          }
        : analytics,
    content,
  };
}

export async function getAdminOverviewData() {
  const [users, students, parentLinks, consultantLinks] = await Promise.all([
    getAllUsersData(),
    getAllStudentsData(),
    getStudentParentLinksData(),
    getStudentConsultantLinksData(),
  ]);

  return {
    users,
    students,
    parentLinks,
    consultantLinks,
  };
}

export async function getAdminMemberExportData(userId: string) {
  const user = await getUserByIdData(userId);

  if (!user || user.role === "admin") {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return buildAdminMemberExportFallback(userId);
  }

  const student =
    user.role === "student"
      ? await getCurrentStudentData({
          userId,
          role: "student",
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        })
      : null;

  const [applicationProfile, tasks, milestones, checkIns, notes, parentLinks, consultantLinks, aiArtifacts, auditLogs] =
    await Promise.all([
      student ? getStudentApplicationProfileData(student.id) : Promise.resolve(null),
      student ? getStudentTasksData(student.id) : Promise.resolve([]),
      student ? getStudentMilestonesData(student.id) : Promise.resolve([]),
      student ? getStudentCheckInsData(student.id) : Promise.resolve([]),
      user.role === "consultant"
        ? supabase.from("advisor_notes").select("*").eq("consultant_id", userId)
        : student
          ? supabase.from("advisor_notes").select("*").eq("student_id", student.id)
          : Promise.resolve({ data: [] }),
      supabase.from("student_parent_links").select("*").eq("parent_user_id", userId),
      supabase.from("student_consultant_links").select("*").eq("consultant_user_id", userId),
      student
        ? supabase.from("ai_artifacts").select("*").eq("student_id", student.id)
        : supabase.from("ai_artifacts").select("*").eq("role", user.role),
      supabase.from("audit_logs").select("*").eq("actor_id", userId),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    user,
    student,
    applicationProfile,
    tasks,
    milestones,
    checkIns,
    notes: "data" in notes ? notes.data ?? [] : [],
    parentLinks: parentLinks.data ?? [],
    consultantLinks: consultantLinks.data ?? [],
    aiArtifacts: aiArtifacts.data ?? [],
    auditLogs: auditLogs.data ?? [],
  };
}

export async function deleteMemberAccount(userId: string) {
  const user = await getUserByIdData(userId);

  if (!user || user.role === "admin") {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return deleteMemberAccountFallback(userId, user.role);
  }

  if (user.role === "student") {
    const { data: studentRows } = await supabase.from("students").select("id").eq("user_id", userId);
    const studentIds = (studentRows ?? []).map((row) => String(row.id));

    if (studentIds.length > 0) {
      await supabase.from("student_application_profiles").delete().in("student_id", studentIds);
      await supabase.from("student_parent_links").delete().in("student_id", studentIds);
      await supabase.from("student_consultant_links").delete().in("student_id", studentIds);
      await supabase.from("students").delete().in("id", studentIds);
    }
  }

  if (user.role === "parent") {
    await supabase.from("student_parent_links").delete().eq("parent_user_id", userId);
  }

  if (user.role === "consultant") {
    await supabase.from("student_consultant_links").delete().eq("consultant_user_id", userId);
  }

  await supabase.from("profiles").delete().eq("user_id", userId);
  await supabase.from("users").delete().eq("id", userId);
  await supabase.auth.admin.deleteUser(userId);

  return user;
}

export function getProfiles() {
  return getStore().profiles;
}

export function getUsers() {
  return getStore().users;
}

export async function getStoreSnapshotData() {
  const [students, contentItems, analytics, auditLogs, aiArtifacts] = await Promise.all([
    getAllStudentsData(),
    getContentItemsData(),
    getAnalyticsData(),
    getRecentAuditLogsData(50),
    getAiArtifactsData(50),
  ]);

  return {
    users: getStore().users,
    students,
    tasks: await getAllTasksData(),
    contentItems,
    analyticsSnapshots: analytics ? [analytics] : [],
    auditLogs,
    aiArtifacts,
  };
}

function getCurrentStudentFallback(session: SessionPayload) {
  const store = getStore();

  if (session.role === "student") {
    return store.students.find((student) => student.userId === session.userId) ?? null;
  }

  return store.students[0] ?? null;
}

function getStudentByIdFallback(studentId: string) {
  return getStore().students.find((student) => student.id === studentId) ?? null;
}

function getStudentTasksFallback(studentId: string) {
  return getStore().tasks.filter((task) => task.studentId === studentId);
}

function getStudentMilestonesFallback(studentId: string) {
  return getStore().milestones.filter((milestone) => milestone.studentId === studentId);
}

function getStudentCheckInsFallback(studentId: string) {
  return getStore()
    .checkIns.filter((record) => record.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function getStudentApplicationProfileFallback(studentId: string) {
  const existing =
    (getStore().applicationProfiles ?? []).find((profile) => profile.studentId === studentId) ?? null;

  if (existing) {
    return {
      ...existing,
      competitions: normalizeCompetitionEntries(existing.competitions),
      activities: normalizeActivityEntries(existing.activities),
    };
  }

  const student = getStudentByIdFallback(studentId);
  return createDefaultStudentApplicationProfile(studentId, student);
}

function getStudentNotesFallback(studentId: string) {
  return getStore()
    .advisorNotes.filter((note) => note.studentId === studentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function getAllStudentsFallback() {
  return getStore().students;
}

function buildAdminMemberExportFallback(userId: string) {
  const store = getStore();
  const user = store.users.find((item) => item.id === userId) ?? null;

  if (!user || user.role === "admin") {
    return null;
  }

  const student = store.students.find((item) => item.userId === userId) ?? null;

  return {
    exportedAt: new Date().toISOString(),
    user,
    student,
    applicationProfile: student
      ? (store.applicationProfiles ?? []).find((item) => item.studentId === student.id) ?? null
      : null,
    tasks: student ? store.tasks.filter((item) => item.studentId === student.id) : [],
    milestones: student ? store.milestones.filter((item) => item.studentId === student.id) : [],
    checkIns: student ? store.checkIns.filter((item) => item.studentId === student.id) : [],
    notes:
      user.role === "consultant"
        ? store.advisorNotes.filter((item) => item.consultantId === userId)
        : student
          ? store.advisorNotes.filter((item) => item.studentId === student.id)
          : [],
    parentLinks: store.studentParentLinks.filter((item) => item.parentUserId === userId || item.studentId === student?.id),
    consultantLinks: store.studentConsultantLinks.filter(
      (item) => item.consultantUserId === userId || item.studentId === student?.id
    ),
    aiArtifacts: student ? store.aiArtifacts.filter((item) => item.studentId === student.id) : [],
    auditLogs: store.auditLogs.filter((item) => item.actorId === userId),
  };
}

function deleteMemberAccountFallback(userId: string, role: UserRole) {
  const store = getStore();
  const user = store.users.find((item) => item.id === userId) ?? null;

  if (!user || role === "admin") {
    return null;
  }

  store.users = store.users.filter((item) => item.id !== userId);
  store.profiles = store.profiles.filter((profile) => profile.id !== user.profileId);
  store.auditLogs = store.auditLogs.filter((log) => log.actorId !== userId);

  if (role === "student") {
    const studentIds = store.students.filter((student) => student.userId === userId).map((student) => student.id);
    store.students = store.students.filter((student) => student.userId !== userId);
    store.applicationProfiles = (store.applicationProfiles ?? []).filter(
      (profile) => !studentIds.includes(profile.studentId)
    );
    store.tasks = store.tasks.filter((task) => !studentIds.includes(task.studentId));
    store.milestones = store.milestones.filter((milestone) => !studentIds.includes(milestone.studentId));
    store.checkIns = store.checkIns.filter((checkIn) => !studentIds.includes(checkIn.studentId));
    store.advisorNotes = store.advisorNotes.filter((note) => !studentIds.includes(note.studentId));
    store.studentParentLinks = store.studentParentLinks.filter((link) => !studentIds.includes(link.studentId));
    store.studentConsultantLinks = store.studentConsultantLinks.filter(
      (link) => !studentIds.includes(link.studentId)
    );
    store.aiArtifacts = store.aiArtifacts.filter((artifact) => !studentIds.includes(artifact.studentId ?? ""));
  }

  if (role === "parent") {
    store.studentParentLinks = store.studentParentLinks.filter((link) => link.parentUserId !== userId);
  }

  if (role === "consultant") {
    store.studentConsultantLinks = store.studentConsultantLinks.filter(
      (link) => link.consultantUserId !== userId
    );
    store.advisorNotes = store.advisorNotes.filter((note) => note.consultantId !== userId);
  }

  return user;
}

function getContentItemsFallback() {
  return getStore().contentItems;
}

function getAnalyticsFallback() {
  return getStore().analyticsSnapshots.at(-1) as AnalyticsSnapshot;
}

function getRecentAuditLogsFallback(limit = 8) {
  return getStore().auditLogs.slice(0, limit);
}

function getAiArtifactsFallback(limit = 8) {
  return getStore().aiArtifacts.slice(0, limit);
}

async function getAllTasksData() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStore().tasks;
  }

  const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
  return data?.length ? data.map(mapTask) : getStore().tasks;
}

async function getAllMilestonesData() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return getStore().milestones;
  }

  const { data } = await supabase
    .from("milestones")
    .select("*")
    .order("event_date", { ascending: true });

  return data?.length ? data.map(mapMilestone) : getStore().milestones;
}

async function persistTask(task: Task) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const fullPayload = {
    id: task.id,
    student_id: task.studentId,
    title: task.title,
    description: task.description,
    start_date: task.startDate,
    end_date: task.endDate,
    timeline_lane: task.timelineLane,
    due_label: task.dueLabel,
    due_date: task.dueDate,
    category: task.category,
    priority: task.priority,
    status: task.status,
    owner_role: task.ownerRole,
  };

  const { error } = await supabase.from("tasks").upsert(fullPayload);

  if (error) {
    await supabase.from("tasks").upsert({
      id: task.id,
      student_id: task.studentId,
      title: task.title,
      description: task.description,
      due_label: task.dueLabel,
      due_date: task.dueDate,
      category: task.category,
      priority: task.priority,
      status: task.status,
      owner_role: task.ownerRole,
    });
  }
}

async function removeTask(taskId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("tasks").delete().eq("id", taskId);
}

async function getPersistedTaskById(taskId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("tasks").select("*").eq("id", taskId).maybeSingle();
  return data ? mapTask(data) : null;
}

async function persistCheckIn(record: CheckInRecord) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("checkin_records").upsert({
    id: record.id,
    student_id: record.studentId,
    curriculum: record.curriculum,
    chapter: record.chapter,
    mastery: record.mastery,
    date: record.date,
    notes: record.notes,
  });
}

async function removeCheckIn(checkInId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("checkin_records").delete().eq("id", checkInId);
}

async function getPersistedCheckInById(checkInId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("checkin_records").select("*").eq("id", checkInId).maybeSingle();
  return data ? mapCheckIn(data) : null;
}

async function persistMilestone(milestone: Milestone) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const fullPayload = {
    id: milestone.id,
    student_id: milestone.studentId,
    title: milestone.title,
    event_date: milestone.eventDate,
    date_label: milestone.dateLabel,
    status: milestone.status,
    type: milestone.type,
  };

  const { error } = await supabase.from("milestones").upsert(fullPayload);

  if (error) {
    await supabase.from("milestones").upsert({
      id: milestone.id,
      student_id: milestone.studentId,
      title: milestone.title,
      date_label: milestone.dateLabel,
      status: milestone.status,
      type: milestone.type,
    });
  }
}

async function removeMilestone(milestoneId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("milestones").delete().eq("id", milestoneId);
}

async function getPersistedMilestoneById(milestoneId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("milestones").select("*").eq("id", milestoneId).maybeSingle();
  return data ? mapMilestone(data) : null;
}

async function getPersistedStudentParentLinkById(linkId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("student_parent_links").select("*").eq("id", linkId).maybeSingle();
  return data
    ? {
        id: String(data.id),
        studentId: String(data.student_id),
        parentUserId: String(data.parent_user_id),
      }
    : null;
}

async function getPersistedStudentConsultantLinkById(linkId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("student_consultant_links").select("*").eq("id", linkId).maybeSingle();
  return data
    ? {
        id: String(data.id),
        studentId: String(data.student_id),
        consultantUserId: String(data.consultant_user_id),
      }
    : null;
}

async function removeStudentParentLink(linkId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("student_parent_links").delete().eq("id", linkId);
}

async function removeStudentConsultantLink(linkId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("student_consultant_links").delete().eq("id", linkId);
}

async function persistStudent(student: StudentRecord) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("students").upsert({
    id: student.id,
    user_id: student.userId,
    name: student.name,
    grade: student.grade,
    school: student.school,
    phase: student.phase,
    target_countries: student.targetCountries,
    dream_schools: student.dreamSchools,
    intended_major: student.intendedMajor,
    completion: student.completion,
    check_in_streak: student.checkInStreak,
    mastery_average: student.masteryAverage,
    avatar: student.avatar,
  });
}

async function persistStudentApplicationProfile(profile: StudentApplicationProfile) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const { error } = await supabase.from("student_application_profiles").upsert({
    student_id: profile.studentId,
    legal_first_name: profile.legalFirstName,
    legal_last_name: profile.legalLastName,
    preferred_name: profile.preferredName,
    date_of_birth: profile.dateOfBirth,
    citizenship: profile.citizenship,
    birth_country: profile.birthCountry,
    phone_number: profile.phoneNumber,
    address_line_1: profile.addressLine1,
    city: profile.city,
    state_province: profile.stateProvince,
    postal_code: profile.postalCode,
    country_of_residence: profile.countryOfResidence,
    high_school_name: profile.highSchoolName,
    curriculum_system: profile.curriculumSystem,
    graduation_year: profile.graduationYear,
    gpa: profile.gpa,
    class_rank: profile.classRank,
    english_proficiency_status: profile.englishProficiencyStatus,
    intended_start_term: profile.intendedStartTerm,
    passport_country: profile.passportCountry,
    additional_context: profile.additionalContext,
    transcript_source_markdown: profile.transcriptSourceMarkdown,
    transcript_structured_markdown: profile.transcriptStructuredMarkdown,
    planning_book_markdown: profile.planningBookMarkdown,
    competitions: profile.competitions,
    activities: profile.activities,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function persistStudentParentLink(link: { id: string; studentId: string; parentUserId: string }) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("student_parent_links").upsert({
    id: link.id,
    student_id: link.studentId,
    parent_user_id: link.parentUserId,
  });
}

async function persistStudentConsultantLink(link: {
  id: string;
  studentId: string;
  consultantUserId: string;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("student_consultant_links").upsert({
    id: link.id,
    student_id: link.studentId,
    consultant_user_id: link.consultantUserId,
  });
}

async function persistAppUser(
  userId: string,
  name: string,
  email: string,
  role: UserRole,
  avatar?: string
) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("users").upsert({
    id: userId,
    name,
    email,
    role,
    avatar: avatar ?? null,
  });
}

async function persistContentItem(item: ContentItem) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const payload = {
    id: item.id,
    type: item.type,
    title: item.title,
    subtitle: item.subtitle,
    country: item.country ?? null,
    tags: item.tags,
    difficulty: item.difficulty,
    status: item.status,
    source: item.source,
  };

  const { error } = await supabase.from("content_items").upsert(payload);

  if (!error) {
    await persistContentDetail(item);
    return;
  }
}

async function removeContentItems(itemIds: string[]) {
  const supabase = getSupabaseAdminClient();
  if (!supabase || itemIds.length === 0) return;

  await supabase.from("content_items").delete().in("id", itemIds);
}

async function getPersistedContentItemById(itemId: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("content_items").select("*").eq("id", itemId).maybeSingle();

  if (!data) {
    return null;
  }

  const detailMaps = await loadContentDetailMaps();
  return mapContentItem(data, detailMaps);
}

async function persistContentDetail(item: ContentItem) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await Promise.allSettled([
    supabase.from("school_content_details").delete().eq("content_item_id", item.id),
    supabase.from("major_content_details").delete().eq("content_item_id", item.id),
    supabase.from("competition_content_details").delete().eq("content_item_id", item.id),
    supabase.from("course_content_details").delete().eq("content_item_id", item.id),
    supabase.from("chapter_content_details").delete().eq("content_item_id", item.id),
  ]);

  if (item.type === "school" && item.schoolDetails) {
    await Promise.allSettled([
      supabase.from("school_content_details").upsert({
        content_item_id: item.id,
        ranking: item.schoolDetails.ranking ?? null,
        city: item.schoolDetails.city ?? null,
        tuition_usd: item.schoolDetails.tuitionUsd ?? null,
        acceptance_rate: item.schoolDetails.acceptanceRate ?? null,
      }),
    ]);
  }

  if (item.type === "major" && item.majorDetails) {
    await Promise.allSettled([
      supabase.from("major_content_details").upsert({
        content_item_id: item.id,
        degree: item.majorDetails.degree ?? null,
        stem_eligible: item.majorDetails.stemEligible ?? null,
        recommended_background: item.majorDetails.recommendedBackground ?? null,
        career_paths: item.majorDetails.careerPaths ?? [],
      }),
    ]);
  }

  if (item.type === "competition" && item.competitionDetails) {
    await Promise.allSettled([
      supabase.from("competition_content_details").upsert({
        content_item_id: item.id,
        organizer: item.competitionDetails.organizer ?? null,
        eligibility: item.competitionDetails.eligibility ?? null,
        award: item.competitionDetails.award ?? null,
        season: item.competitionDetails.season ?? null,
      }),
    ]);
  }

  if (item.type === "course" && item.courseDetails) {
    await Promise.allSettled([
      supabase.from("course_content_details").upsert({
        content_item_id: item.id,
        provider: item.courseDetails.provider ?? null,
        format: item.courseDetails.format ?? null,
        duration_weeks: item.courseDetails.durationWeeks ?? null,
        workload: item.courseDetails.workload ?? null,
      }),
    ]);
  }

  if (item.type === "chapter" && item.chapterDetails) {
    await Promise.allSettled([
      supabase.from("chapter_content_details").upsert({
        content_item_id: item.id,
        curriculum: item.chapterDetails.curriculum ?? null,
        sequence: item.chapterDetails.sequence ?? null,
        estimated_hours: item.chapterDetails.estimatedHours ?? null,
        key_skill: item.chapterDetails.keySkill ?? null,
      }),
    ]);
  }
}

async function loadContentDetailMaps(): Promise<ContentDetailMaps> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      school: new Map(),
      major: new Map(),
      competition: new Map(),
      course: new Map(),
      chapter: new Map(),
    };
  }

  const [
    schoolResponse,
    majorResponse,
    competitionResponse,
    courseResponse,
    chapterResponse,
  ] = await Promise.all([
    supabase.from("school_content_details").select("*"),
    supabase.from("major_content_details").select("*"),
    supabase.from("competition_content_details").select("*"),
    supabase.from("course_content_details").select("*"),
    supabase.from("chapter_content_details").select("*"),
  ]);

  return {
    school: new Map(
      ((schoolResponse.data as DbRow[] | null) ?? []).map((row) => [
        String(row.content_item_id),
        {
          ranking: row.ranking == null ? undefined : String(row.ranking),
          city: row.city ? String(row.city) : undefined,
          tuitionUsd: row.tuition_usd == null ? undefined : Number(row.tuition_usd),
          acceptanceRate: row.acceptance_rate ? String(row.acceptance_rate) : undefined,
        } satisfies SchoolContentDetails,
      ])
    ),
    major: new Map(
      ((majorResponse.data as DbRow[] | null) ?? []).map((row) => [
        String(row.content_item_id),
        {
          degree: row.degree ? String(row.degree) : undefined,
          stemEligible: row.stem_eligible == null ? undefined : Boolean(row.stem_eligible),
          recommendedBackground: row.recommended_background
            ? String(row.recommended_background)
            : undefined,
          careerPaths: ((row.career_paths as string[] | null) ?? []).map(String),
        } satisfies MajorContentDetails,
      ])
    ),
    competition: new Map(
      ((competitionResponse.data as DbRow[] | null) ?? []).map((row) => [
        String(row.content_item_id),
        {
          organizer: row.organizer ? String(row.organizer) : undefined,
          eligibility: row.eligibility ? String(row.eligibility) : undefined,
          award: row.award ? String(row.award) : undefined,
          season: row.season ? String(row.season) : undefined,
        } satisfies CompetitionContentDetails,
      ])
    ),
    course: new Map(
      ((courseResponse.data as DbRow[] | null) ?? []).map((row) => [
        String(row.content_item_id),
        {
          provider: row.provider ? String(row.provider) : undefined,
          format: row.format ? (String(row.format) as CourseContentDetails["format"]) : undefined,
          durationWeeks: row.duration_weeks == null ? undefined : Number(row.duration_weeks),
          workload: row.workload ? String(row.workload) : undefined,
        } satisfies CourseContentDetails,
      ])
    ),
    chapter: new Map(
      ((chapterResponse.data as DbRow[] | null) ?? []).map((row) => [
        String(row.content_item_id),
        {
          curriculum: row.curriculum ? String(row.curriculum) : undefined,
          sequence: row.sequence ? String(row.sequence) : undefined,
          estimatedHours: row.estimated_hours == null ? undefined : Number(row.estimated_hours),
          keySkill: row.key_skill ? String(row.key_skill) : undefined,
        } satisfies ChapterContentDetails,
      ])
    ),
  };
}

async function persistAdvisorNote(note: AdvisorNote) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("advisor_notes").upsert({
    id: note.id,
    student_id: note.studentId,
    consultant_id: note.consultantId,
    title: note.title,
    summary: note.summary,
    created_at: note.createdAt,
  });
}

async function removeAdvisorNote(noteId: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("advisor_notes").delete().eq("id", noteId);
}

function mapStudent(row: DbRow): StudentRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? ""),
    name: String(row.name),
    grade: String(row.grade),
    school: String(row.school),
    phase: String(row.phase),
    targetCountries: ((row.target_countries as string[] | null) ?? []).map(String),
    dreamSchools: ((row.dream_schools as string[] | null) ?? []).map(String),
    intendedMajor: String(row.intended_major),
    completion: Number(row.completion ?? 0),
    checkInStreak: Number(row.check_in_streak ?? 0),
    masteryAverage: Number(row.mastery_average ?? 0),
    avatar: String(row.avatar ?? ""),
  };
}

function mapStudentApplicationProfile(row: DbRow): StudentApplicationProfile {
  return {
    studentId: String(row.student_id),
    legalFirstName: String(row.legal_first_name ?? ""),
    legalLastName: String(row.legal_last_name ?? ""),
    preferredName: String(row.preferred_name ?? ""),
    dateOfBirth: String(row.date_of_birth ?? ""),
    citizenship: String(row.citizenship ?? ""),
    birthCountry: String(row.birth_country ?? ""),
    phoneNumber: String(row.phone_number ?? ""),
    addressLine1: String(row.address_line_1 ?? ""),
    city: String(row.city ?? ""),
    stateProvince: String(row.state_province ?? ""),
    postalCode: String(row.postal_code ?? ""),
    countryOfResidence: String(row.country_of_residence ?? ""),
    highSchoolName: String(row.high_school_name ?? ""),
    curriculumSystem: String(row.curriculum_system ?? ""),
    graduationYear: String(row.graduation_year ?? ""),
    gpa: String(row.gpa ?? ""),
    classRank: String(row.class_rank ?? ""),
    englishProficiencyStatus: String(row.english_proficiency_status ?? ""),
    intendedStartTerm: String(row.intended_start_term ?? ""),
    passportCountry: String(row.passport_country ?? ""),
    additionalContext: String(row.additional_context ?? ""),
    transcriptSourceMarkdown: String(row.transcript_source_markdown ?? ""),
    transcriptStructuredMarkdown: String(row.transcript_structured_markdown ?? ""),
    planningBookMarkdown: String(row.planning_book_markdown ?? ""),
    competitions: normalizeCompetitionEntries(row.competitions),
    activities: normalizeActivityEntries(row.activities),
  };
}

function createDefaultStudentApplicationProfile(
  studentId: string,
  student: StudentRecord | null
): StudentApplicationProfile {
  const [legalFirstName = "", ...restName] = (student?.name ?? "").split(" ");
  return {
    studentId,
    legalFirstName,
    legalLastName: restName.join(" "),
    preferredName: legalFirstName,
    dateOfBirth: "",
    citizenship: "",
    birthCountry: "",
    phoneNumber: "",
    addressLine1: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    countryOfResidence: "",
    highSchoolName: student?.school ?? "",
    curriculumSystem: "",
    graduationYear: "",
    gpa: "",
    classRank: "",
    englishProficiencyStatus: "",
    intendedStartTerm: "",
    passportCountry: "",
    additionalContext: student?.intendedMajor
      ? `Interested in ${student.intendedMajor}.`
      : "",
    transcriptSourceMarkdown: "",
    transcriptStructuredMarkdown: "",
    planningBookMarkdown: "",
    competitions: normalizeCompetitionEntries([]),
    activities: normalizeActivityEntries([]),
  };
}

function normalizeCompetitionEntries(value: unknown): StudentCompetitionEntry[] {
  const entries = Array.isArray(value) ? value : [];
  const normalized = entries.map((entry) => ({
    name: String((entry as Record<string, unknown>)?.name ?? ""),
    field: String((entry as Record<string, unknown>)?.field ?? ""),
    year: String((entry as Record<string, unknown>)?.year ?? ""),
    level: String((entry as Record<string, unknown>)?.level ?? ""),
    result: String((entry as Record<string, unknown>)?.result ?? ""),
  }));

  while (normalized.length < 10) {
    normalized.push({ name: "", field: "", year: "", level: "", result: "" });
  }

  return normalized.slice(0, 10);
}

function normalizeActivityEntries(value: unknown): StudentActivityEntry[] {
  const entries = Array.isArray(value) ? value : [];
  const normalized = entries.map((entry) => ({
    name: String((entry as Record<string, unknown>)?.name ?? ""),
    role: String((entry as Record<string, unknown>)?.role ?? ""),
    grades: String((entry as Record<string, unknown>)?.grades ?? ""),
    timeCommitment: String((entry as Record<string, unknown>)?.timeCommitment ?? ""),
    impact: String((entry as Record<string, unknown>)?.impact ?? ""),
  }));

  while (normalized.length < 20) {
    normalized.push({ name: "", role: "", grades: "", timeCommitment: "", impact: "" });
  }

  return normalized.slice(0, 20);
}

function mapTask(row: DbRow): Task {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    title: String(row.title),
    description: String(row.description),
    startDate: String(row.start_date ?? row.due_date),
    endDate: String(row.end_date ?? row.due_date),
    timelineLane: normalizeTimelineLane(row.timeline_lane ?? row.category),
    dueLabel: String(row.due_label),
    dueDate: String(row.due_date),
    category: String(row.category),
    priority: row.priority as Task["priority"],
    status: row.status as Task["status"],
    ownerRole: row.owner_role as Task["ownerRole"],
  };
}

function mapMilestone(row: DbRow) {
  const eventDate = String(row.event_date ?? deriveMilestoneDate(row.date_label));
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    title: String(row.title),
    eventDate,
    dateLabel: formatMilestoneLabel(eventDate),
    status: normalizeMilestoneStatusValue(row.status),
    type: "deadline" as const,
  };
}

function mapCheckIn(row: DbRow): CheckInRecord {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    curriculum: String(row.curriculum),
    chapter: String(row.chapter),
    mastery: Number(row.mastery),
    date: String(row.date),
    notes: String(row.notes),
  };
}

function mapAdvisorNote(row: DbRow): AdvisorNote {
  return {
    id: String(row.id),
    studentId: String(row.student_id),
    consultantId: String(row.consultant_id),
    title: String(row.title),
    summary: String(row.summary),
    createdAt: String(row.created_at),
  };
}

function mapContentItem(row: DbRow, detailMaps?: ContentDetailMaps): ContentItem {
  const item: ContentItem = {
    id: String(row.id),
    type: row.type as ContentItem["type"],
    title: String(row.title),
    subtitle: String(row.subtitle),
    country: row.country ? String(row.country) : undefined,
    tags: ((row.tags as string[] | null) ?? []).map(String),
    difficulty: row.difficulty as ContentItem["difficulty"],
    status: row.status === "draft" ? "published" : (row.status as ContentItem["status"]),
    source: row.source as ContentItem["source"],
  };

  if (!detailMaps) {
    return item;
  }

  item.schoolDetails = detailMaps.school.get(item.id);
  item.majorDetails = detailMaps.major.get(item.id);
  item.competitionDetails = detailMaps.competition.get(item.id);
  item.courseDetails = detailMaps.course.get(item.id);
  item.chapterDetails = detailMaps.chapter.get(item.id);

  return normalizeContentItemDetails(item);
}

function normalizeContentItemDetails(item: ContentItem): ContentItem {
  return {
    ...item,
    schoolDetails: item.type === "school" ? item.schoolDetails : undefined,
    majorDetails: item.type === "major" ? item.majorDetails : undefined,
    competitionDetails: item.type === "competition" ? item.competitionDetails : undefined,
    courseDetails: item.type === "course" ? item.courseDetails : undefined,
    chapterDetails: item.type === "chapter" ? item.chapterDetails : undefined,
  };
}

function mapAnalytics(row: DbRow): AnalyticsSnapshot {
  return {
    id: String(row.id),
    date: String(row.date),
    activeStudents: Number(row.active_students),
    taskCompletionRate: Number(row.task_completion_rate),
    milestoneHitRate: Number(row.milestone_hit_rate),
    atRiskCount: Number(row.at_risk_count),
  };
}

function mapAuditLog(row: DbRow): AuditLog {
  return {
    id: String(row.id),
    timestamp: String(row.created_at),
    traceId: String(row.trace_id),
    decisionId: String(row.decision_id),
    actorId: String(row.actor_id),
    actorRole: row.actor_role as UserRole,
    page: String(row.page),
    action: String(row.action),
    targetType: String(row.target_type),
    targetId: String(row.target_id),
    status: row.status as "success" | "error",
    latencyMs: Number(row.latency_ms),
    inputSummary: String(row.input_summary),
    outputSummary: String(row.output_summary),
    errorCode: row.error_code ? String(row.error_code) : undefined,
  };
}

function mapAiArtifact(row: DbRow): AiArtifact {
  return {
    id: String(row.id),
    studentId: row.student_id ? String(row.student_id) : undefined,
    role: row.role as UserRole,
    page: String(row.page),
    feature: String(row.feature),
    model: String(row.model),
    promptVersion: String(row.prompt_version),
    inputSummary: String(row.input_summary),
    outputSummary: String(row.output_summary),
    sources: ((row.sources as string[] | null) ?? []).map(String),
    createdAt: String(row.created_at),
    traceId: String(row.trace_id),
    decisionId: String(row.decision_id),
    status: row.status as "success" | "error",
    errorCode: row.error_code ? String(row.error_code) : undefined,
  };
}

function normalizeTimelineLane(value: unknown): TimelineLane {
  const normalized = String(value ?? "").toLowerCase();

  if (
    normalized === "standardized_exams" ||
    normalized === "application_progress" ||
    normalized === "activities" ||
    normalized === "competitions"
  ) {
    return normalized;
  }

  if (normalized.includes("exam")) return "standardized_exams";
  if (normalized.includes("application")) return "application_progress";
  if (normalized.includes("competition")) return "competitions";
  if (normalized.includes("deadline") || normalized.includes("material") || normalized.includes("finance")) {
    return "application_progress";
  }

  return "activities";
}

function formatMilestoneLabel(eventDate: string) {
  const [year, month, day] = String(eventDate).split("-").map(Number);

  if (!year || !month || !day) {
    return String(eventDate);
  }

  return `${monthLabel(month)} ${String(day).padStart(2, "0")}`;
}

function deriveMilestoneDate(dateLabel: unknown) {
  const label = String(dateLabel ?? "");
  const currentYear = new Date().getFullYear();
  const parsed = new Date(`${label} ${currentYear} 00:00:00`);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function monthLabel(month: number) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month - 1] ?? "Jan";
}

function normalizeMilestoneStatusValue(value: unknown): Milestone["status"] {
  return String(value ?? "").toLowerCase() === "done" ? "done" : "upcoming";
}

function calculateTaskCompletion(tasks: Task[]) {
  if (tasks.length === 0) {
    return 0;
  }

  const done = tasks.filter((task) => task.status === "done").length;
  return Math.round((done / tasks.length) * 100);
}

function calculateMasteryAverage(checkIns: CheckInRecord[]) {
  if (checkIns.length === 0) {
    return 0;
  }

  const total = checkIns.reduce((sum, record) => sum + record.mastery, 0);
  return Number((total / checkIns.length).toFixed(1));
}

function calculateMilestoneHitRate(milestones: Milestone[]) {
  if (milestones.length === 0) {
    return 0;
  }

  const doneCount = milestones.filter((milestone) => milestone.status === "done").length;
  return Number((doneCount / milestones.length).toFixed(4));
}

function getConsultantRiskSignals(
  metrics: StudentLiveMetrics,
  tasks: Task[],
  milestones: Milestone[]
) {
  let riskScore = 0;

  if (metrics.completion < 50) {
    riskScore += 3;
  } else if (metrics.completion < 70) {
    riskScore += 1;
  }

  if (metrics.checkInStreak < 3) {
    riskScore += 3;
  } else if (metrics.checkInStreak < 7) {
    riskScore += 1;
  }

  if (metrics.masteryAverage < 3.5) {
    riskScore += 2;
  }

  const openTasks = tasks.filter((task) => task.status !== "done");
  if (openTasks.length >= 6) {
    riskScore += 1;
  }

  const nextDeadline = milestones
    .filter((milestone) => milestone.status !== "done")
    .sort((left, right) => left.eventDate.localeCompare(right.eventDate))[0];

  if (nextDeadline) {
    const daysUntilDeadline = dayDiff(new Date(), parseDate(nextDeadline.eventDate));
    if (daysUntilDeadline <= 14) {
      riskScore += 2;
    } else if (daysUntilDeadline <= 30) {
      riskScore += 1;
    }
  }

  return {
    riskScore,
    riskLevel: riskScore >= 6 ? "high" : riskScore >= 3 ? "medium" : "low",
    nextDeadlineDate: nextDeadline?.eventDate ?? null,
    nextDeadlineLabel: nextDeadline?.dateLabel ?? "No upcoming deadline",
    nextDeadlineTitle: nextDeadline?.title ?? "No upcoming deadline",
  } as const;
}

function dayDiff(start: Date, end: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay);
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function calculateCheckInStreak(checkIns: CheckInRecord[]) {
  if (checkIns.length === 0) {
    return 0;
  }

  const uniqueDates = Array.from(new Set(checkIns.map((record) => record.date)))
    .map(parseLocalDate)
    .sort((left, right) => right.getTime() - left.getTime());

  if (uniqueDates.length === 0) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previous = uniqueDates[index - 1] as Date;
    const current = uniqueDates[index] as Date;
    const diff = Math.round((previous.getTime() - current.getTime()) / (24 * 60 * 60 * 1000));

    if (diff !== 1) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function parseLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function upsertCheckInInStore(record: CheckInRecord) {
  const store = getStore();
  const index = store.checkIns.findIndex((item) => item.id === record.id);

  if (index === -1) {
    store.checkIns.unshift(record);
    return;
  }

  store.checkIns[index] = record;
}

function upsertMilestoneInStore(milestone: Milestone) {
  const store = getStore();
  const index = store.milestones.findIndex((item) => item.id === milestone.id);

  if (index === -1) {
    store.milestones.unshift(milestone);
    return;
  }

  store.milestones[index] = milestone;
}

function upsertTaskInStore(task: Task) {
  const store = getStore();
  const index = store.tasks.findIndex((item) => item.id === task.id);

  if (index === -1) {
    store.tasks.unshift(task);
    return;
  }

  store.tasks[index] = task;
}

function upsertStudentInStore(student: StudentRecord) {
  const store = getStore();
  const index = store.students.findIndex((item) => item.id === student.id);

  if (index === -1) {
    store.students.unshift(student);
    return;
  }

  store.students[index] = student;
}

function upsertUserInStore(user: User) {
  const store = getStore();
  const index = store.users.findIndex((item) => item.id === user.id);

  if (index === -1) {
    store.users.unshift(user);
    return;
  }

  store.users[index] = user;
}

function upsertApplicationProfileInStore(profile: StudentApplicationProfile) {
  const store = getStore();
  store.applicationProfiles ??= [];
  const index = store.applicationProfiles.findIndex((item) => item.studentId === profile.studentId);

  if (index === -1) {
    store.applicationProfiles.unshift(profile);
    return;
  }

  store.applicationProfiles[index] = profile;
}
