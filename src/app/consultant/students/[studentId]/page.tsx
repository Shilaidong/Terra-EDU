import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarRange, GraduationCap, NotebookPen } from "lucide-react";

import {
  CheckInEditorControls,
  ConsultantMeetingSummaryPanel,
  ConsultantMilestoneComposer,
  ConsultantNoteComposer,
  ConsultantPlanningBookEditor,
  ConsultantStudentApplicationProfileEditor,
  ConsultantStudentPicker,
  ConsultantStudentProfileEditor,
  ConsultantTaskComposer,
  ConsultantWeeklyReportPanel,
  LogoutButton,
  MilestoneEditorControls,
  TaskDeleteButton,
  TaskStatusControl,
} from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard, StatCard, SummaryCard, TaskGanttChart, TaskList, TimelineRail } from "@/components/terra-shell";
import {
  getConsultantOverviewData,
  getStudentApplicationProfileData,
  getStudentByIdData,
  getStudentCheckInsData,
  getStudentLiveMetricsData,
  getStudentMilestonesData,
  getStudentNotesData,
  getStudentTasksData,
} from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";
import type { Milestone, Task } from "@/lib/types";

export default async function ConsultantStudentWorkspacePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const locale = await getLocale();
  const session = await requireSession("consultant");
  const { studentId } = await params;
  const [overview, student] = await Promise.all([
    getConsultantOverviewData(session),
    getStudentByIdData(studentId),
  ]);

  if (!student || !overview.students.some((item) => item.id === student.id)) {
    return null;
  }

  const [tasks, milestones, checkIns, notes, metrics, applicationProfile] = await Promise.all([
    getStudentTasksData(student.id),
    getStudentMilestonesData(student.id),
    getStudentCheckInsData(student.id),
    getStudentNotesData(student.id),
    getStudentLiveMetricsData(student.id),
    getStudentApplicationProfileData(student.id),
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
      title={student.name}
      subtitle={pickText(locale, "Consultant workspace for planning, deadlines, check-ins, and advisor notes.", "顾问工作台：集中处理学生规划、截止日期、打卡和顾问备注。")}
      activeHref="/consultant/students"
      hero={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/consultant/students"
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-white px-3 py-2.5 text-xs font-bold text-primary shadow-sm sm:px-4 sm:py-3 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {pickText(locale, "Back to Students", "返回学生列表")}
          </Link>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-surface-container-low px-3 py-3 shadow-sm sm:px-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-outline sm:text-[11px]">{pickText(locale, "Dream School", "梦校")}</p>
              <p className="mt-1 text-xs font-semibold text-foreground sm:text-sm">{student.dreamSchools[0] ?? pickText(locale, "TBD", "待定")}</p>
            </div>
            <div className="hidden h-10 w-px bg-black/10 md:block" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-outline sm:text-[11px]">{pickText(locale, "Risk", "风险")}</p>
              <p
                className={`mt-1 text-xs font-semibold sm:text-sm ${
                  currentStudentSignal.riskLevel === "high"
                    ? "text-error"
                    : currentStudentSignal.riskLevel === "medium"
                      ? "text-tertiary"
                      : "text-primary"
                }`}
              >
                {currentStudentSignal.riskLevel === "high"
                  ? pickText(locale, "high", "高")
                  : currentStudentSignal.riskLevel === "medium"
                    ? pickText(locale, "medium", "中")
                    : pickText(locale, "low", "低")}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        <StatCard label={pickText(locale, "Task completion", "任务完成率")} value={`${metrics.completion}%`} hint={pickText(locale, "Live task completion using the same student-side calculation.", "和学生端使用同一套实时任务完成率计算。")} />
        <StatCard label={pickText(locale, "Check-in streak", "连续打卡")} value={pickText(locale, `${metrics.checkInStreak} days`, `${metrics.checkInStreak} 天`)} hint={pickText(locale, "Current consecutive study rhythm.", "当前连续学习节奏。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Mastery average", "平均掌握度")} value={`${metrics.masteryAverage}/5`} hint={pickText(locale, "Average mastery across saved check-ins.", "根据已保存打卡记录计算平均掌握度。")} tone="secondary" />
      </div>

      <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
        <SectionCard title={pickText(locale, "Workspace Navigation", "工作台导航")} eyebrow={pickText(locale, "Faster switching", "更快切换")}>
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
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
            <div className="space-y-3">
              {[
                { href: "#profile", label: pickText(locale, "Edit student profile", "编辑学生资料") },
                { href: "#application-intake", label: pickText(locale, "Edit application intake", "编辑申请档案") },
                { href: "#planning", label: pickText(locale, "Plan tasks and deadlines", "安排任务与截止日期") },
                { href: "#checkins", label: pickText(locale, "Review check-ins", "查看打卡") },
                { href: "#notes", label: pickText(locale, "Write advisor notes", "记录顾问备注") },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-2xl bg-surface-container-low px-4 py-3 text-xs font-semibold text-primary sm:py-4 sm:text-sm"
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </SectionCard>

        <div className="space-y-8">
          <SectionCard
            title={pickText(locale, "Journey Snapshot", "申请旅程总览")}
            eyebrow={pickText(locale, "Year view", "年视图")}
            action={<HeroBadge icon={<CalendarRange className="h-4 w-4" />} title={pickText(locale, "Active Lanes", "活跃分栏")} value={`${activeLaneCount}/5`} />}
          >
            <TaskGanttChart tasks={ganttTasks} milestones={ganttMilestones} view="year" rangeStart={ganttRange.start} />
          </SectionCard>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8" id="profile">
            <SectionCard title={pickText(locale, "Student Profile", "学生资料")} eyebrow={pickText(locale, "Consultant editable", "顾问可编辑")}>
              <div className="mb-5 rounded-3xl bg-surface-container-low p-4 sm:mb-6 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <img alt={student.name} src={student.avatar} className="h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16" />
                  <div>
                    <p className="font-serif text-2xl font-bold text-foreground sm:text-3xl">{student.name}</p>
                    <p className="mt-1 text-xs text-secondary sm:text-sm">
                      {student.grade} · {student.school}
                    </p>
                  </div>
                </div>
              </div>
              <ConsultantStudentProfileEditor
                studentId={student.id}
                defaultGrade={student.grade}
                defaultSchool={student.school}
                defaultPhase={student.phase}
                defaultCountries={student.targetCountries}
                defaultDreamSchools={student.dreamSchools}
                defaultMajor={student.intendedMajor}
              />
            </SectionCard>

            <SectionCard title={pickText(locale, "Student Summary", "学生摘要")} eyebrow={pickText(locale, "Advisor read", "顾问速览")}>
              <SummaryCard
                title={pickText(locale, `${student.name} is aiming for ${student.dreamSchools[0] ?? "a target school list"}`, `${student.name} 当前目标是 ${student.dreamSchools[0] ?? "一组目标学校"}`)}
                body={pickText(locale, `${student.phase} phase, ${student.intendedMajor} track, ${metrics.completion}% completion, ${metrics.checkInStreak} day streak, and ${metrics.masteryAverage}/5 mastery average.`, `当前阶段为 ${student.phase}，目标专业是 ${student.intendedMajor}，完成率 ${metrics.completion}% ，连续打卡 ${metrics.checkInStreak} 天，平均掌握度 ${metrics.masteryAverage}/5。`)}
                footer={pickText(locale, "This card gives the consultant a fast read before making edits.", "这张卡片用于帮助顾问在修改前快速把握学生现状。")}
              />
              <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Countries", "目标国家")}</p>
                  <p className="mt-2 text-xs text-secondary sm:text-sm">{student.targetCountries.join(", ")}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Goal Schools", "梦校")}</p>
                  <p className="mt-2 text-xs text-secondary sm:text-sm">{student.dreamSchools.join(", ")}</p>
                </div>
              </div>
            </SectionCard>
          </div>

          {applicationProfile ? (
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8" id="application-intake">
              <SectionCard title={pickText(locale, "Application Intake", "申请档案")} eyebrow={pickText(locale, "Consultant editable", "顾问可编辑")}>
                <ConsultantStudentApplicationProfileEditor
                  studentId={student.id}
                  profile={applicationProfile}
                />
              </SectionCard>

              <SectionCard title={pickText(locale, "Application Snapshot", "申请档案摘要")} eyebrow={pickText(locale, "Advisor quick read", "顾问速览")}>
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Citizenship", "国籍")}</p>
                    <p className="mt-2 text-xs text-secondary sm:text-sm">{applicationProfile.citizenship || pickText(locale, "Missing", "待填写")}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Curriculum", "课程体系")}</p>
                    <p className="mt-2 text-xs text-secondary sm:text-sm">{applicationProfile.curriculumSystem || pickText(locale, "Missing", "待填写")}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Competitions", "竞赛数量")}</p>
                    <p className="mt-2 text-xs text-secondary sm:text-sm">
                      {pickText(
                        locale,
                        `${applicationProfile.competitions.filter((item) => item.name.trim()).length} filled`,
                        `已填 ${applicationProfile.competitions.filter((item) => item.name.trim()).length} 条`
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-3 sm:p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Activities", "活动数量")}</p>
                    <p className="mt-2 text-xs text-secondary sm:text-sm">
                      {pickText(
                        locale,
                        `${applicationProfile.activities.filter((item) => item.name.trim()).length} filled`,
                        `已填 ${applicationProfile.activities.filter((item) => item.name.trim()).length} 条`
                      )}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          ) : null}

          {applicationProfile ? (
            <div className="grid gap-8">
              <SectionCard
                title={pickText(locale, "Planning Book", "规划书")}
                eyebrow={pickText(locale, "Consultant editable", "顾问可编辑")}
              >
                <ConsultantPlanningBookEditor
                  studentId={student.id}
                  planningBookMarkdown={applicationProfile.planningBookMarkdown}
                />
              </SectionCard>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8" id="planning">
            <SectionCard title={pickText(locale, "Current Tasks", "当前任务")} eyebrow={pickText(locale, "Consultant editable", "顾问可编辑")}>
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
              <SectionCard title={pickText(locale, "Add Task", "添加任务")} eyebrow={pickText(locale, "Schedule work", "安排工作")}>
                <ConsultantTaskComposer studentId={student.id} />
              </SectionCard>
              <SectionCard title={pickText(locale, "Add Deadline", "添加截止日期")} eyebrow={pickText(locale, "Milestone control", "里程碑管理")}>
                <ConsultantMilestoneComposer studentId={student.id} />
              </SectionCard>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <SectionCard title={pickText(locale, "Deadline Rail", "截止日期轨道")} eyebrow={pickText(locale, "Consultant editable", "顾问可编辑")}>
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
              <SectionCard title={pickText(locale, "Recent Check-ins", "近期打卡")} eyebrow={pickText(locale, "Directly editable", "可直接编辑")}>
                <div className="space-y-4">
                  {checkIns.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
                      {pickText(locale, "No check-ins recorded for this student yet.", "这个学生还没有打卡记录。")}
                    </div>
                  ) : (
                    checkIns.map((record) => (
                      <div key={record.id} className="rounded-2xl bg-surface-container-low p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {record.curriculum} · {record.chapter}
                            </p>
                            <p className="mt-1 text-xs text-secondary sm:text-sm">{record.notes}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-serif text-xl font-bold text-primary sm:text-2xl">{record.mastery}/5</div>
                            <div className="text-[10px] uppercase tracking-[0.18em] text-outline sm:text-xs">{record.date}</div>
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

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8" id="notes">
            <SectionCard title={pickText(locale, "Advisor Notes", "顾问备注")} eyebrow={pickText(locale, "Internal tracking", "内部记录")}>
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
                    {pickText(locale, "No advisor notes yet. Add one from the quick action panel.", "还没有顾问备注，可以从右侧操作区新增。")}
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
                      <p className="text-sm font-bold text-foreground">{note.title}</p>
                      <p className="mt-2 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">{note.summary}</p>
                      <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-outline sm:text-xs">{note.createdAt.slice(0, 10)}</p>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <div className="space-y-8">
              <SectionCard title={pickText(locale, "Add Advisor Note", "添加顾问备注")} eyebrow={pickText(locale, "Consultant log", "顾问日志")}>
                <ConsultantNoteComposer studentId={student.id} />
              </SectionCard>
              <SectionCard title={pickText(locale, "Why this workspace matters", "为什么这个工作台重要")} eyebrow={pickText(locale, "Future-ready structure", "可持续扩展结构")}>
                <SummaryCard
                  title={pickText(locale, "One student, one operating surface", "一个学生，一个完整操作面板")}
                  body={pickText(locale, "As the consultant portfolio grows, the key is reducing context switching. This workspace keeps selection, reading, and editing around the same student in one place.", "随着顾问管理的学生越来越多，关键是减少来回切换上下文。这个工作台把查看、阅读和编辑都围绕同一个学生集中起来。")}
                  footer={pickText(locale, "The next upgrade can add bulk actions and a stronger risk queue without changing this route.", "下一步可以继续加批量操作和风险队列，而不需要推翻这个路由。")}
                />
              </SectionCard>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
            <SectionCard title={pickText(locale, "AI Weekly Report", "AI 学生周报")} eyebrow={pickText(locale, "Consultant summary", "顾问摘要")}>
              <ConsultantWeeklyReportPanel studentId={student.id} studentName={student.name} />
            </SectionCard>

            <SectionCard title={pickText(locale, "AI Meeting Summary", "AI 会议摘要")} eyebrow={pickText(locale, "Transcript organizer", "转写整理")}>
              <ConsultantMeetingSummaryPanel studentId={student.id} studentName={student.name} />
            </SectionCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
            <SectionCard title={pickText(locale, "Parent View Preview", "家长视角预览")} eyebrow={pickText(locale, "Family-facing readout", "家长可见内容")}>
              <SummaryCard
                title={pickText(locale, `${student.name} is currently in ${student.phase}`, `${student.name} 当前处于 ${student.phase}`)}
                body={pickText(locale, `A parent opening the family dashboard should mainly see three things: ${metrics.completion}% progress, ${metrics.checkInStreak} day check-in rhythm, and the next deadline "${currentStudentSignal.nextDeadlineTitle}" on ${currentStudentSignal.nextDeadlineLabel}.`, `家长打开仪表盘时，最重要的是看到这三件事：当前进度 ${metrics.completion}% 、连续打卡 ${metrics.checkInStreak} 天，以及下一个截止日期“${currentStudentSignal.nextDeadlineTitle}”（${currentStudentSignal.nextDeadlineLabel}）。`)}
                footer={pickText(locale, "Use this preview to sanity-check whether consultant edits are clear enough for family visibility.", "你可以用这个预览检查顾问修改后的内容是否足够清晰，方便家长理解。")}
              />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Latest note preview", "最新备注预览")}</p>
                  <p className="mt-2 text-sm text-secondary">{notes[0]?.summary ?? pickText(locale, "No advisor note written yet.", "还没有顾问备注。")}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Current risk", "当前风险")}</p>
                  <p className="mt-2 text-sm text-secondary">
                    {pickText(
                      locale,
                      `${currentStudentSignal.riskLevel} risk with score ${currentStudentSignal.riskScore}`,
                      `${currentStudentSignal.riskLevel === "high" ? "高" : currentStudentSignal.riskLevel === "medium" ? "中" : "低"}风险，评分 ${currentStudentSignal.riskScore}`
                    )}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard title={pickText(locale, "Consultant Focus Queue", "顾问关注队列")} eyebrow={pickText(locale, "Second-version workflow", "第二版工作流")}>
              <div className="space-y-4">
                <div className="rounded-2xl bg-surface-container-low p-5">
                  <p className="font-bold text-foreground">{pickText(locale, "Why this student is ordered here", "这个学生为什么排在这里")}</p>
                  <p className="mt-2 text-sm leading-7 text-secondary">
                    {pickText(locale, "Risk sorting now considers completion, streak, mastery, open work, and deadline pressure together instead of only looking at one number.", "风险排序现在会综合考虑完成率、连续打卡、掌握度、未完成任务和截止日期压力，而不是只看单一指标。")}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-5">
                  <p className="font-bold text-foreground">{pickText(locale, "Next best consultant move", "下一步最适合的顾问动作")}</p>
                  <p className="mt-2 text-sm leading-7 text-secondary">
                    {pickText(locale, "If the next deadline is close, use a template to create structured work immediately. If study rhythm is weak, review check-ins and leave an advisor note before changing the plan.", "如果下一个截止日期很近，就优先用模板快速创建结构化任务；如果学习节奏偏弱，就先查看打卡并写顾问备注，再决定是否调整计划。")}
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="rounded-3xl bg-surface-container-low p-6">
            <div className="flex flex-wrap items-center gap-3 text-primary">
              <GraduationCap className="h-5 w-5" />
              <NotebookPen className="h-5 w-5" />
              <Link href="/consultant/students" className="inline-flex items-center gap-2 text-sm font-bold">
                <ArrowLeft className="h-4 w-4" />
                {pickText(locale, "Back to cohort table", "返回学生总表")}
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
