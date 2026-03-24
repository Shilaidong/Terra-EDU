import { ChartSpline } from "lucide-react";

import { AnalyticsExportButton, LogoutButton } from "@/components/client-tools";
import { AuditFeed, HeroBadge, RoleShell, SectionCard, StatCard, SummaryCard } from "@/components/terra-shell";
import { getAnalyticsData, getRecentAuditLogsData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantAnalyticsPage() {
  const session = await requireSession("consultant");
  const [analytics, logs] = await Promise.all([getAnalyticsData(), getRecentAuditLogsData(6)]);

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
            body="Task completion is holding near 89%, milestone accuracy remains above 90%, and the at-risk set has narrowed. The launch export route emits a simple CSV report and logs the export action for auditability."
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
