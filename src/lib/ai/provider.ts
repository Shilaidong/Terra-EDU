import type {
  AdvisorNote,
  HomeworkQuestionAttempt,
  HomeworkQuestionItem,
  HomeworkGradingRecord,
  Milestone,
  ReadingPassageItem,
  ReadingQuizAttempt,
  ReadingQuizQuestion,
  ReadingTrainingRecord,
  StudentApplicationProfile,
  StudentRecord,
  StudyCenterData,
  StudyCenterMetrics,
  Task,
  UserRole,
  VocabularyAttempt,
  VocabularyPack,
  VocabularyWordItem,
  VocabularyStudyRecord,
} from "@/lib/types";
import { structuredLog } from "@/lib/observability";

export type TerraAiProvider = "mock" | "minimax_anthropic";
export type AiWorkflowKind =
  | "student_weekly_actions"
  | "student_transcript_parse"
  | "student_task_breakdown"
  | "consultant_weekly_report"
  | "consultant_meeting_summary"
  | "parent_weekly_summary";

type AnthropicContentBlock = {
  type: string;
  text?: string;
};

type AnthropicMessagesResponse = {
  id?: string;
  model?: string;
  content?: AnthropicContentBlock[];
};

type StudentContextPayload = {
  student: StudentRecord | null;
  applicationProfile?: StudentApplicationProfile | null;
  tasks?: Task[];
  milestones?: Milestone[];
  studyCenter?: {
    vocabularyPacks: VocabularyPack[];
    vocabularyWords: VocabularyWordItem[];
    vocabularyAttempts: VocabularyAttempt[];
    homeworkQuestions: HomeworkQuestionItem[];
    homeworkAttempts: HomeworkQuestionAttempt[];
    readingPassages: ReadingPassageItem[];
    readingQuizAttempts: ReadingQuizAttempt[];
    metrics?: StudyCenterMetrics | null;
  };
  notes?: AdvisorNote[];
};

export const AI_DISCLAIMER =
  "以下内容由 AI 生成，仅供参考；如涉及重要申请决策，请与顾问确认。";

function sanitizeAsciiSecret(value: string) {
  return value.replace(/[^\x21-\x7e]+/g, "");
}

function toAuthorizationHeader(apiKey: string) {
  if (/^Bearer\s+/i.test(apiKey)) {
    return apiKey;
  }

  return `Bearer ${apiKey}`;
}

export function getAiProviderConfig() {
  const baseUrl = (process.env.ANTHROPIC_BASE_URL || "https://api.minimaxi.com/anthropic").trim();
  const rawApiKey = (process.env.ANTHROPIC_API_KEY || process.env.MINIMAX_API_KEY || "").trim();
  const apiKey = sanitizeAsciiSecret(rawApiKey);
  const model = (process.env.TERRA_AI_MODEL || "MiniMax-M2.7").trim();
  const mode = (process.env.TERRA_AI_PROVIDER || "auto").trim();
  const promptVersion = (process.env.TERRA_AI_PROMPT_VERSION || "minimax-m2.7-v1").trim();
  const ready = Boolean(apiKey);

  return {
    provider:
      mode === "mock" ? ("mock" as const) : ready ? ("minimax_anthropic" as const) : ("mock" as const),
    mode,
    ready,
    baseUrl,
    apiKey,
    model,
    promptVersion,
  };
}

function createMiniMaxStageError(stage: string, message: string) {
  return new Error(`[MiniMax:${stage}] ${message}`);
}

function previewText(value: string, limit = 120) {
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

function assertHeaderByteString(name: string, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code > 255) {
      throw createMiniMaxStageError(
        "header_validation",
        `Header ${name} contains non-ByteString character ${code} at index ${index}.`
      );
    }
  }
}

export async function generateRecommendationPayload(input: {
  page: string;
  feature: string;
  prompt: string;
  student: StudentRecord | null;
  applicationProfile?: StudentApplicationProfile | null;
  tasks: Task[];
  milestones?: Milestone[];
  studyCenter?: StudentContextPayload["studyCenter"];
  notes?: AdvisorNote[];
}) {
  const config = getAiProviderConfig();

  if (config.provider === "mock") {
    return buildMockRecommendationPayload(config.promptVersion, input);
  }

  const workflowInstruction = getRecommendationInstruction(input.feature);
  const response = await callMiniMaxJson<{
    summary: string;
    recommendations: string[];
    sources: string[];
  }>({
    system: [
      "你是 Terra Edu 的留学规划 AI 助手。",
      "你必须只根据给定资料回答，不能杜撰背景、分数、成绩、录取结果或学校政策。",
      "输出必须为简体中文。",
      "语气要实用、温和、清晰，避免空话和绝对化承诺。",
      "如信息不足，要明确说信息不足，并给出保守建议。",
      "只返回 JSON，键名必须是 summary、recommendations、sources。",
    ].join(""),
    user: [
      `页面：${input.page}`,
      `功能：${input.feature}`,
      `用户请求：${input.prompt}`,
      `输出要求：${workflowInstruction}`,
      "",
      buildFullStudentContext(input),
      "",
      '返回 JSON：{"summary":"string","recommendations":["string"],"sources":["string"]}',
    ].join("\n"),
    maxTokens: 1400,
  });

  return {
    provider: config.provider,
    model: response.model || config.model,
    promptVersion: config.promptVersion,
    summary: normalizeString(response.data.summary, "AI 已生成建议，请结合当前任务和顾问意见一起判断。"),
    recommendations: normalizeStringList(response.data.recommendations, 5),
    sources: ["学生资料", "申请档案", "任务清单", "截止日期"],
  };
}

