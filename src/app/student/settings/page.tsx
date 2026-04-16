/* eslint-disable @next/next/no-img-element */
import { Settings2 } from "lucide-react";

import { AiRecommendationPanel, LogoutButton, StudentProfileEditor } from "@/components/client-tools";
import { AuditFeed, HeroBadge, InfoPill, RoleShell, SectionCard } from "@/components/terra-shell";
import { getCurrentStudentData, getRecentAuditLogsData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function StudentSettingsPage() {
  const locale = await getLocale();
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);
  if (!student) return null;
  const logs = await getRecentAuditLogsData(6);

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Student Profile & AI Twin", "学生资料与 AI 档案")}
      subtitle={pickText(locale, "Manage academic identity, goals, and the light AI twin summary while preserving the original Terra visual direction.", "管理个人学术资料、目标和轻量 AI 档案摘要，同时保留 Terra 的原始设计风格。")}
      activeHref="/student/settings"
      hero={
        <div className="flex flex-wrap items-center gap-3">
          <HeroBadge icon={<Settings2 className="h-4 w-4" />} title={pickText(locale, "Profile strength", "资料完整度")} value="84%" />
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
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-tertiary">{pickText(locale, "Dream schools", "梦校")}</p>
              <ul className="mt-3 space-y-2 text-sm text-secondary">
                {student.dreamSchools.map((school) => (
                  <li key={school}>{school}</li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>

        <div className="space-y-8">
          <SectionCard title={pickText(locale, "Editable goals", "可编辑目标")} eyebrow={pickText(locale, "Profile preferences", "资料设置")}>
            <StudentProfileEditor
              studentId={student.id}
              defaultName={student.name}
              defaultGrade={student.grade}
              defaultSchool={student.school}
              defaultPhase={student.phase}
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
            prompt="请用中文总结这位学生当前资料的优势、缺口，以及下一步最值得完善的方向。"
            title={pickText(locale, "AI Profile Summary", "AI 档案摘要")}
            description={pickText(locale, "Summarize profile strengths, gaps, and the next most helpful updates.", "总结当前资料的优势、缺口，以及最值得先补齐的下一步。")}
            buttonLabel={pickText(locale, "Generate Profile Summary", "生成档案摘要")}
          />
        </div>
      </div>

      <div className="mt-8">
        <SectionCard title={pickText(locale, "Recent profile activity", "最近资料更新")} eyebrow={pickText(locale, "Audit trail", "审计记录")}>
          <AuditFeed logs={logs} />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
