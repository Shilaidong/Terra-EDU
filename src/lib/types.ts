export type UserRole = "student" | "parent" | "consultant";
export type TimelineView = "year" | "three_years" | "month";
export type TimelineLane =
  | "standardized_exams"
  | "application_progress"
  | "activities"
  | "competitions";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  profileId: string;
  avatar: string;
}

export interface Profile {
  id: string;
  school: string;
  gradeOrTitle: string;
  bio: string;
}

export interface StudentRecord {
  id: string;
  userId: string;
  name: string;
  grade: string;
  school: string;
  phase: string;
  targetCountries: string[];
  dreamSchools: string[];
  intendedMajor: string;
  completion: number;
  checkInStreak: number;
  masteryAverage: number;
  avatar: string;
}

export interface Task {
  id: string;
  studentId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  timelineLane: TimelineLane;
  dueLabel: string;
  dueDate: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  status: "pending" | "in_progress" | "done";
  ownerRole: UserRole;
}

export interface Milestone {
  id: string;
  studentId: string;
  title: string;
  eventDate: string;
  dateLabel: string;
  status: "upcoming" | "done";
  type: "deadline";
}

export interface CheckInRecord {
  id: string;
  studentId: string;
  curriculum: string;
  chapter: string;
  mastery: number;
  date: string;
  notes: string;
}

export interface ContentItem {
  id: string;
  type: "course" | "chapter" | "competition" | "school" | "major";
  title: string;
  subtitle: string;
  country?: string;
  tags: string[];
  difficulty: "Safety" | "Match" | "Reach";
  status: "published" | "draft";
  source: "manual" | "import";
}

export interface AdvisorNote {
  id: string;
  studentId: string;
  consultantId: string;
  title: string;
  summary: string;
  createdAt: string;
}

export interface AnalyticsSnapshot {
  id: string;
  date: string;
  activeStudents: number;
  taskCompletionRate: number;
  milestoneHitRate: number;
  atRiskCount: number;
}

export interface AiArtifact {
  id: string;
  studentId?: string;
  role: UserRole;
  page: string;
  feature: string;
  model: string;
  promptVersion: string;
  inputSummary: string;
  outputSummary: string;
  sources: string[];
  createdAt: string;
  traceId: string;
  decisionId: string;
  status: "success" | "error";
  errorCode?: string;
}

export interface SessionPayload {
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  avatar?: string;
  authSource?: "demo" | "supabase";
  authUserId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  traceId: string;
  decisionId: string;
  actorId: string;
  actorRole: UserRole;
  page: string;
  action: string;
  targetType: string;
  targetId: string;
  status: "success" | "error";
  latencyMs: number;
  inputSummary: string;
  outputSummary: string;
  errorCode?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  entity_id?: string;
  trace_id: string;
  decision_id?: string;
  message: string;
  data?: T;
}
