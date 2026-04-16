import { ChartSpline } from "lucide-react";

import { AnalyticsExportButton, LogoutButton } from "@/components/client-tools";
import { AuditFeed, HeroBadge, RoleShell, SectionCard, StatCard, SummaryCard } from "@/components/terra-shell";
import { getConsultantOverviewData, getRecentAuditLogsData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantAnalyticsPage() {
  const locale = await getLocale();
  const session = await requireSession("consultant");
  const [overview, logs] = await Promise.all([getConsultantOverviewData(session), getRecentAuditLogsData(6)]);
  const analytics = overview.analytics;
  const averageMastery =
    overview.students.length > 0
      ? (overview.students.reduce((sum, student) => sum + student.masteryAverage, 0) / overview.students.length).toFixed(1)
      : "0.0";
  const averageStreak =
    overview.students.length > 0
      ? Math.round(
          overview.students.reduce((sum, student) => sum + student.checkInStreak, 0) / overview.students.length
        )
      : 0;

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Consultant Analytics", "顾问分析")}
      subtitle={pickText(locale, "Track cohort health, task completion, milestone accuracy, and export-ready reporting with structured logs.", "查看学生群组健康度、任务完成率、截止日期达成情况，并导出带结构化日志的报表。")}
      activeHref="/consultant/analytics"
      hero={
        <div className="flex flex-wrap items-center gap-3">
          <HeroBadge icon={<ChartSpline className="h-4 w-4" />} title={pickText(locale, "Snapshot date", "统计日期")} value={analytics.date} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard label={pickText(locale, "Active students", "活跃学生")} value={`${analytics.activeStudents}`} hint={pickText(locale, "Current cohort size.", "当前学生总数。")} />
        <StatCard label={pickText(locale, "Task completion", "任务完成率")} value={`${Math.round(analytics.taskCompletionRate * 100)}%`} hint={pickText(locale, "Portfolio-wide execution rate.", "整个顾问组合的执行率。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Milestone hit rate", "截止日期达成率")} value={`${Math.round(analytics.milestoneHitRate * 100)}%`} hint={pickText(locale, "Deadline discipline across the cohort.", "整个群组的截止日期执行情况。")} tone="secondary" />
        <StatCard label={pickText(locale, "At risk", "风险学生")} value={`${analytics.atRiskCount}`} hint={pickText(locale, "Students needing immediate follow-up.", "需要优先跟进的学生数量。")} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title={pickText(locale, "Reporting Center", "报表中心")} eyebrow={pickText(locale, "Export", "导出")}>
          <SummaryCard
            title={pickText(locale, "Weekly operating picture", "本周运营概览")}
            body={pickText(locale, `Live cohort completion is ${Math.round(analytics.taskCompletionRate * 100)}%, milestone discipline is ${Math.round(analytics.milestoneHitRate * 100)}%, average mastery is ${averageMastery}/5, and the average check-in streak is ${averageStreak} days.`, `当前学生群组任务完成率为 ${Math.round(analytics.taskCompletionRate * 100)}% ，截止日期达成率为 ${Math.round(analytics.milestoneHitRate * 100)}% ，平均掌握度为 ${averageMastery}/5 ，平均连续打卡为 ${averageStreak} 天。`)}
            footer={pickText(locale, "These metrics now follow the same live student task, deadline, and check-in data shown across the product.", "这些指标已经和产品内学生真实任务、截止日期和打卡数据保持一致。")}
          />
          <div className="mt-5">
            <AnalyticsExportButton />
          </div>
        </SectionCard>

        <SectionCard title={pickText(locale, "Recent analytics activity", "最近分析活动")} eyebrow={pickText(locale, "Trace log", "追踪日志")}>
          <AuditFeed logs={logs} />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
