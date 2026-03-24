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
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  const imported = createImportedContentItems(
    rows.map((row) => ({
      type: normalizeType(row.type),
      title: row.title ?? "Untitled import",
      subtitle: row.subtitle ?? "Imported item",
      country: row.country,
      tags: row.tags ? row.tags.split(",").map((item) => item.trim()) : [],
      difficulty: normalizeDifficulty(row.difficulty),
      status: normalizeStatus(row.status),
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

function normalizeType(value?: string) {
  const lookup = value?.toLowerCase();
  if (lookup === "course" || lookup === "chapter" || lookup === "competition" || lookup === "school" || lookup === "major") {
    return lookup;
  }
  return "course";
}

function normalizeDifficulty(value?: string) {
  if (value === "Safety" || value === "Match" || value === "Reach") {
    return value;
  }
  return "Match";
}

function normalizeStatus(value?: string) {
  if (value === "published" || value === "draft") {
    return value;
  }
  return "draft";
}