export async function generateChatSummary(input: {
  question: string;
  audience: UserRole;
  student: StudentRecord | null;
  applicationProfile?: StudentApplicationProfile | null;
  tasks: Task[];
  milestones?: Milestone[];
  studyCenter?: StudentContextPayload["studyCenter"];
  notes?: AdvisorNote[];
}) {
  const config = getAiProviderConfig();

  if (config.provider === "mock") {
    return {
      provider: config.provider,
      model: "mock-simulated",
      promptVersion: config.promptVersion,
      summary: buildMockChatSummary(input.audience, input.student?.name ?? "这位同学"),
      sources: ["学生资料", "申请档案", "任务清单"],
    };
  }

  const response = await callMiniMaxJson<{
    summary: string;
    sources: string[];
  }>({
    system: [
      getChatRoleInstruction(input.audience),
      "必须只根据给定资料回答，不能虚构申请结果、分数或学校政策。",
      "如果学生表达焦虑、害怕问顾问、任务太多，请先安抚，再给可执行建议，并温和建议和顾问沟通。",
      "禁止承诺录取结果，禁止医学或心理诊断。",
      "输出必须为简体中文。",
      "只返回 JSON，键名必须是 summary、sources。",
    ].join(""),
    user: [
      `学生问题：${input.question}`,
      `回答对象：${input.audience === "student" ? "学生本人" : input.audience === "parent" ? "家长" : "顾问"}`,
      getChatStructureInstruction(input.audience),
      "",
      buildFullStudentContext(input),
      "",
      '返回 JSON：{"summary":"string","sources":["string"]}',
    ].join("\n"),
    maxTokens: 1100,
  });

  return {
    provider: config.provider,
    model: response.model || config.model,
    promptVersion: config.promptVersion,
    summary: normalizeString(response.data.summary, "AI 已生成回答，请结合你的真实进度和顾问建议一起参考。"),
    sources: ["学生资料", "申请档案", "任务清单", "截止日期", "学习中心记录", "顾问备注"],
  };
}

export async function generateHomeworkGradingAnalysis(input: {
  student: StudentRecord | null;
  applicationProfile?: StudentApplicationProfile | null;
  assignmentTitle: string;
  promptContent: string;
  studentAnswer: string;
  referenceAnswer?: string;
}) {
  const config = getAiProviderConfig();

  if (config.provider === "mock") {
    return {
      provider: config.provider,
      model: "mock-simulated",
      promptVersion: config.promptVersion,
      overallEvaluation: "整体完成度不错，中心观点清楚，但论证深度和例子支撑还有提升空间。",
      errorAnalysis: "主要问题在于例子不够具体、论证链条略短，以及段落衔接句还不够自然。",
      remediationPlan: "先把每一段的中心句写清，再为每段补一个更具体的例子，同时检查连接句是否真的推动了逻辑。",
      nextStep: "下一版优先补强例子和段落连接，再回头压缩重复表达。",
    };
  }

  const response = await callMiniMaxJson<{
    overallEvaluation: string;
    errorAnalysis: string;
    remediationPlan: string;
    nextStep: string;
  }>({
    system: [
      "你是 Terra Edu 的 AI 阅读出题助手。",
      "你要根据学生提供的题目、答案以及可选参考答案/老师批注给出结构化反馈。",
      "输出必须为简体中文。",
      "不能杜撰额外作业要求、评分标准或外部背景。",
      "只返回 JSON，键名必须是 overallEvaluation、errorAnalysis、remediationPlan、nextStep。",
    ].join(""),
    user: [
      `作业标题：${input.assignmentTitle}`,
      buildStudentContext(input.student),
      buildApplicationProfileContext(input.applicationProfile),
      `题目内容：${input.promptContent}`,
      `学生答案：${input.studentAnswer}`,
      `可选标准答案/老师批注：${input.referenceAnswer || "未提供"}`,
      '返回 JSON：{"overallEvaluation":"string","errorAnalysis":"string","remediationPlan":"string","nextStep":"string"}',
    ].join("\n\n"),
    maxTokens: 1500,
  });

  return {
    provider: config.provider,
    model: response.model || config.model,
    promptVersion: config.promptVersion,
    overallEvaluation: normalizeString(response.data.overallEvaluation, "整体完成度较稳定，但还需要继续补强论证和表达。"),
    errorAnalysis: normalizeString(response.data.errorAnalysis, "主要问题集中在表达不够具体和逻辑支撑不足。"),
    remediationPlan: normalizeString(response.data.remediationPlan, "建议先补齐关键例子，再检查论证链条是否完整。"),
    nextStep: normalizeString(response.data.nextStep, "下一步先根据批改结果完成一轮针对性重写。"),
  };
}

