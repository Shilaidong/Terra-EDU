import type { StudentRecord, Task } from "@/lib/types";

export type TerraAiProvider = "mock" | "minimax_anthropic";

type AnthropicContentBlock = {
  type: string;
  text?: string;
};

type AnthropicMessagesResponse = {
  id?: string;
  model?: string;
  content?: AnthropicContentBlock[];
};

export function getAiProviderConfig() {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.minimaxi.com/anthropic";
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.MINIMAX_API_KEY || "";
  const model = process.env.TERRA_AI_MODEL || "MiniMax-M2.7";
  const mode = process.env.TERRA_AI_PROVIDER || "auto";
  const promptVersion = process.env.TERRA_AI_PROMPT_VERSION || "minimax-m2.7-v1";
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

export async function generateRecommendationPayload(input: {
  page: string;
  feature: string;
  prompt: string;
  student: StudentRecord | null;
  tasks: Task[];
}) {
  const config = getAiProviderConfig();

  if (config.provider === "mock") {
    const openTasks = input.tasks.filter((task) => task.status !== "done");
    return {
      provider: config.provider,
      model: "mock-simulated",
      promptVersion: config.promptVersion,
      summary: `${input.student?.name ?? "The student"} is strongest when concrete evidence leads the story. The current best move is to finish the highest-priority open task, maintain study consistency, and keep the application narrative focused.`,
      recommendations: [
        `Prioritize ${openTasks[0]?.title ?? "the next milestone-driven task"} before adding more reach activities.`,
        "Keep weekly mastery check-ins flowing so the consultant dashboard sees fresh learning evidence.",
        `Tie essay language back to ${input.student?.intendedMajor ?? "the primary academic direction"} for stronger narrative alignment.`,
      ],
      sources: ["student profile", "task queue", "content library"],
    };
  }

  const response = await callMiniMaxJson<{
    summary: string;
    recommendations: string[];
    sources: string[];
  }>({
    system:
      "You are Terra Edu's admissions planning assistant. Return only valid JSON with keys summary, recommendations, and sources. Keep recommendations concrete, practical, and short.",
    user: [
      `Page: ${input.page}`,
      `Feature: ${input.feature}`,
      `User request: ${input.prompt}`,
      "",
      buildStudentContext(input.student),
      "",
      buildTaskContext(input.tasks),
      "",
      "Return JSON:",
      '{"summary":"string","recommendations":["string"],"sources":["string"]}',
    ].join("\n"),
    maxTokens: 1200,
  });

  return {
    provider: config.provider,
    model: response.model || config.model,
    promptVersion: config.promptVersion,
    summary: response.data.summary,
    recommendations: response.data.recommendations.slice(0, 5),
    sources: response.data.sources.length > 0 ? response.data.sources : ["student profile", "task queue"],
  };
}

export async function generateChatSummary(input: {
  question: string;
  student: StudentRecord | null;
  tasks: Task[];
}) {
  const config = getAiProviderConfig();

  if (config.provider === "mock") {
    return {
      provider: config.provider,
      model: "mock-simulated",
      promptVersion: config.promptVersion,
      summary: `${input.student?.name ?? "The student"} should focus on the highest-priority application task, protect the study streak, and keep all updates visible to the consultant. This answer was generated in lightweight launch mode for reliability and traceability.`,
      sources: ["student profile", "task queue"],
    };
  }

  const response = await callMiniMaxJson<{
    summary: string;
    sources: string[];
  }>({
    system:
      "You are Terra Edu's student support assistant. Return only valid JSON with keys summary and sources. Keep the answer concise, practical, and supportive.",
    user: [
      `Student question: ${input.question}`,
      "",
      buildStudentContext(input.student),
      "",
      buildTaskContext(input.tasks),
      "",
      "Return JSON:",
      '{"summary":"string","sources":["string"]}',
    ].join("\n"),
    maxTokens: 900,
  });

  return {
    provider: config.provider,
    model: response.model || config.model,
    promptVersion: config.promptVersion,
    summary: response.data.summary,
    sources: response.data.sources.length > 0 ? response.data.sources : ["student profile", "task queue"],
  };
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
    throw new Error("MiniMax API key is not configured.");
  }

  const endpoint = new URL("v1/messages", ensureTrailingSlash(config.baseUrl)).toString();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      temperature: 1,
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MiniMax request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as AnthropicMessagesResponse;
  const text = extractText(payload);
  const parsed = safeJsonParse<T>(text);

  if (!parsed) {
    throw new Error("MiniMax returned non-JSON content.");
  }

  return {
    model: payload.model,
    data: parsed,
  };
}

function extractText(payload: AnthropicMessagesResponse) {
  const text = (payload.content || [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text?.trim() || "")
    .filter(Boolean)
    .join("\n");

  return text;
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

function buildStudentContext(student: StudentRecord | null) {
  if (!student) {
    return "Student profile: unavailable";
  }

  return [
    `Student name: ${student.name}`,
    `Grade: ${student.grade}`,
    `School: ${student.school}`,
    `Current phase: ${student.phase}`,
    `Target countries: ${student.targetCountries.join(", ") || "not set"}`,
    `Dream schools: ${student.dreamSchools.join(", ") || "not set"}`,
    `Intended major: ${student.intendedMajor}`,
  ].join("\n");
}

function buildTaskContext(tasks: Task[]) {
  if (tasks.length === 0) {
    return "Tasks: none";
  }

  return [
    "Tasks:",
    ...tasks.slice(0, 12).map(
      (task) =>
        `- ${task.title} | ${task.status} | ${task.priority} | ${task.timelineLane} | ${task.startDate} -> ${task.endDate}`
    ),
  ].join("\n");
}
