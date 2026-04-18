import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createStudentConsultantLink,
  createStudentParentLink,
  deleteStudentConsultantLink,
  deleteStudentParentLink,
  getStudentByIdData,
  getUserByIdData,
} from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  kind: z.enum(["parent", "consultant"]),
  studentId: z.string(),
  userId: z.string(),
});

const deleteSchema = z.object({
  kind: z.enum(["parent", "consultant"]),
  linkId: z.string(),
});

export async function POST(request: Request) {
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

  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Invalid binding payload.",
      },
      { status: 400 }
    );
  }

  const { kind, studentId, userId } = parsed.data;
  const student = await getStudentByIdData(studentId);
  const user = await getUserByIdData(userId);

  if (!student || !user) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Student or user not found.",
      },
      { status: 404 }
    );
  }

  if ((kind === "parent" && user.role !== "parent") || (kind === "consultant" && user.role !== "consultant")) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Role mismatch for requested binding.",
      },
      { status: 400 }
    );
  }

  const link =
    kind === "parent"
      ? await createStudentParentLink(studentId, userId)
      : await createStudentConsultantLink(studentId, userId);

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/admin/dashboard",
    action: kind === "parent" ? "parent_bound_to_student" : "consultant_bound_to_student",
    targetType: kind === "parent" ? "student_parent_link" : "student_consultant_link",
    targetId: link.id,
    status: "success",
    inputSummary: `${user.email} -> ${student.name}`,
    outputSummary: "Binding saved",
  });

  return NextResponse.json({
    success: true,
    entity_id: link.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Binding saved.",
    data: link,
  });
}

export async function DELETE(request: Request) {
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

  const parsed = deleteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Invalid binding removal payload.",
      },
      { status: 400 }
    );
  }

  const { kind, linkId } = parsed.data;
  const link =
    kind === "parent" ? await deleteStudentParentLink(linkId) : await deleteStudentConsultantLink(linkId);

  if (!link) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Binding not found.",
      },
      { status: 404 }
    );
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/admin/dashboard",
    action: kind === "parent" ? "parent_unbound_from_student" : "consultant_unbound_from_student",
    targetType: kind === "parent" ? "student_parent_link" : "student_consultant_link",
    targetId: link.id,
    status: "success",
    inputSummary: link.id,
    outputSummary: "Binding removed",
  });

  return NextResponse.json({
    success: true,
    entity_id: link.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Binding removed.",
    data: link,
  });
}