export async function generateReadingQuiz(input: {
  student: StudentRecord | null;
  applicationProfile?: StudentApplicationProfile | null;
  title: string;
  passage: string;
}) {
  const config = getAiProviderConfig();

  if (config.provider === "mock") {
    return {
      provider: config.provider,
      model: "mock-simulated",
      promptVersion: config.promptVersion,
      questions: buildMockReadingQuiz(input.title),
    };
  }

  const response = await callMiniMaxJson<{
    questions: Array<{
      stem: string;
      options: string[];
      answerIndex: number;
      explanation: string;
    }>;
  }>({
    system: [
      "你是 Terra Edu 的阅读题生成助手。",
      "你必须根据给定文章内容生成 5 道四选一选择题。",
      "题目要覆盖主旨、细节、推断、词义或结构理解，但不要超出原文信息。",
      "输出必须为简体中文。",
      "只返回 JSON，键名必须是 questions。",
      "每道题必须包含 stem、options、answerIndex、explanation。",
      "options 必须是 4 个选项，answerIndex 必须是 0 到 3 的整数。",
    ].join(""),
    user: [
      `文章标题：${input.title}`,
      buildStudentContext(input.student),
      buildApplicationProfileContext(input.applicationProfile),
      `文章内容：${input.passage}`,
      '返回 JSON：{"questions":[{"stem":"string","options":["A","B","C","D"],"answerIndex":0,"explanation":"string"}]}',
    ].join("\n\n"),
    maxTokens: 2200,
  });

  const questions = (response.data.questions ?? [])
    .map((question) => ({
      stem: normalizeString(question.stem, "这篇文章最主要的观点是什么？"),
      options: Array.isArray(question.options) ? question.options.map((item) => normalizeString(item, "")).filter(Boolean).slice(0, 4) : [],
      answerIndex: Number(question.answerIndex ?? 0),
      explanation: normalizeString(question.explanation, "答案依据文章内容判断。"),
    }))
    .filter((question) => question.options.length === 4 && question.answerIndex >= 0 && question.answerIndex < 4)
    .slice(0, 5);

  return {
    provider: config.provider,
    model: response.model || config.model,
    promptVersion: config.promptVersion,
    questions: questions.length === 5 ? questions : buildMockReadingQuiz(input.title),
  };
}

export async function generateTaskBreakdown(input: {
  goal: string;
  student: StudentRecord | null;
  applicationProfile?: StudentApplicationProfile | null;
  tasks: Task[];
  milestones?: Milestone[];
}) {
  const config = getAiProviderConfig();

  if (config.provider === "mock") {
    return {
      provider: config.provider,
      model: "mock-simulated",
      promptVersion: config.promptVersion,
      title: "任务拆解建议",
      summary: `下面是针对“${input.goal}”的一个稳妥拆解版本，先把任务拆小，再按先后顺序推进。`,
      steps: [
        "先确认这件事的最终交付物是什么，以及最晚什么时候必须完成。",
        "把准备材料列出来，缺什么先补什么。",
        "先完成最关键的第一稿或第一版输出，不追求一次完美。",
        "预留一轮检查和修改时间，避免最后一天集中返工。",
        "把需要顾问确认的部分单独标记出来，集中一次性沟通。",
      ],
      sources: ["学生资料", "当前任务", "截止日期"],
    };
  }

  const response = await callMiniMaxJson<{
    title: string;
    summary: string;
    steps: string[];
    sources: string[];
  }>({
    system: [
      "你是 Terra Edu 的任务拆解助手。",
      "你要把学生输入的大任务拆成清晰的小步骤。",
      "输出必须为简体中文，适合学生直接照着执行。",
      "不能凭空增加不存在的考试分数、学校要求或外部政策。",
      "步骤要具体、顺序明确、避免空泛。",
      "只返回 JSON，键名必须是 title、summary、steps、sources。",
    ].join(""),
    user: [
      `需要拆解的大任务：${input.goal}`,
      "输出要求：给出 5-8 个步骤；步骤尽量以动作开头；不要直接修改系统任务，只生成建议。",
      "",
      buildFullStudentContext({
        student: input.student,
        applicationProfile: input.applicationProfile,
        tasks: input.tasks,
        milestones: input.milestones,
      }),
      "",
      '返回 JSON：{"title":"string","summary":"string","steps":["string"],"sources":["string"]}',
    ].join("\n"),
    maxTokens: 1200,
  });

  return {
    provider: config.provider,
    model: response.model || config.model,
    promptVersion: config.promptVersion,
    title: normalizeString(response.data.title, "任务拆解建议"),
    summary: normalizeString(response.data.summary, "AI 已根据当前资料生成任务拆解建议。"),
    steps: normalizeStringList(response.data.steps, 8),
    sources: ["学生资料", "申请档案", "当前任务", "截止日期"],
  };
}

export async function generateTranscriptSummary(input: {
  transcriptMarkdown: string;
  student: StudentRecord | null;
  applicationProfile?: StudentApplicationProfile | null;
}) {
  const config = getAiProviderConfig();

  if (config.provider === "mock") {
    return {
      provider: config.provider,
      model: "mock-simulated",
      promptVersion: config.promptVersion,
      summary: "已根据当前成绩单材料生成一版结构化摘要，可继续人工校对课程名、分数和学段。",
      parsedMarkdown: [
        "## Transcript Snapshot",
        "",
        "- **Source received:** yes",
        "- **Suggested next step:** manually verify course names and term labels",
        "",
        "## Raw Highlights",
        "",
        input.transcriptMarkdown.trim() || "_No transcript content provided._",
      ].join("\n"),
      sources: ["成绩单原文", "学生资料", "申请档案"],
    };
  }

  const response = await callMiniMaxJson<{
    summary: string;
    parsedMarkdown: string;
    sources: string[];
  }>({
    system: [
      "你是 Terra Edu 的成绩单整理助手。",
      "你的任务是把学生提供的 Markdown 成绩单原文整理成更清晰、可读、可继续校对的 Markdown。",
      "不能杜撰课程、成绩、学分、排名或 GPA。",
      "原文没有写的内容，不要补。",
      "输出必须为简体中文。",
      "只返回 JSON，键名必须是 summary、parsedMarkdown、sources。",
    ].join(""),
    user: [
      "请把下面的成绩单材料整理成结构化 Markdown。",
      "建议输出结构：总体说明、按学段或学年分组、课程与成绩列表、待确认项。",
      "",
      buildStudentContext(input.student),
      "",
      buildApplicationProfileContext(input.applicationProfile),
      "",
      "成绩单原文：",
      input.transcriptMarkdown,
      "",
      '返回 JSON：{"summary":"string","parsedMarkdown":"string","sources":["string"]}',
    ].join("\n"),
    maxTokens: 1800,
  });

  return {
    provider: config.provider,
    model: response.model || config.model,
    promptVersion: config.promptVersion,
    summary: normalizeString(response.data.summary, "AI 已生成一版成绩单整理结果，请人工核对后再使用。"),
    parsedMarkdown: normalizeString(
      response.data.parsedMarkdown,
      "## Transcript Snapshot\n\n暂无可整理内容，请补充更完整的成绩单 Markdown 原文。"
    ),
    sources: ["成绩单原文", "学生资料", "申请档案"],
  };
}

