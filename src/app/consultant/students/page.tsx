/* eslint-disable @next/next/no-img-element */
import { BriefcaseBusiness } from "lucide-react";

import { ConsultantTaskComposer, LogoutButton } from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard, StatCard, TimelineRail } from "@/components/terra-shell";
import { getConsultantOverviewData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantStudentsPage() {
  const session = await requireSession("consultant");
  const overview = await getConsultantOverviewData();
  const firstStudent = overview.students[0];
  const upcomingMilestones = overview.milestones
    .filter((milestone) => milestone.status !== "done")
    .slice(0, 6);

  return (
    <RoleShell
      session={session}
      title="Student Management"
      subtitle="Monitor student progress, add tasks, review phase transitions, and keep a traceable record of cohort operations."
      activeHref="/consultant/students"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<BriefcaseBusiness className="h-4 w-4" />} title="Cohort size" value={`${overview.students.length}`} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Active students" value={`${overview.students.length}`} hint="Consultant portfolio view." />
        <StatCard label="Open tasks" value={`${overview.tasks.filter((task) => task.status !== "done").length}`} hint="Across all students." tone="tertiary" />
        <StatCard label="At risk" value={`${overview.analytics.atRiskCount}`} hint="Calculated from low completion, short streaks, or weak mastery." tone="secondary" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Student table" eyebrow="Cohort">
          <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-secondary">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Goal</th>
                  <th className="px-4 py-3">Study rhythm</th>
                  <th className="px-4 py-3">Completion</th>
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
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      <p className="font-semibold text-foreground">{student.dreamSchools[0] ?? "No goal school yet"}</p>
                      <p className="text-xs text-secondary">{student.intendedMajor}</p>
                    </td>
                    <td className="px-4 py-3 text-secondary">
                      <p>{student.checkInStreak} day streak</p>
                      <p className="text-xs text-secondary">Mastery {student.masteryAverage}/5</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">{student.completion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title={`${firstStudent.name} snapshot`} eyebrow="Writable">
          <div className="space-y-4">
            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Current phase</p>
              <p className="mt-2 font-serif text-2xl font-bold text-foreground">{firstStudent.phase}</p>
              <p className="mt-3 text-sm text-secondary">
                {firstStudent.name} is targeting {firstStudent.dreamSchools[0]} for {firstStudent.intendedMajor}.
              </p>
            </div>
            <ConsultantTaskComposer studentId={firstStudent.id} />
          </div>
        </SectionCard>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Upcoming deadlines" eyebrow="Student milestone sync">
          <TimelineRail milestones={upcomingMilestones} />
        </SectionCard>

        <SectionCard title="Consultant reading of student changes" eyebrow="What is now reflected">
          <div className="space-y-4">
            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="font-bold text-foreground">Live completion is already aligned</p>
              <p className="mt-2 text-sm leading-7 text-secondary">
                The completion, streak, and mastery values here now follow the same live task and check-in logic used on the student dashboard.
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-5">
              <p className="font-bold text-foreground">Deadlines matter more now</p>
              <p className="mt-2 text-sm leading-7 text-secondary">
                Since milestones are now editable deadlines in the student timeline, the consultant view should surface them directly instead of only showing generic task counts.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </RoleShell>
  );
}
