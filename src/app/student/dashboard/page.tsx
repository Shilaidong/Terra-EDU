import { Bot, CalendarRange, Sparkles, Target } from "lucide-react";

import { AiChatWidget, AiRecommendationPanel, LogoutButton } from "@/components/client-tools";
import { AuditFeed, HeroBadge, InfoPill, RoleShell, SectionCard, StatCard, SummaryCard, TaskGanttChart, TaskList, TimelineRail } from "@/components/terra-shell";
import { getCurrentStudentData, getRecentAuditLogsData, getStudentLiveMetricsData, getStudentMilestonesData, getStudentNotesData, getStudentTasksData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";
import type { Milestone, Task } from "@/lib/types";

export default async function StudentDashboardPage() {
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);

  if (!student) {
    return null;
  }

  const [tasks, milestones, notes, logs, metrics] = await Promise.all([
    getStudentTasksData(student.id),
    getStudentMilestonesData(student.id),
    getStudentNotesData(student.id),
    getRecentAuditLogsData(4),
    getStudentLiveMetricsData(student.id),
  ]);
  const ganttRange = buildDashboardRange(tasks, milestones);
  const ganttTasks = tasks.filter((task) => taskIntersectsRange(task, ganttRange.start, ganttRange.end));
  const ganttMilestones = milestones.filter((milestone) =>
    milestoneIntersectsRange(milestone, ganttRange.start, ganttRange.end)
  );
  const activeLaneCount =
    new Set(ganttTasks.map((task) => task.timelineLane)).size + (ganttMilestones.length > 0 ? 1 : 0);

  return (
    <RoleShell
      session={session}
      title={`Welcome back, ${student.name.split(" ")[0]}`}
      subtitle={`Your journey toward ${student.dreamSchools[0]} is ${metrics.completion}% complete. Stay rooted, keep growing.`}
      activeHref="/student/dashboard"
      hero={
        <div className="flex flex-wrap items-center gap-3">
          <HeroBadge icon={<Target className="h-4 w-4" />} title="Goal school" value={student.dreamSchools[0]} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Task completion" value={`${metrics.completion}%`} hint="Calculated from completed tasks against the full task list." />
        <StatCard label="Check-in streak" value={`${metrics.checkInStreak} days`} hint="Calculated from consecutive check-in dates." tone="tertiary" />
        <StatCard label="Mastery average" value={`${metrics.masteryAverage}/5`} hint="Calculated from saved mastery scores in check-ins." tone="secondary" />
      </div>

      <div className="mt-8">
        <SectionCard
          title="Journey Snapshot"
          eyebrow="Year view"
          action={<HeroBadge icon={<CalendarRange className="h-4 w-4" />} title="Active Lanes" value={`${activeLaneCount}/5`} />}
        >
          <TaskGanttChart tasks={ganttTasks} milestones={ganttMilestones} view="year" rangeStart={ganttRange.start} />
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Today's Tasks" eyebrow="Student workflow">
          <TaskList tasks={tasks} />
        </SectionCard>

        <SectionCard title="Application Progress" eyebrow="Snapshot" className="bg-primary-container/70">
          <div className="space-y-5">
            <div className="rounded-3xl bg-white/70 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Phase</p>
              <p className="mt-2 font-serif text-3xl font-bold text-primary">{student.phase}</p>
            </div>
            <div className="rounded-3xl bg-white/70 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Target major</p>
              <p className="mt-2 text-lg font-bold text-foreground">{student.intendedMajor}</p>
            </div>
            <InfoPill icon={<Sparkles className="h-4 w-4" />} label="AI assistant and logs are live" />
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Recent Milestones" eyebrow="Timeline">
          <TimelineRail milestones={milestones} />
        </SectionCard>

        <div className="space-y-8">
          <AiChatWidget studentId={student.id} />
          <AiRecommendationPanel
            studentId={student.id}
            page="/student/dashboard"
            feature="student_dashboard_recommendation"
            prompt="Summarize the student's next best actions using tasks, milestones, and study cadence."
          />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <SectionCard title="Advisor Momentum Notes" eyebrow="Human support">
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="rounded-2xl bg-surface-container-low p-5">
                <p className="font-bold text-foreground">{note.title}</p>
                <p className="mt-2 text-sm leading-7 text-secondary">{note.summary}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Launch AI assistant" eyebrow="Practical AI">
          <SummaryCard
            title="This week is about proof, not breadth"
            body="Finish the IELTS upload, push the essay draft into advisor review, and keep check-ins consistent. The launch version uses these concrete signals to drive recommendations instead of opaque scoring."
            footer="Model outputs are stored with trace ids for future bug fixing"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <InfoPill icon={<Bot className="h-4 w-4" />} label="Prompt versioning enabled" />
            <InfoPill icon={<Sparkles className="h-4 w-4" />} label="Structured JSON AI responses" />
          </div>
        </SectionCard>
      </div>

      <div className="mt-8">
        <SectionCard title="Recent audit trail" eyebrow="Debug readiness">
          <AuditFeed logs={logs} />
        </SectionCard>
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
