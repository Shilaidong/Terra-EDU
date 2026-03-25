import { Bot, CalendarRange, Sparkles, Target } from "lucide-react";

import { AiChatWidget, AiRecommendationPanel, LogoutButton } from "@/components/client-tools";
import { AuditFeed, HeroBadge, InfoPill, RoleShell, SectionCard, StatCard, SummaryCard, TaskGanttChart, TaskList, TimelineRail } from "@/components/terra-shell";
import { getCurrentStudentData, getRecentAuditLogsData, getStudentLiveMetricsData, getStudentMilestonesData, getStudentNotesData, getStudentTasksData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";
import type { Milestone, Task } from "@/lib/types";

export default async function StudentDashboardPage() {
  const locale = await getLocale();
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
      title={pickText(locale, `Welcome back, ${student.name.split(" ")[0]}`, `欢迎回来，${student.name.split(" ")[0]}`)}
      subtitle={pickText(locale, `Your journey toward ${student.dreamSchools[0]} is ${metrics.completion}% complete. Stay rooted, keep growing.`, `你前往 ${student.dreamSchools[0]} 的申请旅程已完成 ${metrics.completion}%。继续稳步向前。`)}
      activeHref="/student/dashboard"
      hero={
        <div className="flex flex-wrap items-center gap-3">
          <HeroBadge icon={<Target className="h-4 w-4" />} title={pickText(locale, "Goal school", "梦校")} value={student.dreamSchools[0]} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label={pickText(locale, "Task completion", "任务完成率")} value={`${metrics.completion}%`} hint={pickText(locale, "Calculated from completed tasks against the full task list.", "根据全部任务中的已完成数量实时计算。")} />
        <StatCard label={pickText(locale, "Check-in streak", "连续打卡")} value={pickText(locale, `${metrics.checkInStreak} days`, `${metrics.checkInStreak} 天`)} hint={pickText(locale, "Calculated from consecutive check-in dates.", "根据连续打卡日期实时计算。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Mastery average", "平均掌握度")} value={`${metrics.masteryAverage}/5`} hint={pickText(locale, "Calculated from saved mastery scores in check-ins.", "根据已保存的打卡掌握度分数实时计算。")} tone="secondary" />
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
        <SectionCard title={pickText(locale, "Today's Tasks", "当前任务")} eyebrow={pickText(locale, "Student workflow", "学生流程")}>
          <TaskList tasks={tasks} />
        </SectionCard>

        <SectionCard title={pickText(locale, "Application Progress", "申请进度")} eyebrow={pickText(locale, "Snapshot", "概览")} className="bg-primary-container/70">
          <div className="space-y-5">
            <div className="rounded-3xl bg-white/70 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Phase", "阶段")}</p>
              <p className="mt-2 font-serif text-3xl font-bold text-primary">{student.phase}</p>
            </div>
            <div className="rounded-3xl bg-white/70 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Target major", "目标专业")}</p>
              <p className="mt-2 text-lg font-bold text-foreground">{student.intendedMajor}</p>
            </div>
            <InfoPill icon={<Sparkles className="h-4 w-4" />} label={pickText(locale, "AI assistant and logs are live", "AI 助手和日志系统已上线")} />
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title={pickText(locale, "Recent Milestones", "近期截止日期")} eyebrow={pickText(locale, "Timeline", "时间线")}>
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
        <SectionCard title={pickText(locale, "Advisor Momentum Notes", "顾问跟进备注")} eyebrow={pickText(locale, "Human support", "人工支持")}>
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="rounded-2xl bg-surface-container-low p-5">
                <p className="font-bold text-foreground">{note.title}</p>
                <p className="mt-2 text-sm leading-7 text-secondary">{note.summary}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={pickText(locale, "Launch AI assistant", "AI 助手说明")} eyebrow={pickText(locale, "Practical AI", "实用 AI")}>
          <SummaryCard
            title={pickText(locale, "This week is about proof, not breadth", "这周的重点是形成证据，而不是盲目铺开")}
            body={pickText(locale, "Finish the IELTS upload, push the essay draft into advisor review, and keep check-ins consistent. The launch version uses these concrete signals to drive recommendations instead of opaque scoring.", "先完成 IELTS 成绩上传，把文书草稿推进到顾问审阅，并保持稳定打卡。当前版本会优先依据这些真实信号给出建议，而不是依赖不透明评分。")}
            footer={pickText(locale, "Model outputs are stored with trace ids for future bug fixing", "模型输出会带 trace id 保存，方便后续排查问题")}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <InfoPill icon={<Bot className="h-4 w-4" />} label={pickText(locale, "Prompt versioning enabled", "提示词版本已记录")} />
            <InfoPill icon={<Sparkles className="h-4 w-4" />} label={pickText(locale, "Structured JSON AI responses", "AI 输出为结构化 JSON")} />
          </div>
        </SectionCard>
      </div>

      <div className="mt-8">
        <SectionCard title={pickText(locale, "Recent audit trail", "最近审计记录")} eyebrow={pickText(locale, "Debug readiness", "便于调试")}>
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