export async function generateConsultantWeeklyReport(input: StudentContextPayload) {
  const config = getAiProviderConfig();

  if (config.provider === "mock") {
    return {
      provider: config.provider,
      model: "mock-simulated",
      promptVersion: config.promptVersion,
      summary: `${input.student?.name ?? "该学生"}本周整体推进还算稳定，但高优先级任务需要更早前置，尤其要注意临近截止日期的项目。`,
      progress: [
        "近期仍有真实学习记录，学习节奏没有完全中断。",
        "任务完成度有基础，但关键任务还需要更聚焦的推进。",
      ],
      risks: [
        "如果最近两周高优先级任务继续堆积，学生容易出现拖延和压力上升。",
      ],
      nextActions: [
        "先确认最近一个截止日期前必须完成的材料。",
        "把下周任务压缩成 3 个最关键动作，由顾问确认优先级。",
        "必要时在下一次沟通中先处理学生的情绪和执行阻力。",
      ],
      sources: ["学生资料", "任务清单", "学习中心记录", "顾问备注"],
    };
  }

  const response = await callMiniMaxJson<{
    summary: string;
    progress: string[];
    risks: string[];
    nextActions: string[];
    sources: string[];
  }>({
    system: [
      "你是 Terra Edu 的顾问助手，输出对象是顾问本人。",
      "输出必须为正式、专业、克制的简体中文。",
      "你必须只根据给定资料总结，不得虚构会议内容、分数、申请结果或家庭情况。",
      "要特别关注任务完成率、截止日期压力、学习节奏和风险点。",
      "只返回 JSON，键名必须是 summary、progress、risks、nextActions、sources。",
    ].join(""),
    user: [
      "请生成这位学生的本周顾问周报。",
      "输出结构：1. 总结 2. 本周进展 3. 风险 4. 下周建议动作。",
      "",
      buildFullStudentContext(input),
      "",
      '返回 JSON：{"summary":"string","progress":["string"],"risks":["string"],"nextActions":["string"],"sources":["string"]}',
    ].join("\n"),
    maxTokens: 1400,
  });

  return {
    provider: config.provider,
    model: response.model || config.model,
    promptVersion: config.promptVersion,
    summary: normalizeString(response.data.summary, "AI 已生成本周顾问摘要。"),
    progress: normalizeStringList(response.data.progress, 4),
    risks: normalizeStringList(response.data.risks, 4),
    nextActions: normalizeStringList(response.data.nextActions, 4),
    sources: ["学生资料", "任务清单", "学习中心记录", "顾问备注"],
  };
}

export async function generateMeetingSummary(input: {
  student: StudentRecord | null;
  applicationProfile?: StudentApplicationProfile | null;
  transcript: string;
}) {
  const config = getAiProviderConfig();

  if (config.provider === "mock") {
    return {
      provider: config.provider,
      model: "mock-simulated",
      promptVersion: config.promptVersion,
      summary: "这次沟通主要围绕近期截止日期、学生执行节奏以及家长期待展开，整体方向明确，但后续跟进事项需要更具体。",
      studentFeedback: ["学生表示任务一多时会有压力，希望优先级更清晰一些。"],
      parentFeedback: ["家长更关注近期截止日期是否会延误，以及孩子是否保持稳定学习节奏。"],
      consultantAdvice: ["建议先收缩任务范围，聚焦近期最关键的 2-3 项工作。"],
      followUps: ["下次沟通前确认最近截止日期对应材料是否齐全。"],
      risks: ["如果优先级没有进一步收紧，学生可能继续出现执行分散。"],
      sources: ["会议转写文本"],
    };
  }

  const response = await callMiniMaxJson<{
    summary: string;
    studentFeedback: string[];
    parentFeedback: string[];
    consultantAdvice: string[];
    followUps: string[];
    risks: string[];
    sources: string[];
  }>({
    system: [
      "你是 Terra Edu 的顾问会议纪要助手。",
      "请把会议转写整理成结构化摘要。",
      "输出必须为正式、清晰的简体中文。",
      "只能基于转写内容和已给资料总结，不得虚构未说过的话。",
      "如果转写里没有某一类信息，可以返回“未明确提及”，但不要空着。",
      "只返回 JSON，键名必须是 summary、studentFeedback、parentFeedback、consultantAdvice、followUps、risks、sources。",
    ].join(""),
    user: [
      `学生：${input.student?.name ?? "未识别"}`,
      `当前阶段：${input.student?.phase ?? "未识别"}`,
      buildApplicationProfileContext(input.applicationProfile),
      "",
      "以下是会议转写内容：",
      input.transcript,
      "",
      '返回 JSON：{"summary":"string","studentFeedback":["string"],"parentFeedback":["string"],"consultantAdvice":["string"],"followUps":["string"],"risks":["string"],"sources":["string"]}',
    ].join("\n"),
    maxTokens: 1800,
  });

  return {
    provider: config.provider,
    model: response.model || config.model,
    promptVersion: config.promptVersion,
    summary: normalizeString(response.data.summary, "AI 已根据会议转写生成摘要。"),
    studentFeedback: normalizeStringList(response.data.studentFeedback, 4),
    parentFeedback: normalizeStringList(response.data.parentFeedback, 4),
    consultantAdvice: normalizeStringList(response.data.consultantAdvice, 4),
    followUps: normalizeStringList(response.data.followUps, 4),
    risks: normalizeStringList(response.data.risks, 4),
    sources: ["会议转写文本"],
  };
}

