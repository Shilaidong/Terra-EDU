import { FileText } from "lucide-react";

import {
  LogoutButton,
  StudentDocumentsWorkspace,
} from "@/components/client-tools";
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
        <StatCard
          label={pickText(locale, "Transcript source", "成绩单原文")}
          value={applicationProfile.transcriptSourceMarkdown.trim() ? pickText(locale, "Added", "已录入") : pickText(locale, "Missing", "待录入")}
          hint={pickText(locale, "Paste markdown transcript text now; real file upload can come later.", "现在先贴 Markdown 成绩单原文，后面再补真实文件上传。")}
          tone="tertiary"
        />
        <StatCard
          label={pickText(locale, "Planning book", "规划书")}
          value={applicationProfile.planningBookMarkdown.trim() ? pickText(locale, "Synced", "已同步") : pickText(locale, "Missing", "待同步")}
          hint={pickText(locale, "Consultants can maintain a long planning book and this page will show it read-only.", "顾问端可以维护长规划书，学生端会在这里只读同步。")}
          tone="secondary"
        />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.12fr_0.88fr]">
        <SectionCard
          title={pickText(locale, "Documents Hub", "材料中心")}
          eyebrow={pickText(locale, "Collapsible sections", "折叠模块")}
        >
          <StudentDocumentsWorkspace studentId={student.id} profile={applicationProfile} />
        </SectionCard>

        <div className="space-y-8">
          <SectionCard
            title={pickText(locale, "How this page works", "这个页面怎么用")}
            eyebrow={pickText(locale, "Compact workflow", "更紧凑的工作流")}
          >
            <Notice title={pickText(locale, "Student-friendly reminder", "学生填写提示")}>
              {pickText(
                locale,
                "Open only the section you need. This keeps the page lighter while still letting you fully edit the details inside each module.",
                "只展开当前需要编辑的模块就可以，这样页面会更轻，也不会一下子把所有材料都摊开。"
              )}
            </Notice>
          </SectionCard>

          <SectionCard
            title={pickText(locale, "Suggested fill order", "建议填写顺序")}
            eyebrow={pickText(locale, "Start here", "先从这里开始")}
          >
            <div className="space-y-3">
              {[
                pickText(locale, "Application profile: identity, school, curriculum, GPA, competitions, and activities", "申请档案：身份、学校、课程体系、GPA、竞赛和活动"),
                pickText(locale, "Transcript intake: paste transcript markdown, then let AI organize it", "成绩单模块：先贴成绩单 Markdown，再让 AI 整理"),
                pickText(locale, "Planning book: review the consultant plan here when it becomes available", "规划书：顾问同步后在这里查看长期规划"),
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
          <SectionCard
            title={pickText(locale, "How these documents help AI", "这些文档如何帮助 AI")}
            eyebrow={pickText(locale, "AI context", "AI 上下文")}
          >
            <Notice title={pickText(locale, "Why this matters", "为什么值得填")}>
              {pickText(
                locale,
                "The transcript markdown and planning book are now part of the AI context. That means the assistant can better understand your academic pattern, curriculum rigor, and the long-form strategy your consultant already wrote.",
                "成绩单 Markdown 和规划书现在都会进入 AI 上下文。也就是说，AI 能更好理解你的学业表现、课程难度，以及顾问已经写好的长期策略。"
              )}
            </Notice>
          </SectionCard>
        </div>
      </div>
    </RoleShell>
  );
}

function calculateApplicationProfileCompletion(profile: StudentApplicationProfile) {
  const scalarEntries = Object.entries(profile).filter(
    ([key, value]) =>
      key !== "studentId" &&
      key !== "transcriptSourceMarkdown" &&
      key !== "transcriptStructuredMarkdown" &&
      key !== "planningBookMarkdown" &&
      !Array.isArray(value)
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
  const transcriptCompleted = profile.transcriptSourceMarkdown.trim() ? 1 : 0;
  const planningBookCompleted = profile.planningBookMarkdown.trim() ? 1 : 0;
  const total = scalarEntries.length + 4;
  return Math.round(
    ((scalarCompleted + competitionsCompleted + activitiesCompleted + transcriptCompleted + planningBookCompleted) /
      total) *
      100
  );
}
