import { FileText } from "lucide-react";

import { LogoutButton, StudentApplicationProfileEditor } from "@/components/client-tools";
import { HeroBadge, Notice, RoleShell, SectionCard, StatCard } from "@/components/terra-shell";
import { getCurrentStudentData, getRecentAuditLogsData, getStudentApplicationProfileData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";
import type { StudentApplicationProfile } from "@/lib/types";

export default async function StudentDocumentsPage() {
  const locale = await getLocale();
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);
  if (!student) return null;

  const [applicationProfile, logs] = await Promise.all([
    getStudentApplicationProfileData(student.id),
    getRecentAuditLogsData(8),
  ]);

  if (!applicationProfile) return null;

  const completion = calculateApplicationProfileCompletion(applicationProfile);

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Application Documents", "申请材料")}
      subtitle={pickText(
        locale,
        "Capture the core application information that keeps your student profile complete and ready for advising.",
        "先把申请材料里最核心的个人、学校、竞赛和活动信息填完整，方便后续顾问整理与申请准备。"
      )}
      activeHref="/student/documents"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge
            icon={<FileText className="h-4 w-4" />}
            title={pickText(locale, "Profile completion", "材料完整度")}
            value={`${completion}%`}
          />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          label={pickText(locale, "Current school", "当前学校")}
          value={student.school}
          hint={pickText(locale, "Synced from your settings profile.", "已和设置页中的学校信息同步。")}
        />
        <StatCard
          label={pickText(locale, "Curriculum", "课程体系")}
          value={applicationProfile.curriculumSystem || pickText(locale, "Missing", "待填写")}
          hint={pickText(locale, "Useful for organizing AP, A-Level, and IBDP coursework.", "这会帮助整理 AP、A-Level 和 IBDP 的课程信息。")}
          tone="tertiary"
        />
        <StatCard
          label={pickText(locale, "Competitions filled", "竞赛已填")}
          value={pickText(
            locale,
            `${applicationProfile.competitions.filter((item) => item.name.trim()).length}/10`,
            `${applicationProfile.competitions.filter((item) => item.name.trim()).length}/10`
          )}
          hint={pickText(locale, "Competition slots for awards, olympiads, and academic contests.", "适合填写竞赛、奖项和学术比赛经历。")}
          tone="secondary"
        />
        <StatCard
          label={pickText(locale, "Activities filled", "活动已填")}
          value={pickText(
            locale,
            `${applicationProfile.activities.filter((item) => item.name.trim()).length}/20`,
            `${applicationProfile.activities.filter((item) => item.name.trim()).length}/20`
          )}
          hint={pickText(locale, "Common App style activity slots.", "Common App 风格活动栏位。")}
          tone="secondary"
        />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title={pickText(locale, "Common App style student profile", "Common App 风格学生档案")}
          eyebrow={pickText(locale, "Structured input", "结构化录入")}
        >
          <StudentApplicationProfileEditor profile={applicationProfile} />
        </SectionCard>

        <div className="space-y-8">
          <SectionCard
            title={pickText(locale, "How to fill this out", "填写建议")}
            eyebrow={pickText(locale, "Student profile", "学生档案")}
          >
            <Notice title={pickText(locale, "Student-friendly reminder", "学生填写提示")}>
              {pickText(
                locale,
                "You do not need to finish everything today. Start with identity, school, curriculum, competitions, and activities, then refine the rest with your consultant later.",
                "你不用今天就把所有材料都填完。先把身份信息、学校信息、课程体系、竞赛和活动填清楚，后面再和顾问一起慢慢补全。"
              )}
            </Notice>
          </SectionCard>

          <SectionCard
            title={pickText(locale, "Best fields to fill first", "最值得优先填写的内容")}
            eyebrow={pickText(locale, "Priority order", "优先填写")}
          >
            <div className="space-y-3">
              {[
                pickText(locale, "Citizenship and passport country", "国籍与护照国家"),
                pickText(locale, "Current high school and curriculum system", "当前高中与课程体系"),
                pickText(locale, "Graduation year, GPA, and class rank", "毕业年份、GPA 和年级排名"),
                pickText(locale, "Top competitions and the strongest activities", "最重要的竞赛与最强活动经历"),
                pickText(locale, "Major interests and advisor-verified profile basics", "专业方向兴趣与顾问已确认的基础信息"),
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={pickText(locale, "Recent profile-related activity", "最近材料相关更新")}
            eyebrow={pickText(locale, "Audit trail", "审计记录")}
          >
            <div className="space-y-3">
              {logs.slice(0, 6).map((log) => (
                <div key={log.id} className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{log.action}</p>
                  <p className="text-xs text-secondary">{log.inputSummary}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </RoleShell>
  );
}

function calculateApplicationProfileCompletion(profile: StudentApplicationProfile) {
  const scalarEntries = Object.entries(profile).filter(
    ([key, value]) => key !== "studentId" && !Array.isArray(value)
  );
  const scalarCompleted = scalarEntries.filter(([, value]) => String(value).trim()).length;
  const competitionsCompleted = profile.competitions.some((item) =>
    [item.name, item.field, item.year, item.level, item.result].some((value) => value.trim())
  )
    ? 1
    : 0;
  const activitiesCompleted = profile.activities.some((item) =>
    [item.name, item.role, item.grades, item.timeCommitment, item.impact].some((value) => value.trim())
  )
    ? 1
    : 0;
  const total = scalarEntries.length + 2;
  return Math.round(((scalarCompleted + competitionsCompleted + activitiesCompleted) / total) * 100);
}
