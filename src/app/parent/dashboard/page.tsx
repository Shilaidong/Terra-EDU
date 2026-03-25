import { CalendarRange, HeartHandshake, ShieldCheck, Target } from "lucide-react";

import { LogoutButton } from "@/components/client-tools";
import { HeroBadge, InfoPill, RoleShell, SectionCard, StatCard, SummaryCard, TaskGanttChart, TaskList, TimelineRail } from "@/components/terra-shell";
import { getParentOverviewData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";
import type { Milestone, Task } from "@/lib/types";

export default async function ParentDashboardPage() {
  const locale = await getLocale();
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
      title={pickText(locale, `Welcome back, ${session.name}`, `欢迎回来，${session.name}`)}
      subtitle={pickText(locale, `Here is a calm read-only view of ${student.name}'s planning momentum, deadlines, and advisor guidance.`, `这里是 ${student.name} 的只读视图，你可以看到规划节奏、截止日期和顾问建议。`)}
      activeHref="/parent/dashboard"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<HeartHandshake className="h-4 w-4" />} title={pickText(locale, "Current focus", "当前重点")} value={student.phase} />
          <HeroBadge icon={<Target className="h-4 w-4" />} title={pickText(locale, "Goal school", "梦校")} value={student.dreamSchools[0]} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label={pickText(locale, "Task completion", "任务完成率")} value={`${student.completion}%`} hint={pickText(locale, "Calculated from completed tasks without editing privileges.", "根据已完成任务实时计算，家长端为只读展示。")} />
        <StatCard label={pickText(locale, "Check-in streak", "连续打卡")} value={pickText(locale, `${student.checkInStreak} days`, `${student.checkInStreak} 天`)} hint={pickText(locale, "Calculated from consecutive saved check-in dates.", "根据连续打卡日期实时计算。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Mastery average", "平均掌握度")} value={`${student.masteryAverage}/5`} hint={pickText(locale, "Calculated from saved mastery scores in student check-ins.", "根据学生打卡中的掌握度分数实时计算。")} tone="secondary" />
      </div>

      <div className="mt-8">
        <SectionCard
          title={pickText(locale, "Journey Snapshot", "申请旅程总览")}
          eyebrow={pickText(locale, "Year view", "年视图")}
          action={<HeroBadge icon={<CalendarRange className="h-4 w-4" />} title={pickText(locale, "Active Lanes", "活跃分栏")} value={`${activeLaneCount}/5`} />}
        >
          <TaskGanttChart tasks={ganttTasks} milestones={ganttMilestones} view="year" rangeStart={ganttRange.start} />
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title={pickText(locale, "Current Open Tasks", "当前未完成任务")} eyebrow={pickText(locale, "Read-only visibility", "只读查看")}>
          <TaskList tasks={openTasks} />
        </SectionCard>

        <SectionCard title={pickText(locale, "Application Progress", "申请进度")} eyebrow={pickText(locale, "Family snapshot", "家长概览")} className="bg-primary-container/70">
          <div className="space-y-5">
            <div className="rounded-3xl bg-white/70 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Phase", "阶段")}</p>
              <p className="mt-2 font-serif text-3xl font-bold text-primary">{student.phase}</p>
            </div>
            <div className="rounded-3xl bg-white/70 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Target major", "目标专业")}</p>
              <p className="mt-2 text-lg font-bold text-foreground">{student.intendedMajor}</p>
            </div>
            <InfoPill icon={<ShieldCheck className="h-4 w-4" />} label={pickText(locale, "Read-only parent view with live student progress", "家长端只读展示，学生进度实时同步")} />
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title={pickText(locale, "Recent Milestones", "近期截止日期")} eyebrow={pickText(locale, "Timeline", "时间线")}>
          <TimelineRail milestones={milestones} />
        </SectionCard>

        <SectionCard title={pickText(locale, "Advisor Momentum Notes", "顾问跟进备注")} eyebrow={pickText(locale, "Consultant sync", "顾问同步")} >
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
        <SectionCard title={pickText(locale, "Parent View Guidance", "家长查看建议")} eyebrow={pickText(locale, "What to watch", "查看重点")}>
          <SummaryCard
            title={pickText(locale, "Focus on rhythm, not constant intervention", "关注节奏，而不是频繁干预")}
            body={pickText(locale, "Use this dashboard to spot deadline clusters, confirm steady study cadence, and stay aligned with the consultant's latest notes. The student remains the editor of tasks and check-ins.", "你可以用这个页面关注截止日期集中情况、确认学习节奏是否稳定，并查看顾问最新备注。任务和打卡仍由学生本人维护。")}
            footer={pickText(locale, "This view is intentionally read-only so family visibility stays clear and low-friction.", "这个页面刻意保持只读，方便家长清晰查看而不过度干扰。")}
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
