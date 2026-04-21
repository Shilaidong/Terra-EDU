import type {
  AdvisorNote,
  AiArtifact,
  AnalyticsSnapshot,
  AuditLog,
  CheckInRecord,
  ContentItem,
  HomeworkQuestionAttempt,
  HomeworkQuestionItem,
  Milestone,
  Profile,
  HomeworkGradingRecord,
  ReadingPassageItem,
  ReadingQuizAttempt,
  ReadingTrainingRecord,
  StudentApplicationProfile,
  StudentConsultantLink,
  StudentParentLink,
  StudentRecord,
  Task,
  User,
  VocabularyAttempt,
  VocabularyPack,
  VocabularyWordItem,
  VocabularyStudyRecord,
} from "@/lib/types";
import { avatarPresetValues, getDefaultStudentAvatar } from "@/lib/avatar-presets";

declare global {
  var __terraStore: TerraStore | undefined;
}

export interface TerraStore {
  users: User[];
  profiles: Profile[];
  students: StudentRecord[];
  applicationProfiles: StudentApplicationProfile[];
  studentParentLinks: StudentParentLink[];
  studentConsultantLinks: StudentConsultantLink[];
  tasks: Task[];
  milestones: Milestone[];
  checkIns: CheckInRecord[];
  vocabularyStudyRecords: VocabularyStudyRecord[];
  vocabularyPacks: VocabularyPack[];
  vocabularyWords: VocabularyWordItem[];
  vocabularyAttempts: VocabularyAttempt[];
  homeworkGradingRecords: HomeworkGradingRecord[];
  homeworkQuestions: HomeworkQuestionItem[];
  homeworkQuestionAttempts: HomeworkQuestionAttempt[];
  readingTrainingRecords: ReadingTrainingRecord[];
  readingPassages: ReadingPassageItem[];
  readingQuizAttempts: ReadingQuizAttempt[];
  contentItems: ContentItem[];
  advisorNotes: AdvisorNote[];
  analyticsSnapshots: AnalyticsSnapshot[];
  aiArtifacts: AiArtifact[];
  auditLogs: AuditLog[];
}

const avatars = {
  student: avatarPresetValues[0],
  parent: avatarPresetValues[2],
  consultant: avatarPresetValues[1],
  child: getDefaultStudentAvatar(),
};

