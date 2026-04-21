import Link from "next/link";
import { CalendarRange } from "lucide-react";

import {
  LogoutButton,
  MilestoneEditorControls,
  StudentMilestoneComposer,
  StudentTaskBreakdownPanel,
  StudentTimelineTaskComposer,
  TaskDeleteButton,
  TaskStatusControl,
} from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard, StatCard, TaskGanttChart, TaskList, TimelineRail } from "@/components/terra-shell";
import { getCurrentStudentData, getStudentLiveMetricsData, getStudentMilestonesData, getStudentTasksData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
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
  const locale = await getLocale();
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);
  const currentView = normalizeView((await searchParams)?.view);

  if (!student) return null;

  const [tasks, milestones, metrics] = await Promise.all([
    getStudentTasksData(student.id),
    getStudentMilestonesData(student.id),
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
      title={pickText(locale, "Academic Journey", "学业旅程")}
      subtitle={pickText(locale, "A launch-ready timeline view of tasks, milestones, and status changes. This version focuses on stable updates and a clear planning rhythm.", "这是可直接上线的任务时间线视图，展示任务、截止日期和状态变化。当前版本优先保证更新稳定、规划清晰。")}
      activeHref="/student/timeline"
      hero={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex w-full items-center overflow-x-auto rounded-full bg-surface-container p-1 sm:w-auto">
            {viewOptions.map((option) => (
              <Link
                key={option.value}
                href={`/student/timeline?view=${option.value}`}
                className={
                  option.value === currentView
                    ? "whitespace-nowrap rounded-full bg-white px-3 py-2 text-xs font-bold text-primary shadow-sm sm:px-5 sm:text-sm"
                    : "whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-outline transition-colors hover:text-foreground sm:px-5 sm:text-sm"
                }
              >
                {pickText(locale, option.label, option.value === "year" ? "年视图" : option.value === "three_years" ? "三年视图" : "月视图")}
              </Link>
            ))}
          </div>
          <HeroBadge
            icon={<CalendarRange className="h-4 w-4" />}
            title={pickText(locale, "Default View", "默认视图")}
            value={pickText(locale, viewOptions.find((option) => option.value === currentView)?.label ?? "Year", currentView === "year" ? "年视图" : currentView === "three_years" ? "三年视图" : "月视图")}
          />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        <StatCard label={pickText(locale, "Completion", "完成率")} value={`${metrics.completion}%`} hint={pickText(locale, "Calculated from completed tasks across the plan.", "根据当前规划内已完成任务实时计算。")} />
        <StatCard label={pickText(locale, "Active tasks", "未完成任务")} value={`${visibleTasks.filter((task) => task.status !== "done").length}`} hint={pickText(locale, "Open items inside the current calendar view.", "当前视图内仍未完成的任务数量。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Upcoming milestones", "即将到来的截止日期")} value={`${upcomingMilestoneCount}`} hint={pickText(locale, "Future milestones visible in the current calendar view.", "当前视图中未来将到来的截止日期数量。")} tone="secondary" />
      </div>

      <div className="mt-6 sm:mt-8">
        <SectionCard
          title={pickText(locale, "Timeline Gantt", "时间线甘特图")}
          eyebrow={pickText(locale, "Calendar-aligned roadmap", "按日历排布的路线图")}
          action={<HeroBadge icon={<CalendarRange className="h-4 w-4" />} title={pickText(locale, "Active Lanes", "活跃分栏")} value={`${activeLaneCount}/5`} />}
        >
          <TaskGanttChart tasks={visibleTasks} milestones={visibleMilestones} view={currentView} rangeStart={visibleRange.start} />
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <SectionCard
          title={pickText(locale, "Task Timeline", "任务时间线")}
          eyebrow={pickText(locale, "Active planning", "当前计划")}
          className="self-start"
        >
          <StudentTimelineTaskComposer studentId={student.id} />
          <div className="mt-5 border-t border-black/5 pt-5 sm:mt-6 sm:pt-6">
            <div className="h-[24rem] overflow-y-auto rounded-2xl bg-surface-container-low p-4 pr-3">
              <TaskList
                tasks={visibleTasks}
                action={(taskId) => (
                  <div className="flex flex-wrap items-center gap-2">
                    <TaskStatusControl taskId={taskId} status={visibleTasks.find((task) => task.id === taskId)?.status ?? "pending"} />
                    <TaskDeleteButton
                      taskId={taskId}
                      title={visibleTasks.find((task) => task.id === taskId)?.title ?? pickText(locale, "this task", "这个任务")}
                    />
                  </div>
                )}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title={pickText(locale, "Milestone Rail", "截止日期轨道")}
          eyebrow={pickText(locale, "Key dates", "关键日期")}
          className="self-start"
        >
          <StudentMilestoneComposer studentId={student.id} />
          <div className="mt-5 border-t border-black/5 pt-5 sm:mt-6 sm:pt-6">
            <div className="h-[22rem] overflow-y-auto rounded-2xl bg-surface-container-low p-4 pr-3">
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
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 sm:mt-8">
        <StudentTaskBreakdownPanel studentId={student.id} />
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
