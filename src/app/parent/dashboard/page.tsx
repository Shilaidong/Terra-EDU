import { CalendarRange, HeartHandshake, ShieldCheck, Target } from "lucide-react";

import { LogoutButton } from "@/components/client-tools";
import { HeroBadge, InfoPill, RoleShell, SectionCard, StatCard, SummaryCard, TaskGanttChart, TaskList, TimelineRail } from "@/components/terra-shell";
import { getParentOverviewData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";
import type { Milestone, Task } from "@/lib/types";

export default async function ParentDashboardPage() {
  const session = await requireSession("parent");
  const overview = await getParentOverviewData();
  const { student, tasks, milestones, notes } = overview;
  const ganttRange = buildDashboardRange(tasks, milestones);
  const ganttTasks = tasks.filter((task) => taskIntersectsRange(task, ganttRange.start, ganttRange.end));
  const ganttMilestones = milestones.filter((milestone) =>
    milestoneIntersectsRange(milestone, ganttRange.start, ganttRange.end)
  );
  const activeLaneCount =
    new Set(ganttTasks.map((task) => task.timelineLane)).size + (ganttMilestones.length > 0 ? 1 : 0);
  const openTasks = tasks.filter((task) => task.status !== "done");

  return (
    <RoleShell
      session={session}
      title={`Welcome back, ${session.name}`}
      subtitle={`Here is a calm read-only view of ${student.name}'s planning momentum, deadlines, and advisor guidance.`}
      activeHref="/parent/dashboard"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<HeartHandshake className="h-4 w-4" />} title="Current focus" value={student.phase} />
          <HeroBadge icon={<Target className="h-4 w-4" />} title="Goal school" value={student.dreamSchools[0]} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Task completion" value={`${student.completion}%`} hint="Calculated from completed tasks without editing privileges." />
        <StatCard label="Check-in streak" value={`${student.checkInStreak} days`} hint="Calculated from consecutive saved check-in dates." tone="tertiary" />
        <StatCard label="Mastery average" value={`${student.masteryAverage}/5`} hint="Calculated from saved mastery scores in student check-ins." tone="secondary" />
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
        <SectionCard title="Current Open Tasks" eyebrow="Read-only visibility">
          <TaskList tasks={openTasks} />
        </SectionCard>

        <SectionCard title="Application Progress" eyebrow="Family snapshot" className="bg-primary-container/70">
          <div className="space-y-5">
            <div className="rounded-3xl bg-white/70 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Phase</p>
              <p className="mt-2 font-serif text-3xl font-bold text-primary">{student.phase}</p>
            </div>
            <div className="rounded-3xl bg-white/70 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Target major</p>
              <p className="mt-2 text-lg font-bold text-foreground">{student.intendedMajor}</p>
            </div>
            <InfoPill icon={<ShieldCheck className="h-4 w-4" />} label="Read-only parent view with live student progress" />
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Recent Milestones" eyebrow="Timeline">
          <TimelineRail milestones={milestones} />
        </SectionCard>

        <SectionCard title="Advisor Momentum Notes" eyebrow="Consultant sync">
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="rounded-2xl bg-surface-container-low p-5">
                <p className="font-bold text-foreground">{note.title}</p>
                <p className="mt-2 text-sm leading-7 text-secondary">{note.summary}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-8">
        <SectionCard title="Parent View Guidance" eyebrow="What to watch">
          <SummaryCard
            title="Focus on rhythm, not constant intervention"
            body="Use this dashboard to spot deadline clusters, confirm steady study cadence, and stay aligned with the consultant's latest notes. The student remains the editor of tasks and check-ins."
            footer="This view is intentionally read-only so family visibility stays clear and low-friction."
          />
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