export async function generateParentWeeklySummary(input: StudentContextPayload) {
  const config = getAiProviderConfig();

  if (config.provider === "mock") {
    return {
      provider: config.provider,
      model: "mock-simulated",
      promptVersion: config.promptVersion,
      summary: `${input.student?.name ?? "学生"}本周整体处于持续推进状态，建议家长重点关注截止日期节奏和学习习惯，而不是频繁干预细节。`,
      progress: [
        "本周有可追踪的任务推进和学习记录。",
        "整体方向没有偏离当前申请阶段目标。",
      ],
      nextFocus: [
        "关注最近一个重要截止日期。",
        "帮助孩子保持固定学习时间和沟通节奏。",
      ],
      parentSupport: [
        "多做提醒和节奏支持，少做结果施压。",
      ],
      sources: ["学生资料", "任务清单", "学习中心记录", "顾问备注"],
    };
  }

  const response = await callMiniMaxJson<{
    summary: string;
    progress: string[];
    nextFocus: string[];
    parentSupport: string[];
    sources: string[];
  }>({
    system: [
      "你是 Terra Edu 的家长端进展总结助手。",
      "输出对象是家长，语气要正式、清楚、稳定，不制造焦虑。",
      "只能根据给定资料总结，不得承诺结果或虚构进展。",
      "输出必须为简体中文。",
      "只返回 JSON，键名必须是 summary、progress、nextFocus、parentSupport、sources。",
    ].join(""),
    user: [
      "请生成本周家长可查看的进展总结。",
      "输出结构：1. 总结 2. 本周进展 3. 下周重点 4. 家长可支持的方式。",
      "",
      buildFullStudentContext(input),
      "",
      '返回 JSON：{"summary":"string","progress":["string"],"nextFocus":["string"],"parentSupport":["string"],"sources":["string"]}',
    ].join("\n"),
    maxTokens: 1300,
  });

  return {
    provider: config.provider,
    model: response.model || config.model,
    promptVersion: config.promptVersion,
    summary: normalizeString(response.data.summary, "AI 已生成家长端每周总结。"),
    progress: normalizeStringList(response.data.progress, 4),
    nextFocus: normalizeStringList(response.data.nextFocus, 4),
    parentSupport: normalizeStringList(response.data.parentSupport, 4),
    sources: ["学生资料", "任务清单", "学习中心记录", "顾问备注"],
  };
}

function getChatRoleInstruction(audience: UserRole) {
  if (audience === "parent") {
    return "你是 Terra Edu 的家长沟通助手，面向家长回答，语气要正式、稳定、清楚，不制造焦虑。";
  }

  if (audience === "consultant") {
    return "你是 Terra Edu 的顾问分析助手，面向顾问回答，语气要专业、直接、可执行。";
  }

  return "你是 Terra Edu 的学生陪伴式规划助手，面向学生回答，语气要自然、温和、口语一点，但不能敷衍。";
}

function getChatStructureInstruction(audience: UserRole) {
  if (audience === "parent") {
    return "回答结构：1. 先概括当前情况。2. 给出 2-4 条家长可理解的重点。3. 最后给一句稳妥提醒。";
  }

  if (audience === "consultant") {
    return "回答结构：1. 先给判断。2. 给出 2-4 条顾问动作建议。3. 最后补一句风险提醒。";
  }

  return "回答结构：1. 先说这周最该做什么。2. 给出 2-4 条明确步骤。3. 最后给一句温和提醒。";
}

function buildMockChatSummary(audience: UserRole, studentName: string) {
  if (audience === "parent") {
    return [
      `${studentName}当前最需要的是保持节奏，而不是同时推进太多方向。`,
      "建议家长重点关注最近的截止日期、固定学习时间以及与顾问的同步频率。",
      "如果最近任务偏多，可以先帮助孩子把重点压缩到 2 到 3 件最关键的事情上。",
    ].join(" ");
  }

  if (audience === "consultant") {
    return [
      `${studentName}当前更适合收缩任务范围，优先处理最近的关键截止项。`,
      "建议先核对学生档案里的课程体系、竞赛和活动信息，再判断下周任务应该怎么排。",
      "如果高优任务还在堆积，下一次沟通应先处理执行阻力和节奏问题。",
    ].join(" ");
  }

  return [
    `${studentName}，这周先不要把所有事情一起抓，先盯最紧急的截止项和一件最关键的高优任务。`,
    "建议你先确认最近 7 天内最早到期的任务，然后给自己安排两个固定学习时段，先把最容易拖延的那件事推进到可以交付的程度。",
    "如果你现在有点慌，也没关系，先做完最关键的一步，再决定下一步。",
  ].join(" ");
}

