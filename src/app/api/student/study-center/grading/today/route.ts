import { NextResponse } from "next/server";

import { getCurrentStudentData, getStudentHomeworkTodayQuestion } from "@/lib/data";
import { createTraceContext } from "@/lib/observability";
import { getSession } from "@/lib/session";

export async function GET() {
  const trace = createTraceContext();
  const session = await getSession();
  if (!session || session.role !== "student") {
    return NextResponse.json({ success: false, message: "Unauthorized.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 401 });
  }

  const student = await getCurrentStudentData(session);
  if (!student) {
    return NextResponse.json({ success: false, message: "Student profile not found.", trace_id: trace.traceId, decision_id: trace.decisionId }, { status: 404 });
  }

  const data = await getStudentHomeworkTodayQuestion(student.id);
  return NextResponse.json({ success: true, data, trace_id: trace.traceId, decision_id: trace.decisionId });
}
