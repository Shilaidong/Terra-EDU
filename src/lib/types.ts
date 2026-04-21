export type UserRole = "student" | "parent" | "consultant" | "admin";
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

export interface StudentCompetitionEntry {
  name: string;
  field: string;
  year: string;
  level: string;
  result: string;
}

export interface StudentActivityEntry {
  name: string;
  role: string;
  grades: string;
  timeCommitment: string;
  impact: string;
}

export interface StudentApplicationProfile {
  studentId: string;
  legalFirstName: string;
  legalLastName: string;
  preferredName: string;
  dateOfBirth: string;
  citizenship: string;
  birthCountry: string;
  phoneNumber: string;
  addressLine1: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryOfResidence: string;
  highSchoolName: string;
  curriculumSystem: string;
  graduationYear: string;
  gpa: string;
  classRank: string;
  englishProficiencyStatus: string;
  intendedStartTerm: string;
  passportCountry: string;
  additionalContext: string;
  transcriptSourceMarkdown: string;
  transcriptStructuredMarkdown: string;
  planningBookMarkdown: string;
  competitions: StudentCompetitionEntry[];
  activities: StudentActivityEntry[];
}

export interface StudentParentLink {
  id: string;
  studentId: string;
  parentUserId: string;
}

export interface StudentConsultantLink {
  id: string;
  studentId: string;
  consultantUserId: string;
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

export interface VocabularyStudyRecord {
  id: string;
  studentId: string;
  date: string;
  packName: string;
  newWordsCount: number;
  reviewWordsCount: number;
  completed: boolean;
  mastery: number;
  notes: string;
  reviewStage: number;
}

export interface VocabularyPack {
  id: string;
  studentId: string;
  name: string;
  dailyNewCount: number;
  dailyReviewCount: number;
  totalWords: number;
  active: boolean;
  createdAt: string;
}

export interface VocabularyWordItem {
  id: string;
  studentId: string;
  packId: string;
  word: string;
  meaning: string;
  notes: string;
  sortOrder: number;
  introducedOn: string;
  nextReviewOn: string;
  reviewStage: number;
  totalAttempts: number;
  correctAttempts: number;
  completed: boolean;
}

export interface VocabularyAttempt {
  id: string;
  studentId: string;
  packId: string;
  wordItemId: string;
  date: string;
  mode: "new" | "review";
  prompt: string;
  expectedAnswer: string;
  studentAnswer: string;
  correct: boolean;
}

export interface HomeworkGradingRecord {
  id: string;
  studentId: string;
  date: string;
  assignmentTitle: string;
  promptContent: string;
  studentAnswer: string;
  referenceAnswer: string;
  overallEvaluation: string;
  errorAnalysis: string;
  remediationPlan: string;
  nextStep: string;
}

export interface HomeworkQuestionItem {
  id: string;
  studentId: string;
  subject: string;
  prompt: string;
  correctAnswer: string;
  explanation: string;
  sortOrder: number;
  completed: boolean;
  createdAt: string;
}

export interface HomeworkQuestionAttempt {
  id: string;
  studentId: string;
  questionId: string;
  date: string;
  subject: string;
  studentAnswer: string;
  correctAnswer: string;
  correct: boolean;
}

export interface ReadingPassageItem {
  id: string;
  studentId: string;
  title: string;
  passage: string;
  source: string;
  sortOrder: number;
  createdAt: string;
}

export interface ReadingQuizQuestion {
  stem: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ReadingTrainingRecord {
  id: string;
  studentId: string;
  date: string;
  materialTitle: string;
  trainingType: string;
  durationMinutes: number;
  completedUnits: string;
  comprehension: number;
  notes: string;
}

export interface ReadingQuizAttempt {
  id: string;
  studentId: string;
  passageId: string;
  date: string;
  title: string;
  questions: ReadingQuizQuestion[];
  selectedAnswers: number[];
  correctCount: number;
  totalQuestions: number;
  perfect: boolean;
}

export interface StudyCenterMetrics {
  streakDays: number;
  recentSessionCount: number;
  vocabularyReviewCompletionRate: number;
  readingSessionCount: number;
  averagePerformance: number;
}

export interface StudyCenterData {
  vocabularyPacks: VocabularyPack[];
  vocabularyWords: VocabularyWordItem[];
  vocabularyAttempts: VocabularyAttempt[];
  homeworkQuestions: HomeworkQuestionItem[];
  homeworkAttempts: HomeworkQuestionAttempt[];
  readingPassages: ReadingPassageItem[];
  readingQuizAttempts: ReadingQuizAttempt[];
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
  schoolDetails?: {
    ranking?: string;
    city?: string;
    tuitionUsd?: number;
    acceptanceRate?: string;
  };
  majorDetails?: {
    degree?: string;
    stemEligible?: boolean;
    recommendedBackground?: string;
    careerPaths: string[];
  };
  competitionDetails?: {
    organizer?: string;
    eligibility?: string;
    award?: string;
    season?: string;
  };
  courseDetails?: {
    provider?: string;
    format?: "Online" | "Offline" | "Hybrid";
    durationWeeks?: number;
    workload?: string;
  };
  chapterDetails?: {
    curriculum?: string;
    sequence?: string;
    estimatedHours?: number;
    keySkill?: string;
  };
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
