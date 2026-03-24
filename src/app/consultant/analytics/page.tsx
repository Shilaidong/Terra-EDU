import { ChartSpline } from "lucide-react";

import { AnalyticsExportButton, LogoutButton } from "@/components/client-tools";
import { AuditFeed, HeroBadge, RoleShell, SectionCard, StatCard, SummaryCard } from "@/components/terra-shell";
import { getConsultantOverviewData, getRecentAuditLogsData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantAnalyticsPage() {
  const session = await requireSession("consultant");
  const [overview, logs] = await Promise.all([getConsultantOverviewData(), getRecentAuditLogsData(6)]);
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
      title="Consultant Analytics"
      subtitle="Track cohort health, task completion, milestone accuracy, and export-ready reporting with structured logs."
      activeHref="/consultant/analytics"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<ChartSpline className="h-4 w-4" />} title="Snapshot date" value={analytics.date} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard label="Active students" value={`${analytics.activeStudents}`} hint="Current cohort size." />
        <StatCard label="Task completion" value={`${Math.round(analytics.taskCompletionRate * 100)}%`} hint="Portfolio-wide execution rate." tone="tertiary" />
        <StatCard label="Milestone hit rate" value={`${Math.round(analytics.milestoneHitRate * 100)}%`} hint="Deadline discipline across the cohort." tone="secondary" />
        <StatCard label="At risk" value={`${analytics.atRiskCount}`} hint="Students needing immediate follow-up." />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Reporting Center" eyebrow="Export">
          <SummaryCard
            title="Weekly operating picture"
            body={`Live cohort completion is ${Math.round(analytics.taskCompletionRate * 100)}%, milestone discipline is ${Math.round(analytics.milestoneHitRate * 100)}%, average mastery is ${averageMastery}/5, and the average check-in streak is ${averageStreak} days.`}
            footer="These metrics now follow the same live student task, deadline, and check-in data shown across the product."
          />
          <div className="mt-5">
            <AnalyticsExportButton />
          </div>
        </SectionCard>

        <SectionCard title="Recent analytics activity" eyebrow="Trace log">
          <AuditFeed logs={logs} />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
