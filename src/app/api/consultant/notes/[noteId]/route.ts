import { NextResponse } from "next/server";
import { z } from "zod";

import {
  deleteAdvisorNote,
  getAdvisorNoteByIdData,
  getLinkedStudentIdsForConsultant,
  updateAdvisorNote,
} from "@/lib/data";
import { createTraceContext, finishTrace } from "@/lib/observability";
import { getSession } from "@/lib/session";

const schema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
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

  const { noteId } = await params;
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Invalid advisor note payload.",
      },
      { status: 400 }
    );
  }

  const note = await getAdvisorNoteByIdData(noteId);
  if (!note) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Advisor note not found.",
      },
      { status: 404 }
    );
  }

  const linkedStudentIds = await getLinkedStudentIdsForConsultant(session.userId);
  if (note.consultantId !== session.userId || !linkedStudentIds.includes(note.studentId)) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Unauthorized.",
      },
      { status: 403 }
    );
  }

  const updatedNote = await updateAdvisorNote(noteId, parsed.data);

  if (!updatedNote) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Advisor note not found.",
      },
      { status: 404 }
    );
  }

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/consultant/students/[studentId]",
    action: "consultant_note_updated",
    targetType: "advisor_note",
    targetId: updatedNote.id,
    status: "success",
    inputSummary: updatedNote.title,
    outputSummary: "Advisor note updated",
  });

  return NextResponse.json({
    success: true,
    entity_id: updatedNote.id,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Advisor note updated.",
    data: updatedNote,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
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

  const { noteId } = await params;
  const note = await getAdvisorNoteByIdData(noteId);

  if (!note) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Advisor note not found.",
      },
      { status: 404 }
    );
  }

  const linkedStudentIds = await getLinkedStudentIdsForConsultant(session.userId);
  if (note.consultantId !== session.userId || !linkedStudentIds.includes(note.studentId)) {
    return NextResponse.json(
      {
        success: false,
        trace_id: trace.traceId,
        decision_id: trace.decisionId,
        message: "Unauthorized.",
      },
      { status: 403 }
    );
  }

  const deletedNote = await deleteAdvisorNote(noteId);

  finishTrace(trace, {
    actorId: session.userId,
    actorRole: session.role,
    page: "/consultant/students/[studentId]",
    action: "consultant_note_deleted",
    targetType: "advisor_note",
    targetId: noteId,
    status: deletedNote ? "success" : "error",
    inputSummary: note.title,
    outputSummary: deletedNote ? "Advisor note deleted" : "Advisor note missing during delete",
  });

  return NextResponse.json({
    success: true,
    entity_id: noteId,
    trace_id: trace.traceId,
    decision_id: trace.decisionId,
    message: "Advisor note deleted.",
    data: deletedNote,
  });
}
