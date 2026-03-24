import { HeartHandshake } from "lucide-react";

import { LogoutButton } from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard, StatCard, TimelineRail } from "@/components/terra-shell";
import { getParentOverviewData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";

export default async function ParentDashboardPage() {
  const session = await requireSession("parent");
  const overview = await getParentOverviewData();
  const { student, tasks, milestones, notes } = overview;

  return (
    <RoleShell
      session={session}
      title={`Welcome back, ${session.name}`}
      subtitle="Here is an updated view of your child's educational progress, milestone rhythm, and recent consultant notes."
      activeHref="/parent/dashboard"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<HeartHandshake className="h-4 w-4" />} title="Current focus" value={student.phase} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Task completion" value={`${student.completion}%`} hint="Calculated from completed tasks without editing privileges." />
        <StatCard label="Milestones met" value={`${milestones.length}`} hint="Upcoming academic checkpoints." tone="tertiary" />
        <StatCard label="Check-in streak" value={`${student.checkInStreak}`} hint="Calculated from consecutive saved check-in dates." tone="secondary" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Application Timeline" eyebrow="Read-only">
          <TimelineRail milestones={milestones} />
        </SectionCard>

        <SectionCard title="Consultation Logs" eyebrow="Advisor sync">
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
        <SectionCard title="Current open tasks" eyebrow="Visibility">
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-2xl bg-surface-container-low p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-foreground">{task.title}</p>
                    <p className="mt-1 text-sm text-secondary">{task.description}</p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-secondary">
                    {task.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </RoleShell>
  );
}
