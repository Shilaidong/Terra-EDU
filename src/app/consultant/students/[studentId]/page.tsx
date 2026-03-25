import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarRange, GraduationCap, NotebookPen, Target } from "lucide-react";

import {
  CheckInEditorControls,
  ConsultantMilestoneComposer,
  ConsultantNoteComposer,
  ConsultantStudentPicker,
  ConsultantStudentProfileEditor,
  ConsultantTaskComposer,
  LogoutButton,
  MilestoneEditorControls,
  TaskDeleteButton,
  TaskStatusControl,
} from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard, StatCard, SummaryCard, TaskGanttChart, TaskList, TimelineRail } from "@/components/terra-shell";
import {
  getConsultantOverviewData,
  getStudentByIdData,
  getStudentCheckInsData,
  getStudentLiveMetricsData,
  getStudentMilestonesData,
  getStudentNotesData,
  getStudentTasksData,
} from "@/lib/data";
import { requireSession } from "@/lib/server/guards";
import type { Milestone, Task } from "@/lib/types";

export default async function ConsultantStudentWorkspacePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await requireSession("consultant");
  const { studentId } = await params;
  const [overview, student] = await Promise.all([
    getConsultantOverviewData(),
    getStudentByIdData(studentId),
  ]);

  if (!student) {
    return null;
  }

  const [tasks, milestones, checkIns, notes, metrics] = await Promise.all([
    getStudentTasksData(student.id),
    getStudentMilestonesData(student.id),
    getStudentCheckInsData(student.id),
    getStudentNotesData(student.id),
    getStudentLiveMetricsData(student.id),
  ]);

  const ganttRange = buildDashboardRange(tasks, milestones);
  const currentStudentSignal = overview.students.find((item) => item.id === student.id) ?? {
    riskLevel: "low" as const,
    riskScore: 0,
    nextDeadlineDate: null,
    nextDeadlineLabel: "No upcoming deadline",
    nextDeadlineTitle: "No upcoming deadline",
  };
  const ganttTasks = tasks.filter((task) => taskIntersectsRange(task, ganttRange.start, ganttRange.end));
  const ganttMilestones = milestones.filter((milestone) =>
    milestoneIntersectsRange(milestone, ganttRange.start, ganttRange.end)
  );
  const activeLaneCount =
    new Set(ganttTasks.map((task) => task.timelineLane)).size + (ganttMilestones.length > 0 ? 1 : 0);

  return (
    <RoleShell
      session={session}
      title={`${student.name} Workspace`}
      subtitle="Review the full student picture, edit profile basics, schedule timeline tasks, manage deadlines, and keep advisor notes in one place."
      activeHref="/consultant/students"
      hero={
        <div className="flex flex-wrap items-center gap-3">
          <HeroBadge icon={<BriefcaseBusiness className="h-4 w-4" />} title="Phase" value={student.phase} />
          <HeroBadge icon={<Target className="h-4 w-4" />} title="Goal school" value={student.dreamSchools[0] ?? "TBD"} />
          <HeroBadge icon={<CalendarRange className="h-4 w-4" />} title="Risk" value={currentStudentSignal.riskLevel} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Task completion" value={`${metrics.completion}%`} hint="Live task completion using the same student-side calculation." />
        <StatCard label="Check-in streak" value={`${metrics.checkInStreak} days`} hint="Current consecutive study rhythm." tone="tertiary" />
        <StatCard label="Mastery average" value={`${metrics.masteryAverage}/5`} hint="Average mastery across saved check-ins." tone="secondary" />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[320px_1fr]">
        <div className="space-y-8">
          <SectionCard title="Student Selector" eyebrow="Cohort workspace">
            <ConsultantStudentPicker
              currentStudentId={student.id}
              students={overview.students.map((item) => ({
                id: item.id,
                name: item.name,
                grade: item.grade,
                school: item.school,
                completion: item.completion,
                phase: item.phase,
                riskLevel: item.riskLevel,
                riskScore: item.riskScore,
                nextDeadlineLabel: item.nextDeadlineLabel,
                nextDeadlineTitle: item.nextDeadlineTitle,
                nextDeadlineDate: item.nextDeadlineDate,
              }))}
            />
          </SectionCard>

          <SectionCard title="Workspace Guide" eyebrow="Quick jump">
            <div className="space-y-3">
              {[
                { href: "#profile", label: "Edit student profile" },
                { href: "#planning", label: "Plan tasks and deadlines" },
                { href: "#checkins", label: "Review check-ins" },
                { href: "#notes", label: "Write advisor notes" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-4 text-sm font-semibold text-primary"
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-8">
          <SectionCard
            title="Journey Snapshot"
            eyebrow="Year view"
            action={<HeroBadge icon={<CalendarRange className="h-4 w-4" />} title="Active Lanes" value={`${activeLaneCount}/5`} />}
          >
            <TaskGanttChart tasks={ganttTasks} milestones={ganttMilestones} view="year" rangeStart={ganttRange.start} />
          </SectionCard>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]" id="profile">
            <SectionCard title="Student Profile" eyebrow="Consultant editable">
              <div className="mb-6 rounded-3xl bg-surface-container-low p-6">
                <div className="flex items-center gap-4">
                  <img alt={student.name} src={student.avatar} className="h-16 w-16 rounded-full object-cover" />
                  <div>
                    <p className="font-serif text-3xl font-bold text-foreground">{student.name}</p>
                    <p className="mt-1 text-sm text-secondary">
                      {student.grade} · {student.school}
                    </p>
                  </div>
                </div>
              </div>
              <ConsultantStudentProfileEditor
                studentId={student.id}
                defaultName={student.name}
                defaultGrade={student.grade}
                defaultSchool={student.school}
                defaultCountries={student.targetCountries}
                defaultDreamSchools={student.dreamSchools}
                defaultMajor={student.intendedMajor}
                defaultAvatar={student.avatar}
              />
            </SectionCard>

            <SectionCard title="Student Summary" eyebrow="Advisor read">
              <SummaryCard
                title={`${student.name} is aiming for ${student.dreamSchools[0] ?? "a target school list"}`}
                body={`${student.phase} phase, ${student.intendedMajor} track, ${metrics.completion}% completion, ${metrics.checkInStreak} day streak, and ${metrics.masteryAverage}/5 mastery average.`}
                footer="This card gives the consultant a fast read before making edits."
              />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Countries</p>
                  <p className="mt-2 text-sm text-secondary">{student.targetCountries.join(", ")}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Goal Schools</p>
                  <p className="mt-2 text-sm text-secondary">{student.dreamSchools.join(", ")}</p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]" id="planning">
            <SectionCard title="Current Tasks" eyebrow="Consultant editable">
              <TaskList
                tasks={tasks}
                action={(taskId) => {
                  const task = tasks.find((item) => item.id === taskId);

                  if (!task) {
                    return null;
                  }

                  return (
                    <div className="flex items-center gap-2">
                      <TaskStatusControl taskId={task.id} status={task.status} endpointBase="/api/consultant/tasks" />
                      <TaskDeleteButton taskId={task.id} title={task.title} endpointBase="/api/consultant/tasks" />
                    </div>
                  );
                }}
              />
            </SectionCard>

            <div className="space-y-8">
              <SectionCard title="Add Task" eyebrow="Schedule work">
                <ConsultantTaskComposer studentId={student.id} />
              </SectionCard>
              <SectionCard title="Add Deadline" eyebrow="Milestone control">
                <ConsultantMilestoneComposer studentId={student.id} />
              </SectionCard>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <SectionCard title="Deadline Rail" eyebrow="Consultant editable">
              <TimelineRail
                milestones={milestones}
                action={(milestoneId) => {
                  const milestone = milestones.find((item) => item.id === milestoneId);

                  if (!milestone) {
                    return null;
                  }

                  return (
                    <MilestoneEditorControls
                      milestone={milestone}
                      endpointBase="/api/consultant/milestones"
                    />
                  );
                }}
              />
            </SectionCard>

            <div id="checkins">
              <SectionCard title="Recent Check-ins" eyebrow="Directly editable">
                <div className="space-y-4">
                  {checkIns.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
                      No check-ins recorded for this student yet.
                    </div>
                  ) : (
                    checkIns.map((record) => (
                      <div key={record.id} className="rounded-2xl bg-surface-container-low p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-foreground">
                              {record.curriculum} · {record.chapter}
                            </p>
                            <p className="mt-1 text-sm text-secondary">{record.notes}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-serif text-2xl font-bold text-primary">{record.mastery}/5</div>
                            <div className="text-xs uppercase tracking-[0.2em] text-outline">{record.date}</div>
                          </div>
                        </div>
                        <CheckInEditorControls
                          checkIn={{
                            id: record.id,
                            curriculum: record.curriculum,
                            chapter: record.chapter,
                            mastery: record.mastery,
                            date: record.date,
                            notes: record.notes,
                          }}
                          endpointBase="/api/consultant/checkins"
                        />
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]" id="notes">
            <SectionCard title="Advisor Notes" eyebrow="Internal tracking">
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
                    No advisor notes yet. Add one from the quick action panel.
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="rounded-2xl bg-surface-container-low p-5">
                      <p className="font-bold text-foreground">{note.title}</p>
                      <p className="mt-2 text-sm leading-7 text-secondary">{note.summary}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-outline">{note.createdAt.slice(0, 10)}</p>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <div className="space-y-8">
              <SectionCard title="Add Advisor Note" eyebrow="Consultant log">
                <ConsultantNoteComposer studentId={student.id} />
              </SectionCard>
              <SectionCard title="Why this workspace matters" eyebrow="Future-ready structure">
                <SummaryCard
                  title="One student, one operating surface"
                  body="As the consultant portfolio grows, the key is reducing context switching. This workspace keeps selection, reading, and editing around the same student in one place."
                  footer="The next upgrade can add bulk actions and a stronger risk queue without changing this route."
                />
              </SectionCard>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <SectionCard title="Parent View Preview" eyebrow="Family-facing readout">
              <SummaryCard
                title={`${student.name} is currently in ${student.phase}`}
                body={`A parent opening the family dashboard should mainly see three things: ${metrics.completion}% progress, ${metrics.checkInStreak} day check-in rhythm, and the next deadline "${currentStudentSignal.nextDeadlineTitle}" on ${currentStudentSignal.nextDeadlineLabel}.`}
                footer="Use this preview to sanity-check whether consultant edits are clear enough for family visibility."
              />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Latest note preview</p>
                  <p className="mt-2 text-sm text-secondary">{notes[0]?.summary ?? "No advisor note written yet."}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Current risk</p>
                  <p className="mt-2 text-sm text-secondary">
                    {currentStudentSignal.riskLevel} risk with score {currentStudentSignal.riskScore}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Consultant Focus Queue" eyebrow="Second-version workflow">
              <div className="space-y-4">
                <div className="rounded-2xl bg-surface-container-low p-5">
                  <p className="font-bold text-foreground">Why this student is ordered here</p>
                  <p className="mt-2 text-sm leading-7 text-secondary">
                    Risk sorting now considers completion, streak, mastery, open work, and deadline pressure together instead of only looking at one number.
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-5">
                  <p className="font-bold text-foreground">Next best consultant move</p>
                  <p className="mt-2 text-sm leading-7 text-secondary">
                    If the next deadline is close, use a template to create structured work immediately. If study rhythm is weak, review check-ins and leave an advisor note before changing the plan.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="rounded-3xl bg-surface-container-low p-6">
            <div className="flex flex-wrap items-center gap-3 text-primary">
              <GraduationCap className="h-5 w-5" />
              <NotebookPen className="h-5 w-5" />
              <Link href="/consultant/students" className="text-sm font-bold">
                Back to cohort table
              </Link>
            </div>
          </div>
        </div>
      </div>
    </RoleShell>
  );
}

function buildDashboardRange(tasks: Task[], milestones: Milestone[]) {
  const earliestTask = tasks.length > 0 ? parseDate(tasks.map((task) => task.startDate).sort()[0] as string) : null;
  const earliestMilestone =
    milestones.length > 0 ? parseDate(milestones.map((milestone) => milestone.eventDate).sort()[0] as string) : null;
  const anchorSource =
    earliestTask && earliestMilestone
      ? earliestTask.getTime() <= earliestMilestone.getTime()
        ? earliestTask
        : earliestMilestone
      : earliestTask ?? earliestMilestone ?? new Date();

  const start = startOfMonth(anchorSource);

  return {
    start,
    end: endOfMonth(addMonths(start, 11)),
  };
}

function taskIntersectsRange(task: Task, rangeStart: Date, rangeEnd: Date) {
  const taskStart = parseDate(task.startDate);
  const taskEnd = parseDate(task.endDate);
  return taskStart.getTime() <= rangeEnd.getTime() && taskEnd.getTime() >= rangeStart.getTime();
}

function milestoneIntersectsRange(milestone: Milestone, rangeStart: Date, rangeEnd: Date) {
  const milestoneDate = parseDate(milestone.eventDate);
  return milestoneDate.getTime() >= rangeStart.getTime() && milestoneDate.getTime() <= rangeEnd.getTime();
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}
