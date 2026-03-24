import Link from "next/link";
import { CalendarRange } from "lucide-react";

import { LogoutButton, MilestoneEditorControls, StudentMilestoneComposer, StudentTimelineTaskComposer, TaskDeleteButton, TaskStatusControl } from "@/components/client-tools";
import { AuditFeed, HeroBadge, RoleShell, SectionCard, StatCard, TaskGanttChart, TaskList, TimelineRail } from "@/components/terra-shell";
import { getCurrentStudentData, getRecentAuditLogsData, getStudentLiveMetricsData, getStudentMilestonesData, getStudentTasksData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";
import type { Milestone, Task, TimelineView } from "@/lib/types";

const viewOptions: { value: TimelineView; label: string }[] = [
  { value: "year", label: "Year" },
  { value: "three_years", label: "3 Years" },
  { value: "month", label: "Month" },
];

function normalizeView(value?: string): TimelineView {
  if (value === "three_years" || value === "month" || value === "year") {
    return value;
  }

  return "year";
}

export default async function StudentTimelinePage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string }>;
}) {
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);
  const currentView = normalizeView((await searchParams)?.view);

  if (!student) return null;

  const [tasks, milestones, logs, metrics] = await Promise.all([
    getStudentTasksData(student.id),
    getStudentMilestonesData(student.id),
    getRecentAuditLogsData(6),
    getStudentLiveMetricsData(student.id),
  ]);
  const visibleRange = buildVisibleRange(tasks, milestones, currentView);
  const visibleTasks = tasks.filter((task) => taskIntersectsRange(task, visibleRange.start, visibleRange.end));
  const visibleMilestones = milestones
    .map(normalizeMilestoneStatus)
    .filter((milestone) => milestoneIntersectsRange(milestone, visibleRange.start, visibleRange.end));
  const activeLaneCount =
    new Set(visibleTasks.map((task) => task.timelineLane)).size + (visibleMilestones.length > 0 ? 1 : 0);
  const upcomingMilestoneCount = visibleMilestones.filter(
    (milestone) => milestone.status !== "done" && parseDate(milestone.eventDate).getTime() >= startOfDay(new Date()).getTime()
  ).length;

  return (
    <RoleShell
      session={session}
      title="Academic Journey"
      subtitle="A launch-ready timeline view of tasks, milestones, and status changes. First version focuses on reliable updates and logs rather than complex drag scheduling."
      activeHref="/student/timeline"
      hero={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full bg-surface-container p-1">
            {viewOptions.map((option) => (
              <Link
                key={option.value}
                href={`/student/timeline?view=${option.value}`}
                className={
                  option.value === currentView
                    ? "rounded-full bg-white px-5 py-2 text-sm font-bold text-primary shadow-sm"
                    : "rounded-full px-5 py-2 text-sm font-semibold text-outline transition-colors hover:text-foreground"
                }
              >
                {option.label}
              </Link>
            ))}
          </div>
          <HeroBadge
            icon={<CalendarRange className="h-4 w-4" />}
            title="Default View"
            value={viewOptions.find((option) => option.value === currentView)?.label ?? "Year"}
          />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Completion" value={`${metrics.completion}%`} hint="Calculated from completed tasks across the plan." />
        <StatCard label="Active tasks" value={`${visibleTasks.filter((task) => task.status !== "done").length}`} hint="Open items inside the current calendar view." tone="tertiary" />
        <StatCard label="Upcoming milestones" value={`${upcomingMilestoneCount}`} hint="Future milestones visible in the current calendar view." tone="secondary" />
      </div>

      <div className="mt-8">
        <SectionCard
          title="Timeline Gantt"
          eyebrow="Calendar-aligned roadmap"
          action={<HeroBadge icon={<CalendarRange className="h-4 w-4" />} title="Active Lanes" value={`${activeLaneCount}/5`} />}
        >
          <TaskGanttChart tasks={visibleTasks} milestones={visibleMilestones} view={currentView} rangeStart={visibleRange.start} />
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Task Timeline" eyebrow="Add, update, and remove items against the active calendar view">
          <StudentTimelineTaskComposer studentId={student.id} />
          <div className="mt-6 border-t border-black/5 pt-6">
          <TaskList
            tasks={visibleTasks}
            action={(taskId) => (
              <div className="flex flex-wrap items-center gap-2">
                <TaskStatusControl taskId={taskId} status={visibleTasks.find((task) => task.id === taskId)?.status ?? "pending"} />
                <TaskDeleteButton
                  taskId={taskId}
                  title={visibleTasks.find((task) => task.id === taskId)?.title ?? "this task"}
                />
              </div>
            )}
          />
          </div>
        </SectionCard>

        <SectionCard title="Milestone Rail" eyebrow={`Long-range plan within ${viewOptions.find((option) => option.value === currentView)?.label ?? "Year"}`}>
          <StudentMilestoneComposer studentId={student.id} />
          <div className="mt-6 border-t border-black/5 pt-6">
            <TimelineRail
              milestones={visibleMilestones}
              action={(milestoneId) => {
                const milestone = visibleMilestones.find((item) => item.id === milestoneId);

                if (!milestone) {
                  return null;
                }

                return (
                  <MilestoneEditorControls
                    milestone={{
                      id: milestone.id,
                      title: milestone.title,
                      eventDate: milestone.eventDate,
                      status: milestone.status,
                    }}
                  />
                );
              }}
            />
          </div>
        </SectionCard>
      </div>

      <div className="mt-8">
        <SectionCard title="Recent trace log" eyebrow="Observability">
          <AuditFeed logs={logs} />
        </SectionCard>
      </div>
    </RoleShell>
  );
}

function buildVisibleRange(tasks: Task[], milestones: Milestone[], view: TimelineView) {
  const earliestTask = tasks.length > 0 ? parseDate(tasks.map((task) => task.startDate).sort()[0] as string) : null;
  const earliestMilestone =
    milestones.length > 0 ? parseDate(milestones.map((milestone) => milestone.eventDate).sort()[0] as string) : null;
  const anchorSource =
    earliestTask && earliestMilestone
      ? earliestTask.getTime() <= earliestMilestone.getTime()
        ? earliestTask
        : earliestMilestone
      : earliestTask ?? earliestMilestone ?? new Date();
  const anchor = startOfMonth(anchorSource);

  if (view === "month") {
    return {
      start: anchor,
      end: endOfMonth(anchor),
    };
  }

  if (view === "three_years") {
    return {
      start: anchor,
      end: endOfMonth(addMonths(anchor, 35)),
    };
  }

  return {
    start: anchor,
    end: endOfMonth(addMonths(anchor, 11)),
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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

function normalizeMilestoneStatus(milestone: Milestone): Milestone {
  if (milestone.status === "done") {
    return milestone;
  }

  return {
    ...milestone,
    status: "upcoming",
  };
}
