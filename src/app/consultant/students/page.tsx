/* eslint-disable @next/next/no-img-element */
import { BriefcaseBusiness } from "lucide-react";

import { ConsultantTaskComposer, LogoutButton } from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard, StatCard } from "@/components/terra-shell";
import { getConsultantOverviewData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantStudentsPage() {
  const session = await requireSession("consultant");
  const overview = await getConsultantOverviewData();
  const firstStudent = overview.students[0];

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
        <StatCard label="At risk" value={`${overview.analytics?.atRiskCount ?? 0}`} hint="Derived from latest analytics snapshot." tone="secondary" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Student table" eyebrow="Cohort">
          <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-secondary">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Phase</th>
                  <th className="px-4 py-3">Target major</th>
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
                          <p className="text-xs text-secondary">{student.school}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary">{student.phase}</td>
                    <td className="px-4 py-3 text-secondary">{student.intendedMajor}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{student.completion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title={`Add task for ${firstStudent.name}`} eyebrow="Writable">
          <ConsultantTaskComposer studentId={firstStudent.id} />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