async function callMiniMaxJson<T>({
  system,
  user,
  maxTokens,
}: {
  system: string;
  user: string;
  maxTokens: number;
}) {
  const config = getAiProviderConfig();

  if (!config.apiKey) {
    throw createMiniMaxStageError("config", "MiniMax API key is not configured.");
  }

  let endpoint = "";
  try {
    endpoint = new URL("v1/messages", ensureTrailingSlash(config.baseUrl)).toString();
  } catch (error) {
    throw createMiniMaxStageError(
      "endpoint",
      error instanceof Error ? error.message : "Failed to build MiniMax endpoint."
    );
  }

  const requestHeaders = {
    "Content-Type": "application/json",
    Authorization: toAuthorizationHeader(config.apiKey),
    "anthropic-version": "2023-06-01",
  };

  try {
    Object.entries(requestHeaders).forEach(([name, value]) => assertHeaderByteString(name, value));
  } catch (error) {
    structuredLog({
      level: "error",
      source: "minimax",
      stage: "header_validation",
      endpoint,
      model: config.model,
      prompt_preview: previewText(user, 80),
      error: error instanceof Error ? error.message : "Unknown header validation error",
    });
    throw error;
  }

  let requestBody = "";
  try {
    requestBody = JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      temperature: 0.4,
      system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: user,
            },
          ],
        },
      ],
    });
  } catch (error) {
    throw createMiniMaxStageError(
      "request_body",
      error instanceof Error ? error.message : "Failed to serialize MiniMax request body."
    );
  }

  let encodedBody: Blob;
  try {
    encodedBody = new Blob([new TextEncoder().encode(requestBody)], {
      type: "application/json",
    });
  } catch (error) {
    throw createMiniMaxStageError(
      "request_body_encode",
      error instanceof Error ? error.message : "Failed to encode MiniMax request body."
    );
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: requestHeaders,
      body: encodedBody,
    });
  } catch (error) {
    structuredLog({
      level: "error",
      source: "minimax",
      stage: "fetch_request",
      endpoint,
      model: config.model,
      prompt_preview: previewText(user, 80),
      error: error instanceof Error ? error.message : "Unknown fetch error",
    });
    throw createMiniMaxStageError(
      "fetch_request",
      error instanceof Error ? error.message : "MiniMax fetch failed before response."
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    structuredLog({
      level: "error",
      source: "minimax",
      stage: "response_status",
      endpoint,
      model: config.model,
      status: response.status,
      error: previewText(errorText, 200),
    });
    throw createMiniMaxStageError(
      "response_status",
      `MiniMax request failed: ${response.status} ${errorText}`
    );
  }

  let payload: AnthropicMessagesResponse;
  try {
    payload = (await response.json()) as AnthropicMessagesResponse;
  } catch (error) {
    throw createMiniMaxStageError(
      "response_json",
      error instanceof Error ? error.message : "Failed to parse MiniMax JSON response."
    );
  }

  let text = "";
  try {
    text = extractText(payload);
  } catch (error) {
    throw createMiniMaxStageError(
      "response_text",
      error instanceof Error ? error.message : "Failed to extract MiniMax text content."
    );
  }
  const parsed = safeJsonParse<T>(text);

  if (!parsed) {
    structuredLog({
      level: "error",
      source: "minimax",
      stage: "response_shape",
      endpoint,
      model: payload.model || config.model,
      text_preview: previewText(text, 240),
    });
    throw createMiniMaxStageError("response_shape", "MiniMax returned non-JSON content.");
  }

  return {
    model: payload.model,
    data: parsed,
  };
}

function buildMockRecommendationPayload(
  promptVersion: string,
  input: {
    feature: string;
    student: StudentRecord | null;
    applicationProfile?: StudentApplicationProfile | null;
    tasks: Task[];
    milestones?: Milestone[];
  }
) {
  const pendingTasks = input.tasks.filter((task) => task.status !== "done");
  const nearestTask = sortTasksByDate(pendingTasks)[0];
  const nearestMilestone = sortMilestonesByDate(input.milestones ?? [])[0];
  const studentName = input.student?.name ?? "这位同学";

  const configMap: Record<string, { summary: string; recommendations: string[] }> = {
    student_dashboard_recommendation: {
      summary: `${studentName}这周最重要的不是把所有事情都做一点，而是先把最近的关键节点推进到可交付状态。`,
      recommendations: [
        `优先处理“${nearestTask?.title ?? "最近的高优先级任务"}”，先推进出一个可检查的版本。`,
        "把本周安排压缩成 3 件最关键的事，减少来回切换。",
        `如果最近有截止日期${nearestMilestone ? `（${nearestMilestone.title}）` : ""}，请先预留一次检查时间，避免临期返工。`,
      ],
    },
    student_explore_recommendation: {
      summary: `${studentName}当前更适合继续围绕既定目标学校和专业做聚焦探索，而不是同时打开太多方向。`,
      recommendations: [
        "先从最匹配的 2-3 个学校或项目切入，集中比较课程、申请要求和活动匹配度。",
        "把探索结果和当前任务关联起来，避免只看信息、不形成行动。",
        "如果发现方向开始发散，先回到目标国家、梦校和专业这三个主轴。 ",
      ],
    },
    student_profile_ai_twin: {
      summary: `${studentName}目前的画像已经能支持稳定规划，但还需要把目标、任务节奏和学习证据进一步对齐。`,
      recommendations: [
        "优先保证目标学校、国家和专业信息始终和当前计划一致。",
        "保持稳定训练记录，让后续建议基于真实证据而不是猜测。",
        "把下一阶段最重要的 1-2 个目标说清楚，方便顾问和家长同步理解。",
      ],
    },
  };

  const selected = configMap[input.feature] ?? configMap.student_dashboard_recommendation;

  return {
    provider: "mock" as const,
    model: "mock-simulated",
    promptVersion,
    summary: selected.summary,
    recommendations: selected.recommendations,
    sources: ["学生资料", "申请档案", "任务清单", "截止日期"],
  };
}

