import { Activity } from "lucide-react";

import { CheckInComposer, CheckInEditorControls, LogoutButton } from "@/components/client-tools";
import { HeroBadge, Notice, RoleShell, SectionCard, StatCard } from "@/components/terra-shell";
import { getCurrentStudentData, getStudentCheckInsData, getStudentLiveMetricsData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";

export default async function StudentCheckinPage() {
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);
  if (!student) return null;

  const [checkIns, metrics] = await Promise.all([
    getStudentCheckInsData(student.id),
    getStudentLiveMetricsData(student.id),
  ]);

  return (
    <RoleShell
      session={session}
      title="Daily Task Check-in"
      subtitle="Capture curriculum mastery, chapter notes, and learning momentum without changing the core visual style."
      activeHref="/student/checkin"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<Activity className="h-4 w-4" />} title="Streak" value={`${metrics.checkInStreak} days`} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Average mastery" value={`${metrics.masteryAverage}/5`} hint="Calculated from all saved check-ins." />
        <StatCard label="Recent entries" value={`${checkIns.length}`} hint="Saved server-side with traceable responses." tone="tertiary" />
        <StatCard label="Launch focus" value="Reliable logs" hint="Each save emits actor, page, status, and latency." tone="secondary" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Save today's mastery" eyebrow="Writable">
          <CheckInComposer studentId={student.id} />
        </SectionCard>

        <SectionCard title="Recent study signals" eyebrow="History">
          <div className="space-y-4">
            {checkIns.map((record) => (
              <div key={record.id} className="rounded-2xl bg-surface-container-low p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">
                      {record.curriculum} · {record.chapter}
                    </p>
                    <p className="mt-1 text-sm text-secondary">{record.notes}</p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                    {record.mastery}/5
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
                />
              </div>
            ))}
          </div>
          <div className="mt-5">
            <Notice title="Why this matters">
              These notes flow into the AI summary and consultant analytics so the next recommendation is evidence-based, not guessed.
            </Notice>
          </div>
        </SectionCard>
      </div>
    </RoleShell>
  );
}
