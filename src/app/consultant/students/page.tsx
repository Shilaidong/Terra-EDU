/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

import { ConsultantTaskComposer, LogoutButton } from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard, StatCard, TimelineRail } from "@/components/terra-shell";
import { getConsultantOverviewData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantStudentsPage() {
  const locale = await getLocale();
  const session = await requireSession("consultant");
  const overview = await getConsultantOverviewData();
  const firstStudent = overview.students[0];
  const upcomingMilestones = overview.milestones
    .filter((milestone) => milestone.status !== "done")
    .slice(0, 6);

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Student Management", "学生管理")}
      subtitle={pickText(locale, "Monitor student progress, add tasks, review phase transitions, and keep a traceable record of cohort operations.", "查看学生进度、安排任务、跟进阶段变化，并保留可追踪的顾问操作记录。")}
      activeHref="/consultant/students"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<BriefcaseBusiness className="h-4 w-4" />} title={pickText(locale, "Cohort size", "学生总数")} value={`${overview.students.length}`} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label={pickText(locale, "Active students", "活跃学生")} value={`${overview.students.length}`} hint={pickText(locale, "Consultant portfolio view.", "顾问名下学生概览。")} />
        <StatCard label={pickText(locale, "Open tasks", "未完成任务")} value={`${overview.tasks.filter((task) => task.status !== "done").length}`} hint={pickText(locale, "Across all students.", "统计全部学生的任务。")} tone="tertiary" />
        <StatCard label={pickText(locale, "At risk", "风险学生")} value={`${overview.analytics.atRiskCount}`} hint={pickText(locale, "Calculated from low completion, short streaks, or weak mastery.", "根据低完成率、短打卡连续天数或低掌握度计算。")} tone="secondary" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title={pickText(locale, "Student table", "学生列表")} eyebrow={pickText(locale, "Cohort", "学生群组")}>
          <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-secondary">
                <tr>
                  <th className="px-4 py-3">{pickText(locale, "Student", "学生")}</th>
                  <th className="px-4 py-3">{pickText(locale, "Goal", "目标")}</th>
                  <th className="px-4 py-3">{pickText(locale, "Study rhythm", "学习节奏")}</th>
                  <th className="px-4 py-3">{pickText(locale, "Risk", "风险")}</th>
                  <th className="px-4 py-3">{pickText(locale, "Completion", "完成率")}</th>
                </tr>
              </thead>
              <tbody>
                {overview.students.map((student) => (
                  <tr key={student.id} className="border-t border-black/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img alt={student.name} src={student.avatar} className="h-10 w-10 rounded-full object-cover" />
                        <div>
                          <p className="font-semibold text-foreground">{student.name}</p>
                          <p className="text-xs text-secondary">
                            {student.grade} · {student.school}
                          </p>
                          <Link href={`/consultant/students/${student.id}`} className="mt-1 inline-block text-xs font-bold text-primary">
                            {pickText(locale, "Open workspace", "打开工作台")}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      <p className="font-semibold text-foreground">{student.dreamSchools[0] ?? pickText(locale, "No goal school yet", "尚未设置梦校")}</p>
                      <p className="text-xs text-secondary">{student.intendedMajor}</p>
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      <p>{pickText(locale, `${student.checkInStreak} day streak`, `连续 ${student.checkInStreak} 天`)}</p>
                      <p className="text-xs text-secondary">{pickText(locale, `Mastery ${student.masteryAverage}/5`, `掌握度 ${student.masteryAverage}/5`)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                            student.riskLevel === "high"
                              ? "bg-error/10 text-error"
                              : student.riskLevel === "medium"
                                ? "bg-tertiary/15 text-tertiary"
                                : "bg-primary/10 text-primary"
                          }`}
                        >
                          {student.riskLevel === "high"
                            ? pickText(locale, "high", "高")
                            : student.riskLevel === "medium"
                              ? pickText(locale, "medium", "中")
                              : pickText(locale, "low", "低")}
                        </div>
                        <p className="text-xs text-secondary">{student.nextDeadlineLabel}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">{student.completion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title={pickText(locale, `${firstStudent.name} snapshot`, `${firstStudent.name} 概览`)} eyebrow={pickText(locale, "Writable", "可编辑")}>
          <div className="space-y-4">
            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{pickText(locale, "Current phase", "当前阶段")}</p>
              <p className="mt-2 font-serif text-2xl font-bold text-foreground">{firstStudent.phase}</p>
              <p className="mt-3 text-sm text-secondary">
                {pickText(locale, `${firstStudent.name} is targeting ${firstStudent.dreamSchools[0]} for ${firstStudent.intendedMajor}.`, `${firstStudent.name} 正在以 ${firstStudent.dreamSchools[0]} 为目标，申请方向是 ${firstStudent.intendedMajor}。`)}
              </p>
            </div>
            <ConsultantTaskComposer studentId={firstStudent.id} />
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title={pickText(locale, "Upcoming deadlines", "即将到来的截止日期")} eyebrow={pickText(locale, "Student milestone sync", "学生里程碑同步")}>
          <TimelineRail milestones={upcomingMilestones} />
        </SectionCard>

        <SectionCard title={pickText(locale, "Consultant reading of student changes", "顾问如何理解学生变化")} eyebrow={pickText(locale, "What is now reflected", "当前已同步内容")}>
          <div className="space-y-4">
            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="font-bold text-foreground">{pickText(locale, "Live completion is already aligned", "实时完成率已经同步")}</p>
              <p className="mt-2 text-sm leading-7 text-secondary">
                {pickText(locale, "The completion, streak, and mastery values here now follow the same live task and check-in logic used on the student dashboard.", "这里的完成率、连续打卡和掌握度，已经和学生端仪表盘使用同一套实时计算逻辑。")}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="font-bold text-foreground">{pickText(locale, "Deadlines matter more now", "截止日期现在更关键")}</p>
              <p className="mt-2 text-sm leading-7 text-secondary">
                {pickText(locale, "Since milestones are now editable deadlines in the student timeline, the consultant view should surface them directly instead of only showing generic task counts.", "因为学生端的里程碑已经变成可编辑的截止日期，顾问端也应该直接展示这些信息，而不只是显示笼统的任务数量。")}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </RoleShell>
  );
}
