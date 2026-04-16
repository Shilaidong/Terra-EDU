import { CalendarRange, Sparkles, Target } from "lucide-react";

import { AiChatWidget, AiRecommendationPanel, LogoutButton } from "@/components/client-tools";
import { AuditFeed, HeroBadge, InfoPill, RoleShell, SectionCard, StatCard, TaskGanttChart, TaskList, TimelineRail } from "@/components/terra-shell";
import {
  getCurrentStudentData,
  getRecentAuditLogsData,
  getStudentCheckInsData,
  getStudentLiveMetricsData,
  getStudentMilestonesData,
  getStudentNotesData,
  getStudentTasksData,
} from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";
import type { CheckInRecord, Milestone, Task } from "@/lib/types";

export default async function StudentDashboardPage() {
  const locale = await getLocale();
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);

  if (!student) {
    return null;
  }

  const [tasks, milestones, checkIns, notes, logs, metrics] = await Promise.all([
    getStudentTasksData(student.id),
    getStudentMilestonesData(student.id),
    getStudentCheckInsData(student.id),
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
  const completionHighlights = buildCompletionHighlights(locale, tasks, milestones, checkIns);
  const praiseLine = pickPraiseLine(locale, student.name, completionHighlights.length);

  return (
    <RoleShell
      session={session}
      title={pickText(locale, `Welcome back, ${student.name.split(" ")[0]}`, `欢迎回来，${student.name.split(" ")[0]}`)}
      subtitle={pickText(locale, `Your journey toward ${student.dreamSchools[0]} is ${metrics.completion}% complete. Stay rooted, keep growing.`, `你前往 ${student.dreamSchools[0]} 的申请旅程已完成 ${metrics.completion}%。继续稳步向前。`)}
      activeHref="/student/dashboard"
      hero={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <HeroBadge icon={<Target className="h-4 w-4" />} title={pickText(locale, "Goal school", "梦校")} value={student.dreamSchools[0]} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        <StatCard label={pickText(locale, "Task completion", "任务完成率")} value={`${metrics.completion}%`} hint={pickText(locale, "Calculated from completed tasks against the full task list.", "根据全部任务中的已完成数量实时计算。")} />
        <StatCard label={pickText(locale, "Check-in streak", "连续打卡")} value={pickText(locale, `${metrics.checkInStreak} days`, `${metrics.checkInStreak} 天`)} hint={pickText(locale, "Calculated from consecutive check-in dates.", "根据连续打卡日期实时计算。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Mastery average", "平均掌握度")} value={`${metrics.masteryAverage}/5`} hint={pickText(locale, "Calculated from saved mastery scores in check-ins.", "根据已保存的打卡掌握度分数实时计算。")} tone="secondary" />
      </div>

      <div className="mt-6 sm:mt-8">
        <SectionCard
          title={pickText(locale, "Journey Snapshot", "申请旅程总览")}
          eyebrow={pickText(locale, "Year view", "年视图")}
          action={<HeroBadge icon={<CalendarRange className="h-4 w-4" />} title={pickText(locale, "Active Lanes", "活跃分栏")} value={`${activeLaneCount}/5`} />}
        >
          <TaskGanttChart tasks={ganttTasks} milestones={ganttMilestones} view="year" rangeStart={ganttRange.start} />
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title={pickText(locale, "Today's Tasks", "当前任务")} eyebrow={pickText(locale, "Student workflow", "学生流程")}>
          <TaskList tasks={tasks} />
        </SectionCard>

        <SectionCard title={pickText(locale, "Application Progress", "申请进度")} eyebrow={pickText(locale, "Snapshot", "概览")} className="bg-primary-container/70">
          <div className="space-y-4 sm:space-y-5">
            <div className="rounded-[1.4rem] bg-white/70 p-4 sm:rounded-3xl sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Phase", "阶段")}</p>
              <p className="mt-2 font-serif text-2xl font-bold text-primary sm:text-3xl">{student.phase}</p>
            </div>
            <div className="rounded-[1.4rem] bg-white/70 p-4 sm:rounded-3xl sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Target major", "目标专业")}</p>
              <p className="mt-2 text-base font-bold text-foreground sm:text-lg">{student.intendedMajor}</p>
            </div>
            <InfoPill icon={<Sparkles className="h-4 w-4" />} label={pickText(locale, "AI assistant and logs are live", "AI 助手和日志系统已上线")} />
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title={pickText(locale, "Recent Milestones", "近期截止日期")} eyebrow={pickText(locale, "Timeline", "时间线")}>
          <TimelineRail milestones={milestones} />
        </SectionCard>

        <div className="space-y-8">
          <AiChatWidget studentId={student.id} />
          <AiRecommendationPanel
            studentId={student.id}
            page="/student/dashboard"
            feature="student_dashboard_recommendation"
            prompt="请根据当前任务、截止日期和打卡节奏，生成这位学生本周最重要的行动建议。"
            title={pickText(locale, "Weekly Action Suggestions", "本周行动建议")}
            description={pickText(
              locale,
              "Generate the three to five most important actions for this week, based on deadlines, task priority, and study rhythm.",
              "根据截止日期、任务优先级和学习节奏，生成这周最值得先做的 3-5 个动作。"
            )}
            buttonLabel={pickText(locale, "Generate Weekly Plan", "生成本周建议")}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[1fr_1fr]">
        <SectionCard title={pickText(locale, "Advisor Momentum Notes", "顾问跟进备注")} eyebrow={pickText(locale, "Human support", "人工支持")}>
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
                <p className="text-sm font-bold text-foreground">{note.title}</p>
                <p className="mt-2 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">{note.summary}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={pickText(locale, "Completed Highlights", "最近完成内容")} eyebrow={pickText(locale, "Momentum you already created", "你已经完成的推进")}>
          <div className="rounded-[1.4rem] bg-primary/6 p-4 sm:rounded-3xl sm:p-5">
            <p className="text-base font-bold text-foreground sm:text-lg">{praiseLine.title}</p>
            <p className="mt-2 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">{praiseLine.body}</p>
          </div>
          <div className="mt-4 space-y-3 sm:mt-5">
            {completionHighlights.length > 0 ? (
              completionHighlights.map((item) => (
                <div key={`${item.type}-${item.title}-${item.date}`} className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                      {item.type}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-outline">{item.date}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-2 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">{item.note}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
                {pickText(
                  locale,
                  "Once you complete tasks, deadlines, or solid study check-ins, your recent wins will show up here.",
                  "完成任务、截止日期或表现不错的学习打卡后，这里就会开始显示你的最近成果。"
                )}
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 sm:mt-8">
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

function buildCompletionHighlights(locale: "en" | "zh", tasks: Task[], milestones: Milestone[], checkIns: CheckInRecord[]) {
  const completedTasks = tasks
    .filter((task) => task.status === "done")
    .sort((left, right) => right.dueDate.localeCompare(left.dueDate))
    .slice(0, 2)
    .map((task) => ({
      type: pickText(locale, "Task", "任务"),
      date: task.dueDate,
      title: task.title,
      note: task.description || pickText(locale, "You pushed this task across the finish line.", "你已经把这项任务真正推进到完成了。"),
    }));

  const completedMilestones = milestones
    .filter((milestone) => milestone.status === "done")
    .sort((left, right) => right.eventDate.localeCompare(left.eventDate))
    .slice(0, 1)
    .map((milestone) => ({
      type: pickText(locale, "Deadline", "截止日期"),
      date: milestone.eventDate,
      title: milestone.title,
      note: pickText(locale, "A key deadline or milestone is already complete.", "一个重要的节点已经顺利完成了。"),
    }));

  const strongCheckIns = checkIns
    .filter((record) => record.mastery >= 4)
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 1)
    .map((record) => ({
      type: pickText(locale, "Check-in", "打卡"),
      date: record.date,
      title: `${record.curriculum} · ${record.chapter}`,
      note: pickText(locale, `You logged a strong ${record.mastery}/5 mastery check-in here.`, `这里留下了一次表现不错的 ${record.mastery}/5 学习打卡。`),
    }));

  return [...completedTasks, ...completedMilestones, ...strongCheckIns].slice(0, 4);
}

function pickPraiseLine(locale: "en" | "zh", studentName: string, completedCount: number) {
  const firstName = studentName.split(" ")[0];
  const zhVariants = [
    {
      title: `今天也在稳稳推进，${firstName}。`,
      body: "你不是在空想计划，而是真的把事情一件件往前推。这种踏实的推进感，本身就很厉害。",
    },
    {
      title: "这不是小进步，这是在积累底气。",
      body: "完成的内容越具体，你接下来就越不容易慌。先看到已经做到的，再继续往前走。",
    },
    {
      title: "做得很好，节奏已经起来了。",
      body: "能把任务真正做完，比把计划写得很满更有价值。你现在就在一点点把压力变成进展。",
    },
    {
      title: "你已经在把事情做成了。",
      body: "每一个已完成的节点，都会让后面的路更清楚。别急着否定自己，这些完成都很有分量。",
    },
    {
      title: "先夸一下你，这些完成都很真实。",
      body: "不是每个人都能在忙的时候还持续推进，你已经做到了，而且做得比自己想象中更稳。",
    },
    {
      title: "继续这样走，你会越来越有掌控感。",
      body: "完成会带来信心，信心又会带来更好的执行。你现在已经进入这个正循环了。",
    },
  ];
  const enVariants = [
    {
      title: `Nice work, ${firstName}.`,
      body: "You are not just making plans. You are actually getting things done, and that kind of progress is worth noticing.",
    },
    {
      title: "This momentum is real.",
      body: "Each completed item makes the next step feel lighter. Keep building on what you already moved forward.",
    },
    {
      title: "You are doing better than you think.",
      body: "Visible progress matters. Finishing even a few important things can change the whole rhythm of the week.",
    },
    {
      title: "This is solid progress.",
      body: "What you completed here is not small. It is proof that your effort is turning into forward motion.",
    },
  ];
  const variants = locale === "zh" ? zhVariants : enVariants;
  const selected = variants[Math.floor(Math.random() * variants.length)];

  if (completedCount === 0) {
    return locale === "zh"
      ? {
          title: "慢一点也没关系，先把第一件事做完。",
          body: "这里很快会开始记录你的完成内容。先推进一个小动作，节奏就会慢慢回来。",
        }
      : {
          title: "A slower start is still a start.",
          body: "This space will begin to fill up as you complete work. One finished step is enough to restart momentum.",
        };
  }

  return selected;
}
