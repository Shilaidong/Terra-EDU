import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentStudentData, importVocabularyPack } from "@/lib/data";
import { asNumber, asString, readFirstSheetRows, readWorkbook } from "@/lib/study-center-import";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  studentId: z.string(),
  packName: z.string().min(1),
  dailyNewCount: z.coerce.number().min(1).max(200),
  dailyReviewCount: z.coerce.number().min(1).max(400),
});

export async function POST(request: Request) {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session || session.role !== "student") {
    return NextResponse.json({ success: false, message: "Unauthorized.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const parsed = schema.safeParse({
    studentId: formData.get("studentId"),
    packName: formData.get("packName"),
    dailyNewCount: formData.get("dailyNewCount"),
    dailyReviewCount: formData.get("dailyReviewCount"),
  });

  if (!(file instanceof File) || !parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid vocabulary import payload.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }
  if (student.id !== parsed.data.studentId) {
    return NextResponse.json({ success: false, message: "Forbidden.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 403 });
  }

  const workbook = readWorkbook(file, await file.arrayBuffer());
  const rows = readFirstSheetRows(workbook)
    .map((row) => ({
      word: asString(row.word),
      meaning: asString(row.meaning),
      notes: asString(row.notes),
    }))
    .filter((row) => row.word && row.meaning);

  if (rows.length === 0) {
    return NextResponse.json({ success: false, message: "Template is empty. Please fill word and meaning columns.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 400 });
  }

  const imported = await importVocabularyPack({
    studentId: student.id,
    name: parsed.data.packName,
    dailyNewCount: parsed.data.dailyNewCount,
    dailyReviewCount: parsed.data.dailyReviewCount,
    words: rows,
  });

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/student/checkin",
    action: "study_center_vocabulary_imported",
    targetType: "vocabulary_pack",
    targetId: imported.pack.id,
    status: "success",
    inputSummary: `${parsed.data.packName} · ${rows.length} words`,
    outputSummary: "Vocabulary pack imported",
  });

  return NextResponse.json({
    success: true,
    data: imported,
    message: "Vocabulary pack imported.",
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    entity_id: imported.pack.id,
  });
}