function seedStore(): TerraStore {
  return {
    users: [
      {
        id: "11111111-1111-1111-1111-111111111111",
        email: "student@terra.edu",
        password: "terra123",
        name: "Amara Chen",
        role: "student",
        profileId: "profile_student_1",
        avatar: avatars.student,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        email: "parent@terra.edu",
        password: "terra123",
        name: "Li Wei",
        role: "parent",
        profileId: "profile_parent_1",
        avatar: avatars.parent,
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        email: "consultant@terra.edu",
        password: "terra123",
        name: "Sofia Martinez",
        role: "consultant",
        profileId: "profile_consultant_1",
        avatar: avatars.consultant,
      },
      {
        id: "44444444-3333-3333-3333-333333333333",
        email: "admin@terra.edu",
        password: "terra123",
        name: "Terra Admin",
        role: "admin",
        profileId: "profile_admin_1",
        avatar: avatars.consultant,
      },
    ],
    profiles: [
      {
        id: "profile_student_1",
        school: "Westside Academy",
        gradeOrTitle: "Grade 11 Student",
        bio: "Ambitious environmental engineering applicant balancing STEM depth and extracurricular leadership.",
      },
      {
        id: "profile_parent_1",
        school: "Parent Account",
        gradeOrTitle: "Family Oversight",
        bio: "Monitoring academic progress and consultant follow-ups.",
      },
      {
        id: "profile_consultant_1",
        school: "Terra Edu",
        gradeOrTitle: "Senior Admissions Consultant",
        bio: "Managing a cohort of international applicants across the US and UK.",
      },
      {
        id: "profile_admin_1",
        school: "Terra Edu",
        gradeOrTitle: "Platform Administrator",
        bio: "Managing registrations, student assignments, and account bindings.",
      },
    ],
    students: [
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        userId: "11111111-1111-1111-1111-111111111111",
        name: "Amara Chen",
        grade: "Grade 11",
        school: "Westside Academy",
        phase: "Research",
        targetCountries: ["USA", "United Kingdom"],
        dreamSchools: ["Stanford University", "UCL London"],
        intendedMajor: "Environmental Engineering",
        completion: 68,
        checkInStreak: 18,
        masteryAverage: 4.1,
        avatar: avatars.child,
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        userId: "student_managed_2",
        name: "Elena Park",
        grade: "Grade 12",
        school: "Maple Leaf International",
        phase: "Application",
        targetCountries: ["Netherlands", "Canada"],
        dreamSchools: ["University of Amsterdam", "University of Toronto"],
        intendedMajor: "Economics",
        completion: 82,
        checkInStreak: 14,
        masteryAverage: 3.8,
        avatar: avatars.student,
      },
      {
        id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        userId: "student_managed_3",
        name: "Noah Kim",
        grade: "Grade 10",
        school: "Brighton High",
        phase: "Planning",
        targetCountries: ["USA"],
        dreamSchools: ["UC Berkeley"],
        intendedMajor: "Computer Science",
        completion: 41,
        checkInStreak: 7,
        masteryAverage: 4.3,
        avatar: avatars.consultant,
      },
    ],
    applicationProfiles: [
      {
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        legalFirstName: "Amara",
        legalLastName: "Chen",
        preferredName: "Amara",
        dateOfBirth: "2008-08-16",
        citizenship: "China",
        birthCountry: "China",
        phoneNumber: "+86 138 0000 0000",
        addressLine1: "88 Riverside Avenue",
        city: "Shanghai",
        stateProvince: "Shanghai",
        postalCode: "200000",
        countryOfResidence: "China",
        highSchoolName: "Westside Academy",
        curriculumSystem: "AP",
        graduationYear: "2027",
        gpa: "3.86/4.00",
        classRank: "Top 10%",
        englishProficiencyStatus: "Plan to submit IELTS",
        intendedStartTerm: "Fall 2027",
        passportCountry: "China",
        additionalContext: "Interested in sustainability, research, and environmental systems.",
        transcriptSourceMarkdown: "## Grade 10-11 Transcript Notes\n\n- AP Calculus AB: A\n- AP Physics 1: A-\n- AP Environmental Science: A\n- English 10 Honors: A\n",
        transcriptStructuredMarkdown:
          "## Transcript Snapshot\n\n- **Curriculum:** AP\n- **Visible strengths:** Calculus, Physics, Environmental Science\n- **Pattern:** STEM-heavy with consistent A range performance\n",
        planningBookMarkdown:
          "## Student Planning Book\n\n### Positioning\nAmara is building a sustainability-focused engineering profile with a clear blend of STEM rigor, research interest, and leadership.\n\n### Priority Themes\n- Strengthen engineering narrative\n- Maintain GPA consistency\n- Build one deeper research or impact project\n\n### Near-Term Focus\n- Finish language testing plan\n- Tighten essay storyline\n- Keep competition and activity evidence organized\n",
        competitions: Array.from({ length: 10 }, (_, index) =>
          index === 0
            ? {
                name: "International Young Eco-Hero Summit",
                field: "Environmental research",
                year: "2025",
                level: "International",
                result: "Global finalist",
              }
            : { name: "", field: "", year: "", level: "", result: "" }
        ),
        activities: Array.from({ length: 20 }, (_, index) =>
          index === 0
            ? {
                name: "Environmental Action Club",
                role: "Founder & President",
                grades: "10-11",
                timeCommitment: "3 hrs/week, 30 weeks/year",
                impact: "Led 18 members and launched campus recycling campaign.",
              }
            : { name: "", role: "", grades: "", timeCommitment: "", impact: "" }
        ),
      },
    ],
    studentParentLinks: [
      {
        id: "link_parent_1",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        parentUserId: "22222222-2222-2222-2222-222222222222",
      },
    ],
    studentConsultantLinks: [
      {
        id: "link_consultant_1",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        consultantUserId: "33333333-3333-3333-3333-333333333333",
      },
    ],
    tasks: [
      {
        id: "44444444-4444-4444-4444-444444444441",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "Upload IELTS results",
        description: "Finalize the score report and upload it to the application hub.",
        startDate: "2026-03-24",
        endDate: "2026-03-26",
        timelineLane: "standardized_exams",
        dueLabel: "Due by 5:00 PM",
        dueDate: "2026-03-26",
        category: "Documents",
        priority: "High",
        status: "pending",
        ownerRole: "student",
      },
      {
        id: "44444444-4444-4444-4444-444444444442",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "Review Personal Statement draft",
        description: "Prepare advisor comments and next revision notes.",
        startDate: "2026-03-25",
        endDate: "2026-03-27",
        timelineLane: "application_progress",
        dueLabel: "Advisor session at 2 PM",
        dueDate: "2026-03-27",
        category: "Essay",
        priority: "High",
        status: "in_progress",
        ownerRole: "consultant",
      },
      {
        id: "44444444-4444-4444-4444-444444444443",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "Confirm housing deposit",
        description: "Verify payment readiness and supporting documents.",
        startDate: "2026-03-27",
        endDate: "2026-03-29",
        timelineLane: "application_progress",
        dueLabel: "Priority: High",
        dueDate: "2026-03-29",
        category: "Finance",
        priority: "High",
        status: "pending",
        ownerRole: "student",
      },
      {
        id: "44444444-4444-4444-4444-444444444444",
        studentId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        title: "Finalize scholarship essay",
        description: "Submit final draft for University of Amsterdam scholarship.",
        startDate: "2026-03-24",
        endDate: "2026-03-25",
        timelineLane: "application_progress",
        dueLabel: "48 hours left",
        dueDate: "2026-03-25",
        category: "Essay",
        priority: "High",
        status: "pending",
        ownerRole: "student",
      },
      {
        id: "44444444-4444-4444-4444-444444444445",
        studentId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        title: "Complete profile baseline",
        description: "Finish course, activity, and target school baseline.",
        startDate: "2026-03-24",
        endDate: "2026-03-30",
        timelineLane: "activities",
        dueLabel: "This week",
        dueDate: "2026-03-30",
        category: "Planning",
        priority: "Medium",
        status: "in_progress",
        ownerRole: "consultant",
      },
    ],
    milestones: [
      {
        id: "55555555-5555-5555-5555-555555555551",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "IELTS Final Submission",
        eventDate: "2026-04-02",
        dateLabel: "Apr 02",
        status: "upcoming",
        type: "deadline",
      },
      {
        id: "55555555-5555-5555-5555-555555555552",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "College Essay Draft",
        eventDate: "2026-04-10",
        dateLabel: "Apr 10",
        status: "upcoming",
        type: "deadline",
      },
      {
        id: "55555555-5555-5555-5555-555555555553",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "STEM Competition Result",
        eventDate: "2026-05-03",
        dateLabel: "May 03",
        status: "upcoming",
        type: "deadline",
      },
      {
        id: "55555555-5555-5555-5555-555555555554",
        studentId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        title: "Amsterdam Scholarship",
        eventDate: "2026-03-28",
        dateLabel: "Mar 28",
        status: "upcoming",
        type: "deadline",
      },
    ],
    checkIns: [
      {
        id: "66666666-6666-6666-6666-666666666661",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        curriculum: "AP Physics",
        chapter: "Electromagnetism",
        mastery: 4,
        date: "2026-03-24",
        notes: "Conceptually solid, needs more timed practice.",
      },
      {
        id: "66666666-6666-6666-6666-666666666662",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        curriculum: "AP Calculus",
        chapter: "Series & Convergence",
        mastery: 5,
        date: "2026-03-23",
        notes: "Excellent command on problem sets.",
      },
      {
        id: "66666666-6666-6666-6666-666666666663",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        curriculum: "Environmental Science",
        chapter: "Climate Systems",
        mastery: 3,
        date: "2026-03-21",
        notes: "Needs stronger real-world examples.",
      },
    ],
    vocabularyStudyRecords: [
      {
        id: "study_vocab_1",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        date: "2026-04-18",
        packName: "托福核心词汇 A1",
        newWordsCount: 28,
        reviewWordsCount: 0,
        completed: true,
        mastery: 4,
        notes: "第一次过词表，能记住大部分词义。",
        reviewStage: 0,
      },
      {
        id: "study_vocab_2",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        date: "2026-04-19",
        packName: "托福核心词汇 A1",
        newWordsCount: 0,
        reviewWordsCount: 28,
        completed: true,
        mastery: 4,
        notes: "第二次复习时仍有 5 个词容易混淆。",
        reviewStage: 1,
      },
      {
        id: "study_vocab_3",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        date: "2026-04-20",
        packName: "托福核心词汇 B1",
        newWordsCount: 30,
        reviewWordsCount: 0,
        completed: true,
        mastery: 3,
        notes: "新词量略多，晚上复习有点吃力。",
        reviewStage: 0,
      },
    ],
    vocabularyPacks: [
      {
        id: "vocab_pack_demo_1",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        name: "托福核心词汇 C1",
        dailyNewCount: 8,
        dailyReviewCount: 16,
        totalWords: 4,
        active: true,
        createdAt: "2026-04-18",
      },
    ],
    vocabularyWords: [
      {
        id: "vocab_word_demo_1",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        packId: "vocab_pack_demo_1",
        word: "mitigate",
        meaning: "缓解|减轻",
        notes: "",
        sortOrder: 1,
        introducedOn: "2026-04-18",
        nextReviewOn: "2026-04-22",
        reviewStage: 2,
        totalAttempts: 3,
        correctAttempts: 2,
        completed: false,
      },
      {
        id: "vocab_word_demo_2",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        packId: "vocab_pack_demo_1",
        word: "resilient",
        meaning: "有韧性的|能迅速恢复的",
        notes: "",
        sortOrder: 2,
        introducedOn: "2026-04-19",
        nextReviewOn: "2026-04-21",
        reviewStage: 1,
        totalAttempts: 2,
        correctAttempts: 2,
        completed: false,
      },
      {
        id: "vocab_word_demo_3",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        packId: "vocab_pack_demo_1",
        word: "feasible",
        meaning: "可行的",
        notes: "",
        sortOrder: 3,
        introducedOn: "",
        nextReviewOn: "",
        reviewStage: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        completed: false,
      },
      {
        id: "vocab_word_demo_4",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        packId: "vocab_pack_demo_1",
        word: "allocate",
        meaning: "分配|拨给",
        notes: "",
        sortOrder: 4,
        introducedOn: "",
        nextReviewOn: "",
        reviewStage: 0,
        totalAttempts: 0,
        correctAttempts: 0,
        completed: false,
      },
    ],
    vocabularyAttempts: [
      {
        id: "vocab_attempt_demo_1",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        packId: "vocab_pack_demo_1",
        wordItemId: "vocab_word_demo_1",
        date: "2026-04-20",
        mode: "review",
        prompt: "mitigate",
        expectedAnswer: "缓解|减轻",
        studentAnswer: "减轻",
        correct: true,
      },
    ],
    homeworkGradingRecords: [
      {
        id: "study_grading_1",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        date: "2026-04-20",
        assignmentTitle: "托福独立写作：Should students do volunteer work?",
        promptContent: "Discuss whether high school students should be required to do volunteer work before graduation.",
        studentAnswer: "Students should do volunteer work because it helps society and also improves communication ability, but my example part was not strong enough.",
        referenceAnswer: "Teacher note: strengthen concrete examples and improve the logic between the first and second paragraph.",
        overallEvaluation: "整体观点清楚，立场稳定，但论证层次还不够扎实，尤其例子支撑偏弱。",
        errorAnalysis: "主要问题在于论点展开不足、例子不够具体、段落之间衔接略显生硬。",
        remediationPlan: "先把每一段的核心论点写成一句话，再给每段补一个真实或可想象的具体场景例子。",
        nextStep: "下一次重写时优先修正文中例子和连接句，再重新检查段落逻辑。",
      },
    ],
    homeworkQuestions: [
      {
        id: "homework_question_demo_1",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        subject: "写作",
        prompt: "请用英文说明为什么高中生应该参与志愿活动。",
        correctAnswer: "因为志愿活动能帮助学生建立责任感、同理心，并通过真实社会参与提升表达与协作能力。",
        explanation: "核心在于责任感、同理心、真实参与和成长收益。",
        sortOrder: 1,
        completed: false,
        createdAt: "2026-04-19",
      },
      {
        id: "homework_question_demo_2",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        subject: "语法",
        prompt: "改写句子：He don't like to study in the morning.",
        correctAnswer: "He doesn't like to study in the morning.",
        explanation: "第三人称单数一般现在时需要使用 doesn't。",
        sortOrder: 2,
        completed: false,
        createdAt: "2026-04-19",
      },
    ],
    homeworkQuestionAttempts: [],
    readingTrainingRecords: [
      {
        id: "study_reading_1",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        date: "2026-04-19",
        materialTitle: "National Geographic: Ocean Climate Systems",
        trainingType: "精读",
        durationMinutes: 35,
        completedUnits: "1 篇文章 + 8 道题",
        comprehension: 4,
        notes: "主旨题和推断题表现稳定，细节定位还可以更快。",
      },
      {
        id: "study_reading_2",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        date: "2026-04-20",
        materialTitle: "Scientific American: Clean Energy Storage",
        trainingType: "限时阅读",
        durationMinutes: 42,
        completedUnits: "2 篇文章",
        comprehension: 3,
        notes: "第二篇后半段速度下降，信息整合还不够稳。",
      },
    ],
    readingPassages: [
      {
        id: "reading_passage_demo_1",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        title: "Urban Trees and Heat Islands",
        passage:
          "Cities often become warmer than surrounding rural areas because roads, buildings, and other hard surfaces absorb and retain heat. This phenomenon is called the urban heat island effect. Researchers have found that planting more trees can reduce surface temperatures by providing shade and releasing moisture into the air through transpiration. However, the effectiveness of tree planting depends on species selection, long-term maintenance, and how evenly green spaces are distributed across different neighborhoods.",
        source: "Demo reading bank",
        sortOrder: 1,
        createdAt: "2026-04-20",
      },
    ],
    readingQuizAttempts: [],
    contentItems: [
      {
        id: "77777777-7777-7777-7777-777777777771",
        type: "school",
        title: "Stanford University",
        subtitle: "Palo Alto, California",
        country: "United States",
        tags: ["Engineering", "Research", "Need-aware"],
        difficulty: "Reach",
        status: "published",
        source: "manual",
        schoolDetails: {
          ranking: "6",
          city: "Palo Alto",
          tuitionUsd: 65127,
          acceptanceRate: "3.9%",
        },
      },
      {
        id: "77777777-7777-7777-7777-777777777772",
        type: "major",
        title: "Environmental Engineering",
        subtitle: "Sustainability, systems, impact",
        tags: ["STEM", "Climate", "Interdisciplinary"],
        difficulty: "Match",
        status: "published",
        source: "manual",
        majorDetails: {
          degree: "BS",
          stemEligible: true,
          recommendedBackground: "Physics, calculus, environmental systems",
          careerPaths: ["Sustainability Consultant", "Water Systems Engineer"],
        },
      },
      {
        id: "77777777-7777-7777-7777-777777777773",
        type: "competition",
        title: "International Young Eco-Hero Summit",
        subtitle: "Research & innovation challenge",
        country: "Global",
        tags: ["Research", "Sustainability"],
        difficulty: "Match",
        status: "published",
        source: "manual",
        competitionDetails: {
          organizer: "Eco Future Alliance",
          eligibility: "Grade 9-12 teams",
          award: "Global finalist recognition",
          season: "Spring",
        },
      },
      {
        id: "77777777-7777-7777-7777-777777777774",
        type: "course",
        title: "AP Physics C",
        subtitle: "Mechanics and Electricity",
        tags: ["AP", "STEM"],
        difficulty: "Reach",
        status: "published",
        source: "manual",
        courseDetails: {
          provider: "Westside Academy",
          format: "Offline",
          durationWeeks: 24,
          workload: "5 hours/week",
        },
      },
    ],
    advisorNotes: [
      {
        id: "88888888-8888-8888-8888-888888888881",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        consultantId: "33333333-3333-3333-3333-333333333333",
        title: "Profile momentum is strong",
        summary: "Amara is ahead on language scores; next leverage point is deeper narrative alignment in essays.",
        createdAt: "2026-03-23T09:00:00.000Z",
      },
      {
        id: "88888888-8888-8888-8888-888888888882",
        studentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        consultantId: "33333333-3333-3333-3333-333333333333",
        title: "Parent sync completed",
        summary: "Discussed research timeline and competition positioning with Li Wei.",
        createdAt: "2026-03-22T14:30:00.000Z",
      },
    ],
    analyticsSnapshots: [
      {
        id: "analytics_1",
        date: "2026-03-20",
        activeStudents: 142,
        taskCompletionRate: 0.874,
        milestoneHitRate: 0.92,
        atRiskCount: 6,
      },
      {
        id: "analytics_2",
        date: "2026-03-24",
        activeStudents: 148,
        taskCompletionRate: 0.889,
        milestoneHitRate: 0.94,
        atRiskCount: 5,
      },
    ],
    aiArtifacts: [],
    auditLogs: [
      {
        id: "audit_seed_1",
        timestamp: "2026-03-24T10:00:00.000Z",
        traceId: "trace_seed_1",
        decisionId: "decision_seed_1",
        actorId: "user_consultant_1",
        actorRole: "consultant",
        page: "/consultant/content",
        action: "bulk_sync_reviewed",
        targetType: "content_batch",
        targetId: "seed_batch",
        status: "success",
        latencyMs: 114,
        inputSummary: "Reviewed imported curriculum template",
        outputSummary: "3 items pending verification",
      },
    ],
  };
}

