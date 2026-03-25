import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { createImportedContentItems } from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
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

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Missing spreadsheet file.",
      },
      { status: 400 }
    );
  }

  const buffer = await file.arrayBuffer();
  const workbook = readWorkbook(file, buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const imported = createImportedContentItems(
    rows.map((row) => ({
      type: normalizeType(row.type),
      title: asString(row.title) ?? "Untitled import",
      subtitle: asString(row.subtitle) ?? "Imported item",
      country: asString(row.country),
      tags: splitCsvCell(row.tags),
      difficulty: normalizeDifficulty(row.difficulty),
      status: "published",
      schoolDetails: normalizeType(row.type) === "school" ? {
        ranking: asString(pickRowValue(row, "ranking", "rank", "school_ranking", "排名")),
        city: asString(pickRowValue(row, "city", "school_city", "城市")),
        tuitionUsd: asNumber(pickRowValue(row, "tuition_usd", "tuitionUsd", "tuition", "学费")),
        acceptanceRate: asString(
          pickRowValue(row, "acceptance_rate", "acceptanceRate", "admission_rate", "录取率")
        ),
      } : undefined,
      majorDetails: normalizeType(row.type) === "major" ? {
        degree: asString(pickRowValue(row, "degree", "学位")),
        stemEligible: asBoolean(pickRowValue(row, "stem_eligible", "stemEligible", "stem", "STEM")),
        recommendedBackground: asString(
          pickRowValue(row, "recommended_background", "recommendedBackground", "background", "推荐背景")
        ),
        careerPaths: splitCsvCell(pickRowValue(row, "career_paths", "careerPaths", "就业方向")),
      } : undefined,
      competitionDetails: normalizeType(row.type) === "competition" ? {
        organizer: asString(pickRowValue(row, "organizer", "主办方")),
        eligibility: asString(pickRowValue(row, "eligibility", "参赛要求")),
        award: asString(pickRowValue(row, "award", "奖项")),
        season: asString(pickRowValue(row, "season", "赛季")),
      } : undefined,
      courseDetails: normalizeType(row.type) === "course" ? {
        provider: asString(pickRowValue(row, "provider", "课程提供方", "提供方")),
        format: normalizeCourseFormat(pickRowValue(row, "format", "形式")),
        durationWeeks: asNumber(pickRowValue(row, "duration_weeks", "durationWeeks", "周期", "周数")),
        workload: asString(pickRowValue(row, "workload", "学习强度")),
      } : undefined,
      chapterDetails: normalizeType(row.type) === "chapter" ? {
        curriculum: asString(pickRowValue(row, "curriculum", "课程体系", "所属课程")),
        sequence: asString(pickRowValue(row, "sequence", "顺序")),
        estimatedHours: asNumber(pickRowValue(row, "estimated_hours", "estimatedHours", "预计时长")),
        keySkill: asString(pickRowValue(row, "key_skill", "keySkill", "核心能力")),
      } : undefined,
    }))
  );

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/consultant/content",
    action: "content_imported",
    targetType: "spreadsheet",
    targetId: file.name,
    status: "success",
    inputSummary: `Imported ${rows.length} rows`,
    outputSummary: `${imported.length} content items created`,
  });

  return NextResponse.json({
    success: true,
    entity_id: file.name,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Spreadsheet imported.",
    data: {
      count: imported.length,
    },
  });
}

function normalizeType(value?: unknown) {
  const lookup = asString(value)?.toLowerCase();
  if (lookup === "course" || lookup === "chapter" || lookup === "competition" || lookup === "school" || lookup === "major") {
    return lookup;
  }
  return "course";
}

function normalizeDifficulty(value?: unknown) {
  if (value === "Safety" || value === "Match" || value === "Reach") {
    return value;
  }
  return "Match";
}

function normalizeCourseFormat(value?: unknown) {
  if (value === "Online" || value === "Offline" || value === "Hybrid") {
    return value;
  }
  return undefined;
}

function asString(value?: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return undefined;
}

function asNumber(value?: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function asBoolean(value?: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "y", "1"].includes(normalized)) return true;
    if (["false", "no", "n", "0"].includes(normalized)) return false;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  return undefined;
}

function splitCsvCell(value?: unknown) {
  const text = asString(value);
  return text ? text.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function pickRowValue(row: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (key in row && row[key] != null && `${row[key]}`.trim() !== "") {
      return row[key];
    }
  }
  return undefined;
}

function readWorkbook(file: File, buffer: ArrayBuffer) {
  if (file.name.toLowerCase().endsWith(".csv")) {
    const csvText = decodeCsvText(buffer);
    return XLSX.read(csvText, { type: "string" });
  }

  return XLSX.read(buffer, { type: "array" });
}

function decodeCsvText(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("gb18030").decode(bytes);
  }
}