function getRecommendationInstruction(feature: string) {
  if (feature === "student_dashboard_recommendation") {
    return "请生成本周行动建议。summary 先概括本周重点；recommendations 输出 3-5 条明确行动，优先考虑最近截止日期、任务优先级和学习节奏。";
  }

  if (feature === "student_explore_recommendation") {
    return "请生成探索建议。summary 概括探索方向；recommendations 输出 3-5 条适合当前学生的学校/专业/活动探索建议，避免空泛。";
  }

  if (feature === "student_profile_ai_twin") {
    return "请生成学生档案摘要。summary 概括学生当前画像；recommendations 输出 3-5 条后续完善建议。";
  }

  return "请生成中等长度、清晰、实用的中文建议。";
}

function buildFullStudentContext(input: StudentContextPayload) {
  return [
    buildStudentContext(input.student),
    buildApplicationProfileContext(input.applicationProfile),
    buildTaskContext(input.tasks ?? []),
    buildMilestoneContext(input.milestones ?? []),
    buildStudyCenterContext(input.studyCenter),
    buildAdvisorNoteContext(input.notes ?? []),
    buildDerivedSignals(input.tasks ?? [], input.milestones ?? [], input.studyCenter),
  ].join("\n\n");
}

function buildMockReadingQuiz(title: string): ReadingQuizQuestion[] {
  return [
    {
      stem: `关于《${title}》，文章的核心主题最可能是什么？`,
      options: ["介绍一个中心现象及其影响", "记录作者的个人经历", "比较两位科学家的观点", "预测未来十年的经济趋势"],
      answerIndex: 0,
      explanation: "文章通常围绕一个中心主题展开，再说明影响与条件。",
    },
    {
      stem: "根据文章内容，下列哪项最可能被作者用来支持主观点？",
      options: ["一个具体研究发现", "一个与主题无关的历史故事", "完全脱离原文的假设", "作者的情绪表达"],
      answerIndex: 0,
      explanation: "支持主观点通常依赖文章中给出的研究或事实依据。",
    },
    {
      stem: "如果文中提到某项措施效果有限，最可能的原因是什么？",
      options: ["实施条件和环境分布不同", "文章没有给任何信息", "作者突然更换立场", "读者理解错误"],
      answerIndex: 0,
      explanation: "阅读材料常通过条件限制来说明措施并非在所有场景都同样有效。",
    },
    {
      stem: "文中某个专业词汇最可能在文中承担什么作用？",
      options: ["界定核心概念", "转移话题", "制造悬念", "补充人物描写"],
      answerIndex: 0,
      explanation: "专业词通常用于定义或精确说明核心概念。",
    },
    {
      stem: "下列哪项最符合文章的整体结构？",
      options: ["提出现象，再解释原因与限制", "先讲故事，再给结论", "按时间顺序记录人物成长", "只罗列数据，没有观点"],
      answerIndex: 0,
      explanation: "说明文常采用提出现象、解释机制、补充限制条件的结构。",
    },
  ];
}

function buildStudentContext(student: StudentRecord | null) {
  if (!student) {
    return "学生资料：暂无";
  }

  return [
    "学生资料：",
    `- 姓名：${student.name}`,
    `- 年级：${student.grade}`,
    `- 当前学校：${student.school}`,
    `- 当前阶段：${student.phase}`,
    `- 目标国家：${student.targetCountries.join("、") || "未填写"}`,
    `- 梦校：${student.dreamSchools.join("、") || "未填写"}`,
    `- 目标专业：${student.intendedMajor || "未填写"}`,
  ].join("\n");
}

function buildApplicationProfileContext(profile?: StudentApplicationProfile | null) {
  if (!profile) {
    return "申请档案：暂无";
  }

  const competitionHighlights = profile.competitions
    .filter((item) => item.name.trim())
    .slice(0, 5)
    .map((item) => `${item.name}${item.result ? `（${item.result}）` : ""}`);
  const activityHighlights = profile.activities
    .filter((item) => item.name.trim())
    .slice(0, 6)
    .map((item) => `${item.name}${item.role ? `（${item.role}）` : ""}`);

  return [
    "申请档案：",
    `- 法定姓名：${[profile.legalFirstName, profile.legalLastName].filter(Boolean).join(" ").trim() || "未填写"}`,
    `- 常用姓名：${profile.preferredName || "未填写"}`,
    `- 国籍：${profile.citizenship || "未填写"}`,
    `- 护照国家：${profile.passportCountry || "未填写"}`,
    `- 当前高中：${profile.highSchoolName || "未填写"}`,
    `- 课程体系：${profile.curriculumSystem || "未填写"}`,
    `- 毕业年份：${profile.graduationYear || "未填写"}`,
    `- GPA：${profile.gpa || "未填写"}`,
    `- 年级排名：${profile.classRank || "未填写"}`,
    `- 竞赛亮点：${competitionHighlights.join("、") || "未填写"}`,
    `- 活动亮点：${activityHighlights.join("、") || "未填写"}`,
    `- 成绩单整理：${profile.transcriptStructuredMarkdown ? clipForContext(profile.transcriptStructuredMarkdown, 900) : "暂无"}`,
    `- 长规划书：${profile.planningBookMarkdown ? clipForContext(profile.planningBookMarkdown, 1800) : "暂无"}`,
  ].join("\n");
}

function buildTaskContext(tasks: Task[]) {
  if (tasks.length === 0) {
    return "任务：暂无";
  }

  return [
    "任务：",
    ...sortTasksByDate(tasks)
      .slice(0, 12)
      .map(
        (task) =>
          `- ${task.title}｜状态：${translateTaskStatus(task.status)}｜优先级：${task.priority}｜开始：${task.startDate}｜截止：${task.dueDate}`
      ),
  ].join("\n");
}