export function getStore(): TerraStore {
  if (!global.__terraStore) {
    global.__terraStore = seedStore();
  }

  if (!global.__terraStore.applicationProfiles) {
    global.__terraStore.applicationProfiles = [];
  }

  if (!global.__terraStore.studentParentLinks) {
    global.__terraStore.studentParentLinks = [];
  }

  if (!global.__terraStore.studentConsultantLinks) {
    global.__terraStore.studentConsultantLinks = [];
  }

  if (!global.__terraStore.vocabularyStudyRecords) {
    global.__terraStore.vocabularyStudyRecords = [];
  }
  if (!global.__terraStore.vocabularyPacks) {
    global.__terraStore.vocabularyPacks = [];
  }
  if (!global.__terraStore.vocabularyWords) {
    global.__terraStore.vocabularyWords = [];
  }
  if (!global.__terraStore.vocabularyAttempts) {
    global.__terraStore.vocabularyAttempts = [];
  }

  if (!global.__terraStore.homeworkGradingRecords) {
    global.__terraStore.homeworkGradingRecords = [];
  }
  if (!global.__terraStore.homeworkQuestions) {
    global.__terraStore.homeworkQuestions = [];
  }
  if (!global.__terraStore.homeworkQuestionAttempts) {
    global.__terraStore.homeworkQuestionAttempts = [];
  }

  if (!global.__terraStore.readingTrainingRecords) {
    global.__terraStore.readingTrainingRecords = [];
  }
  if (!global.__terraStore.readingPassages) {
    global.__terraStore.readingPassages = [];
  }
  if (!global.__terraStore.readingQuizAttempts) {
    global.__terraStore.readingQuizAttempts = [];
  }

  return global.__terraStore;
}
