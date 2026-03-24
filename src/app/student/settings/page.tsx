/* eslint-disable @next/next/no-img-element */
import { Settings2 } from "lucide-react";

import { AiRecommendationPanel, LogoutButton, StudentProfileEditor } from "@/components/client-tools";
import { AuditFeed, HeroBadge, InfoPill, RoleShell, SectionCard } from "@/components/terra-shell";
import { getCurrentStudentData, getRecentAuditLogsData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";

export default async function StudentSettingsPage() {
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);
  if (!student) return null;
  const logs = await getRecentAuditLogsData(6);

  return (
    <RoleShell
      session={session}
      title="Student Profile & AI Twin"
      subtitle="Manage academic identity, goals, and the light AI twin summary while preserving the original Terra visual direction."
      activeHref="/student/settings"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<Settings2 className="h-4 w-4" />} title="Profile strength" value="84%" />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <SectionCard title={student.name} eyebrow={student.grade}>
          <div className="flex flex-col items-center text-center">
            <img alt={student.name} src={student.avatar} className="h-32 w-32 rounded-full object-cover ring-4 ring-primary-fixed" />
            <p className="mt-4 font-semibold text-primary">{student.school}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {student.targetCountries.map((country) => (
                <InfoPill key={country} label={country} />
              ))}
            </div>
            <div className="mt-6 w-full rounded-3xl bg-surface-container-low p-5 text-left">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">Dream schools</p>
              <ul className="mt-3 space-y-2 text-sm text-secondary">
                {student.dreamSchools.map((school) => (
                  <li key={school}>{school}</li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-8">
          <SectionCard title="Editable goals" eyebrow="Profile preferences">
            <StudentProfileEditor
              studentId={student.id}
              defaultName={student.name}
              defaultGrade={student.grade}
              defaultSchool={student.school}
              defaultCountries={student.targetCountries}
              defaultDreamSchools={student.dreamSchools}
              defaultMajor={student.intendedMajor}
              defaultAvatar={student.avatar}
            />
          </SectionCard>

          <AiRecommendationPanel
            studentId={student.id}
            page="/student/settings"
            feature="student_profile_ai_twin"
            prompt="Summarize the student's profile strength, gaps, and next best advising moves."
          />
        </div>
      </div>

      <div className="mt-8">
        <SectionCard title="Recent profile activity" eyebrow="Audit trail">
          <AuditFeed logs={logs} />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