function buildMilestoneContext(milestones: Milestone[]) {
  if (milestones.length === 0) {
    return "截止日期：暂无";
  }

  return [
    "截止日期：",
    ...sortMilestonesByDate(milestones)
      .slice(0, 10)
      .map((milestone) => `- ${milestone.title}｜日期：${milestone.eventDate}｜状态：${milestone.status === "done" ? "已完成" : "待处理"}`),
  ].join("\n");
}

function buildStudyCenterContext(studyCenter?: StudentContextPayload["studyCenter"]) {
  if (!studyCenter) {
    return "学习中心记录：暂无";
  }

  const vocabularySummary =
    studyCenter.vocabularyPacks.length > 0
      ? studyCenter.vocabularyPacks
          .slice(0, 5)
          .map((pack) => {
            const packWords = studyCenter.vocabularyWords.filter((word) => word.packId === pack.id);
            const dueCount = packWords.filter((word) => word.nextReviewOn).length;
            return `${pack.name}｜词量 ${pack.totalWords}｜每日新词 ${pack.dailyNewCount}｜每日复习 ${pack.dailyReviewCount}｜已开启复习 ${dueCount}`;
          })
          .join("；")
      : "暂无";

  const gradingSummary =
    studyCenter.homeworkAttempts.length > 0
      ? studyCenter.homeworkAttempts
          .slice(0, 3)
          .map((record) => `${record.date}｜${record.subject}｜作答 ${record.correct ? "正确" : "待改进"}｜${clipForContext(record.studentAnswer, 60)}`)
          .join("；")
      : "暂无";

  const readingSummary =
    studyCenter.readingQuizAttempts.length > 0
      ? studyCenter.readingQuizAttempts
          .slice(0, 5)
          .map(
            (record) =>
              `${record.date}｜${record.title}｜${record.correctCount}/${record.totalQuestions}｜${record.perfect ? "全对" : "继续练习"}`
          )
          .join("；")
      : "暂无";

  return [
    "学习中心记录：",
    `- 单词背诵：${vocabularySummary}`,
    `- AI出题批改：${gradingSummary}`,
    `- 应试阅读：${readingSummary}`,
  ].join("\n");
}

function buildAdvisorNoteContext(notes: AdvisorNote[]) {
  if (notes.length === 0) {
    return "顾问备注：暂无";
  }

  return [
    "顾问备注：",
    ...notes
      .slice(0, 6)
      .map((note) => `- ${note.createdAt.slice(0, 10)}｜${note.title}｜${note.summary}`),
  ].join("\n");
}

function buildDerivedSignals(
  tasks: Task[],
  milestones: Milestone[],
  studyCenter?: StudentContextPayload["studyCenter"]
) {
  const pendingTasks = tasks.filter((task) => task.status !== "done");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");
  const completedTasks = tasks.filter((task) => task.status === "done");
  const nearestMilestone = sortMilestonesByDate(
    milestones.filter((milestone) => milestone.status !== "done")
  )[0];
  const latestActivity = [
    ...(studyCenter?.vocabularyAttempts ?? []).map((record) => ({ date: record.date, label: `${record.prompt}｜单词背诵` })),
    ...(studyCenter?.homeworkAttempts ?? []).map((record) => ({ date: record.date, label: `${record.subject}｜AI出题批改` })),
    ...(studyCenter?.readingQuizAttempts ?? []).map((record) => ({ date: record.date, label: `${record.title}｜应试阅读` })),
  ].sort((left, right) => right.date.localeCompare(left.date))[0];

  return [
    "衍生信号：",
    `- 未完成任务数：${pendingTasks.length}`,
    `- 进行中任务数：${inProgressTasks.length}`,
    `- 已完成任务数：${completedTasks.length}`,
    `- 最近待处理截止日期：${nearestMilestone ? `${nearestMilestone.title}（${nearestMilestone.eventDate}）` : "暂无"}`,
    `- 最近一次学习动作：${latestActivity ? `${latestActivity.date}｜${latestActivity.label}` : "暂无"}`,
    `- 连续学习天数：${studyCenter?.metrics?.streakDays ?? 0}`,
    `- 最近 7 天训练次数：${studyCenter?.metrics?.recentSessionCount ?? 0}`,
  ].join("\n");
}

function sortTasksByDate(tasks: Task[]) {
  return [...tasks].sort((left, right) => left.dueDate.localeCompare(right.dueDate));
}

function sortMilestonesByDate(milestones: Milestone[]) {
  return [...milestones].sort((left, right) => left.eventDate.localeCompare(right.eventDate));
}

function translateTaskStatus(status: Task["status"]) {
  if (status === "done") return "已完成";
  if (status === "in_progress") return "进行中";
  return "待开始";
}

function extractText(payload: AnthropicMessagesResponse) {
  return (payload.content || [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text?.trim() || "")
    .filter(Boolean)
    .join("\n");
}

function clipForContext(value: string, maxLength: number) {
  const compact = value.replace(/\n{3,}/g, "\n\n").trim();
  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength)}...`;
}

function safeJsonParse<T>(value: string) {
  const direct = tryParse<T>(value);
  if (direct) return direct;

  const fenced = value.match(/```json\s*([\s\S]*?)```/i)?.[1];
  if (fenced) {
    const parsed = tryParse<T>(fenced);
    if (parsed) return parsed;
  }

  const objectMatch = value.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    return tryParse<T>(objectMatch[0]);
  }

  return null;
}

function tryParse<T>(value: string) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeString(value: unknown, fallback: string) {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function normalizeStringList(value: unknown, limit: number) {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    if (items.length > 0) {
      return items.slice(0, limit);
    }
  }

  const text = String(value ?? "").trim();
  if (!text) {
    return [];
  }

  return text
    .split(/[\n；;]+/)
    .map((item) => item.replace(/^[\-\d.\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, limit);
}
