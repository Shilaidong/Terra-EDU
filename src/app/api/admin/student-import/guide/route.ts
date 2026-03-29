import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { createTraceContext } from "@/lib/observability";
import { getSession } from "@/lib/session";

export async function GET() {
  const trace = createTraceContext();
  const session = await getSession();

  if (!session || session.role !== "admin") {
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

  const filePath = path.join(process.cwd(), "docs", "student-import-standard.md");
  const content = await readFile(filePath, "utf8");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'inline; filename="student-import-standard.md"',
    },
  });
}
