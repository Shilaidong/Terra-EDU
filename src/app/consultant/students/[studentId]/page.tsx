import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarRange, GraduationCap, NotebookPen } from "lucide-react";

import {
  AdvisorNoteEditorControls,
  ConsultantFloatingAiAssistant,
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
  PreviewFoldSection,
  TaskDeleteButton,
  TaskStatusControl,
} from "@/components/client-tools";
import { ReadonlyStudyCenterWorkspace } from "@/components/study-center";
import { HeroBadge, RoleShell, StatCard, SummaryCard, TaskGanttChart, TaskList, TimelineRail } from "@/components/terra-shell";
import {
  getConsultantOverviewData,
  getStudentApplicationProfileData,
  getStudentByIdData,
  getStudentHomeworkTodayQuestion,
  getStudentLiveMetricsData,
  getStudentMilestonesData,
  getStudentNotesData,
  getStudentStudyCenterData,
  getStudentStudyCenterMetrics,
  getStudentTasksData,
  getStudentVocabularyReviewQueue,
} from "@/lib/data";
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

export default async function ConsultantStudentWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams?: Promise<{ view?: string }>;
}) {
  const locale = await getLocale();
  const session = await requireSession("consultant");
  const { studentId } = await params;
  const currentView = normalizeView((await searchParams)?.view);
  const [overview, student] = await Promise.all([
    getConsultantOverviewData(session),
    getStudentByIdData(studentId),
  ]);

  if (!student || !overview.students.some((item) => item.id === student.id)) {
    return null;
  }

  const [tasks, milestones, notes, metrics, applicationProfile, studyCenter, studyCenterMetrics, reviewQueue, homeworkToday] = await Promise.all([
    getStudentTasksData(student.id),
    getStudentMilestonesData(student.id),
    getStudentNotesData(student.id),
    getStudentLiveMetricsData(student.id),
    getStudentApplicationProfileData(student.id),
    getStudentStudyCenterData(student.id),
    getStudentStudyCenterMetrics(student.id),
    getStudentVocabularyReviewQueue(student.id),
    getStudentHomeworkTodayQuestion(student.id),
  ]);

  const visibleRange = buildVisibleRange(tasks, milestones, currentView);
  const visibleTasks = tasks.filter((task) => taskIntersectsRange(task, visibleRange.start, visibleRange.end));
  const visibleMilestones = milestones
    .map(normalizeMilestoneStatus)
    .filter((milestone) => milestoneIntersectsRange(milestone, visibleRange.start, visibleRange.end));
  const activeLaneCount =
    new Set(visibleTasks.map((task) => task.timelineLane)).size + (visibleMilestones.length > 0 ? 1 : 0);
  const currentStudentSignal = overview.students.find((item) => item.id === student.id) ?? {
    riskLevel: "low" as const,
    riskScore: 0,
    nextDeadlineDate: null,
    nextDeadlineLabel: "No upcoming deadline",
    nextDeadlineTitle: "No upcoming deadline",
  };

  return (
    <RoleShell
      session={session}
      title={student.name}
      subtitle={pickText(locale, "Consultant workspace for planning, deadlines, learning center history, and advisor notes.", "顾问工作台：集中处理学生规划、截止日期、学习中心记录和顾问备注。")}
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
        <StatCard label={pickText(locale, "Study streak", "连续学习")} value={pickText(locale, `${metrics.checkInStreak} days`, `${metrics.checkInStreak} 天`)} hint={pickText(locale, "Current consecutive learning rhythm.", "当前连续学习节奏。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Learning quality", "学习质量")} value={`${metrics.masteryAverage}/5`} hint={pickText(locale, "Average signal across recent vocabulary and reading records.", "根据近期单词与阅读记录计算出的平均学习信号。")} tone="secondary" />
      </div>

      <div className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
        <PreviewFoldSection
          id="navigation"
          title={pickText(locale, "Workspace Navigation", "工作台导航")}
          eyebrow={pickText(locale, "Faster switching", "更快切换")}
          description={pickText(locale, "Jump between the key surfaces of this student without losing context.", "围绕同一个学生快速切换，不需要来回丢失上下文。")}
          defaultOpen
          previewHeightClassName="max-h-[18rem]"
        >
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
                { href: "#journey", label: pickText(locale, "Jump to timeline", "跳到时间轴") },
                { href: "#profile", label: pickText(locale, "Edit student profile", "编辑学生资料") },
                { href: "#application-intake", label: pickText(locale, "Edit application intake", "编辑申请档案") },
                { href: "#planning", label: pickText(locale, "Plan tasks and deadlines", "安排任务与截止日期") },
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
        </PreviewFoldSection>

        <PreviewFoldSection
          id="journey"
          title={pickText(locale, "Journey Snapshot", "申请旅程总览")}
          eyebrow={pickText(locale, "Consultant planning view", "顾问视角规划")}
          description={pickText(locale, "Switch between month, year, and three-year planning windows while staying in the same workspace.", "在同一个工作台里切换月视图、年视图和三年视图。")}
          defaultOpen
          previewHeightClassName="max-h-[32rem]"
          aside={<HeroBadge icon={<CalendarRange className="h-4 w-4" />} title={pickText(locale, "Active Lanes", "活跃分栏")} value={`${activeLaneCount}/5`} />}
        >
          <div className="flex flex-wrap items-center gap-2">
            {viewOptions.map((option) => (
              <Link
                key={option.value}
                href={`/consultant/students/${student.id}?view=${option.value}`}
                className={
                  option.value === currentView
                    ? "rounded-full border-2 border-primary/45 bg-primary/5 px-4 py-2 text-xs font-bold text-primary sm:px-5 sm:text-sm"
                    : "rounded-full border border-outline-variant bg-white px-4 py-2 text-xs font-semibold text-outline transition-colors hover:text-foreground sm:px-5 sm:text-sm"
                }
              >
                {pickText(locale, option.label, option.value === "year" ? "年视图" : option.value === "three_years" ? "三年视图" : "月视图")}
              </Link>
            ))}
          </div>
          <div className="mt-5">
            <TaskGanttChart tasks={visibleTasks} milestones={visibleMilestones} view={currentView} rangeStart={visibleRange.start} />
          </div>
        </PreviewFoldSection>

        <PreviewFoldSection
          id="profile"
          title={pickText(locale, "Student Profile", "学生资料")}
          eyebrow={pickText(locale, "Consultant editable", "顾问可编辑")}
          description={pickText(locale, "Keep profile editing and student summary in one clean surface instead of splitting them into narrow side columns.", "把资料编辑和学生摘要放在同一个清晰版面里，不再压成右侧细竖条。")}
          defaultOpen
          previewHeightClassName="max-h-[24rem]"
        >
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            <div className="rounded-3xl bg-surface-container-low p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <img alt={student.name} src={student.avatar} className="h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16" />
                <div>
                  <p className="font-serif text-2xl font-bold text-foreground sm:text-3xl">{student.name}</p>
                  <p className="mt-1 text-xs text-secondary sm:text-sm">
                    {student.grade} · {student.school}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <ConsultantStudentProfileEditor
                  studentId={student.id}
                  defaultGrade={student.grade}
                  defaultSchool={student.school}
                  defaultPhase={student.phase}
                  defaultCountries={student.targetCountries}
                  defaultDreamSchools={student.dreamSchools}
                  defaultMajor={student.intendedMajor}
                />
              </div>
            </div>

            <div className="space-y-4">
              <SummaryCard
                title={pickText(locale, `${student.name} is aiming for ${student.dreamSchools[0] ?? "a target school list"}`, `${student.name} 当前目标是 ${student.dreamSchools[0] ?? "一组目标学校"}`)}
                body={pickText(locale, `${student.phase} phase, ${student.intendedMajor} track, ${metrics.completion}% completion, ${metrics.checkInStreak} day learning streak, and ${metrics.masteryAverage}/5 learning quality.`, `当前阶段为 ${student.phase}，目标专业是 ${student.intendedMajor}，完成率 ${metrics.completion}% ，连续学习 ${metrics.checkInStreak} 天，学习质量 ${metrics.masteryAverage}/5。`)}
                footer={pickText(locale, "This card gives the consultant a fast read before making edits.", "这张卡片用于帮助顾问在修改前快速把握学生现状。")}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Countries", "目标国家")}</p>
                  <p className="mt-2 text-sm text-secondary">{student.targetCountries.join(", ") || pickText(locale, "TBD", "待定")}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Goal Schools", "梦校")}</p>
                  <p className="mt-2 text-sm text-secondary">{student.dreamSchools.join(", ") || pickText(locale, "TBD", "待定")}</p>
                </div>
              </div>
            </div>
          </div>
        </PreviewFoldSection>

        {applicationProfile ? (
          <PreviewFoldSection
            id="application-intake"
            title={pickText(locale, "Application Intake", "申请档案")}
            eyebrow={pickText(locale, "Consultant editable", "顾问可编辑")}
            description={pickText(locale, "See the most important intake signals first, then expand into the full editable profile below.", "先看最重要的申请档案摘要，再进入完整的可编辑档案。")}
            defaultOpen
            previewHeightClassName="max-h-[26rem]"
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <CompactSnapshotCard label={pickText(locale, "Citizenship", "国籍")} value={applicationProfile.citizenship || pickText(locale, "Missing", "待填写")} />
              <CompactSnapshotCard label={pickText(locale, "Curriculum", "课程体系")} value={applicationProfile.curriculumSystem || pickText(locale, "Missing", "待填写")} />
              <CompactSnapshotCard
                label={pickText(locale, "Competitions", "竞赛数量")}
                value={pickText(
                  locale,
                  `${applicationProfile.competitions.filter((item) => item.name.trim()).length} filled`,
                  `已填 ${applicationProfile.competitions.filter((item) => item.name.trim()).length} 条`
                )}
              />
              <CompactSnapshotCard
                label={pickText(locale, "Activities", "活动数量")}
                value={pickText(
                  locale,
                  `${applicationProfile.activities.filter((item) => item.name.trim()).length} filled`,
                  `已填 ${applicationProfile.activities.filter((item) => item.name.trim()).length} 条`
                )}
              />
            </div>
            <div className="mt-6">
              <ConsultantStudentApplicationProfileEditor studentId={student.id} profile={applicationProfile} />
            </div>
          </PreviewFoldSection>
        ) : null}

        {applicationProfile ? (
          <PreviewFoldSection
            id="planning-book"
            title={pickText(locale, "Planning Book", "规划书")}
            eyebrow={pickText(locale, "Consultant editable", "顾问可编辑")}
            description={pickText(locale, "Keep the long-form strategy in one place and let the student receive the read-only version automatically.", "把长篇规划策略集中在这里，学生端会同步看到只读版本。")}
            defaultOpen
            previewHeightClassName="max-h-[22rem]"
          >
            <ConsultantPlanningBookEditor
              studentId={student.id}
              planningBookMarkdown={applicationProfile.planningBookMarkdown}
            />
          </PreviewFoldSection>
        ) : null}

        <PreviewFoldSection
          id="planning"
          title={pickText(locale, "Tasks and Deadlines", "任务与截止日期")}
          eyebrow={pickText(locale, "Consultant planning surface", "顾问排期面板")}
          description={pickText(locale, "The task list and deadline rail now follow the same active calendar window as the timeline above.", "任务列表和截止日期轨道会跟随上面的当前时间视图切换。")}
          defaultOpen
          previewHeightClassName="max-h-[28rem]"
        >
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            <div className="space-y-6">
              <div className="rounded-3xl bg-surface-container-low p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{pickText(locale, "Task Timeline", "任务时间线")}</p>
                <div className="mt-4 max-h-[22rem] overflow-y-auto pr-1">
                  <TaskList
                    tasks={visibleTasks}
                    action={(taskId) => {
                      const task = visibleTasks.find((item) => item.id === taskId);

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
                </div>
              </div>

              <div className="rounded-3xl bg-surface-container-low p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{pickText(locale, "Deadline Rail", "截止日期轨道")}</p>
                <div className="mt-4 max-h-[20rem] overflow-y-auto pr-1">
                  <TimelineRail
                    milestones={visibleMilestones}
                    action={(milestoneId) => {
                      const milestone = visibleMilestones.find((item) => item.id === milestoneId);

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
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-surface-container-low p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{pickText(locale, "Add Task", "添加任务")}</p>
                <div className="mt-4">
                  <ConsultantTaskComposer studentId={student.id} />
                </div>
              </div>
              <div className="rounded-3xl bg-surface-container-low p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{pickText(locale, "Add Deadline", "添加截止日期")}</p>
                <div className="mt-4">
                  <ConsultantMilestoneComposer studentId={student.id} />
                </div>
              </div>
            </div>
          </div>
        </PreviewFoldSection>

        <PreviewFoldSection
          id="study-center"
          title={pickText(locale, "Learning Center", "学习中心")}
          eyebrow={pickText(locale, "Read-only student training history", "学生训练历史，只读查看")}
          description={pickText(locale, "Review vocabulary rhythm, AI question practice, and reading training in one place without switching into the student account.", "在同一个工作台里查看单词节奏、AI 出题批改和阅读训练，不需要切换到学生账号。")}
          defaultOpen
          previewHeightClassName="max-h-[30rem]"
        >
          <ReadonlyStudyCenterWorkspace
            metrics={studyCenterMetrics}
            studyCenter={studyCenter}
            reviewQueue={reviewQueue}
            homeworkToday={homeworkToday}
          />
        </PreviewFoldSection>

        <PreviewFoldSection
          id="notes"
          title={pickText(locale, "Advisor Notes", "顾问备注")}
          eyebrow={pickText(locale, "Internal tracking", "内部记录")}
          description={pickText(locale, "Consultant notes can now be added, edited, and deleted in place.", "顾问备注现在可以直接新增、修改和删除。")}
          defaultOpen
          previewHeightClassName="max-h-[24rem]"
        >
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <div className="max-h-[24rem] space-y-4 overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-primary/20 bg-white px-5 py-8 text-sm text-secondary">
                  {pickText(locale, "No advisor notes yet. Add one from the note panel on the right.", "还没有顾问备注，可以从右侧备注面板新增。")}
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="rounded-2xl bg-surface-container-low p-4 sm:p-5">
                    <p className="text-sm font-bold text-foreground">{note.title}</p>
                    <p className="mt-2 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">{note.summary}</p>
                    <AdvisorNoteEditorControls note={{ id: note.id, title: note.title, summary: note.summary }} />
                    <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-outline sm:text-xs">{note.createdAt.slice(0, 10)}</p>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-surface-container-low p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{pickText(locale, "Add Advisor Note", "添加顾问备注")}</p>
                <div className="mt-4">
                  <ConsultantNoteComposer studentId={student.id} />
                </div>
              </div>
            </div>
          </div>
        </PreviewFoldSection>

        <PreviewFoldSection
          id="advanced-ai"
          title={pickText(locale, "Advanced AI Tools", "进阶 AI 工具")}
          eyebrow={pickText(locale, "Optional panels", "按需展开")}
          description={pickText(locale, "Weekly report and meeting summary stay available, but no longer force a large always-open block into the page.", "AI 周报和会议摘要仍然保留，但不再强行占据页面主流程。")}
          defaultOpen
          previewHeightClassName="max-h-[22rem]"
        >
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <ConsultantWeeklyReportPanel studentId={student.id} studentName={student.name} />
            <ConsultantMeetingSummaryPanel studentId={student.id} studentName={student.name} />
          </div>
        </PreviewFoldSection>

        <PreviewFoldSection
          id="family-preview"
          title={pickText(locale, "Parent View Preview", "家长视角预览")}
          eyebrow={pickText(locale, "Family-facing readout", "家长可见内容")}
          description={pickText(locale, "Use this to sanity-check whether the student story is clear enough for family communication.", "用这个预览检查学生进度是否已经足够清晰，便于家长理解。")}
          defaultOpen
          previewHeightClassName="max-h-[22rem]"
        >
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="space-y-4">
              <SummaryCard
                title={pickText(locale, `${student.name} is currently in ${student.phase}`, `${student.name} 当前处于 ${student.phase}`)}
                body={pickText(locale, `A parent opening the family dashboard should mainly see three things: ${metrics.completion}% progress, ${metrics.checkInStreak} day learning rhythm, and the next deadline "${currentStudentSignal.nextDeadlineTitle}" on ${currentStudentSignal.nextDeadlineLabel}.`, `家长打开仪表盘时，最重要的是看到这三件事：当前进度 ${metrics.completion}%、连续学习 ${metrics.checkInStreak} 天，以及下一个截止日期“${currentStudentSignal.nextDeadlineTitle}”（${currentStudentSignal.nextDeadlineLabel}）。`)}
                footer={pickText(locale, "Keep the family-facing message calm, specific, and grounded in actual progress.", "家长可见的信息要尽量平静、具体，并且基于真实进度。")}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <CompactSnapshotCard label={pickText(locale, "Latest note preview", "最新备注预览")} value={notes[0]?.summary ?? pickText(locale, "No advisor note written yet.", "还没有顾问备注。")} />
                <CompactSnapshotCard
                  label={pickText(locale, "Current risk", "当前风险")}
                  value={pickText(
                    locale,
                    `${currentStudentSignal.riskLevel} risk with score ${currentStudentSignal.riskScore}`,
                    `${currentStudentSignal.riskLevel === "high" ? "高" : currentStudentSignal.riskLevel === "medium" ? "中" : "低"}风险，评分 ${currentStudentSignal.riskScore}`
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-surface-container-low p-5">
                <p className="font-bold text-foreground">{pickText(locale, "Why this student is ordered here", "这个学生为什么排在这里")}</p>
                <p className="mt-2 text-sm leading-7 text-secondary">
                  {pickText(locale, "Risk sorting now considers completion, study rhythm, learning quality, open work, and deadline pressure together instead of only looking at one number.", "风险排序现在会综合考虑完成率、学习节奏、学习质量、未完成任务和截止日期压力，而不是只看单一指标。")}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-5">
                <p className="font-bold text-foreground">{pickText(locale, "Next best consultant move", "下一步最适合的顾问动作")}</p>
                <p className="mt-2 text-sm leading-7 text-secondary">
                  {pickText(locale, "If the next deadline is close, use a template to create structured work immediately. If study rhythm is weak, review the learning center and leave an advisor note before changing the plan.", "如果下一个截止日期很近，就优先用模板快速创建结构化任务；如果学习节奏偏弱，就先查看学习中心并写顾问备注，再决定是否调整计划。")}
                </p>
              </div>
            </div>
          </div>
        </PreviewFoldSection>

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

      <ConsultantFloatingAiAssistant studentId={student.id} studentName={student.name} />
    </RoleShell>
  );
}

function CompactSnapshotCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{label}</p>
      <p className="mt-2 text-sm leading-7 text-secondary">{value}</p>
    </div>
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
