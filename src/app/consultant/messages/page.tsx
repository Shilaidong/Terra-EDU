import { BriefcaseBusiness, MessageSquareDashed } from "lucide-react";

import { AiChatWidget, LogoutButton } from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard } from "@/components/terra-shell";
import { getConsultantOverviewData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantMessagesPage() {
  const locale = await getLocale();
  const session = await requireSession("consultant");
  const overview = await getConsultantOverviewData(session);
  const firstStudent = overview.students[0];

  if (!firstStudent) {
    return (
      <RoleShell
        session={session}
        title={pickText(locale, "Consultant AI Messages", "顾问 AI 提问助手")}
        subtitle={pickText(locale, "This consultant account is waiting for admin assignment before AI can use student context.", "这个顾问账号需要先由管理员分配学生，AI 才能使用真实学生上下文。")}
        activeHref="/consultant/messages"
        hero={<LogoutButton />}
      >
        <SectionCard title={pickText(locale, "No assigned students yet", "还没有分配学生")} eyebrow={pickText(locale, "Admin action needed", "需要管理员操作")}>
          <p className="text-sm leading-7 text-secondary">
            {pickText(locale, "After admin assignment, this page will let the consultant switch between students and ask with the correct context.", "管理员分配学生后，这里就能让顾问切换学生并用正确上下文提问。")}
          </p>
        </SectionCard>
      </RoleShell>
    );
  }

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Consultant AI Messages", "顾问 AI 提问助手")}
      subtitle={pickText(
        locale,
        "Switch between students and ask for planning judgment, next-step guidance, communication framing, or risk readouts.",
        "你可以切换学生，直接问规划判断、下周动作建议、沟通说法，或者风险判断。"
      )}
      activeHref="/consultant/messages"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<BriefcaseBusiness className="h-4 w-4" />} title={pickText(locale, "Students", "学生数")} value={`${overview.students.length}`} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <AiChatWidget
          studentId={firstStudent.id}
          page="/consultant/messages"
          audience="consultant"
          studentOptions={overview.students.map((student) => ({
            id: student.id,
            label: student.name,
            sublabel: `${student.grade} · ${student.school}`,
          }))}
          title={pickText(locale, "Ask with consultant context", "以顾问视角提问")}
          description={pickText(
            locale,
            "The assistant will combine tasks, milestones, check-ins, advisor notes, and application profile details for the selected student.",
            "助手会结合所选学生的任务、截止日期、打卡、顾问备注和申请档案来回答。"
          )}
          buttonLabel={pickText(locale, "Ask as consultant", "以顾问身份提问")}
        />

        <div className="space-y-8">
          <SectionCard
            title={pickText(locale, "Best use cases", "最适合问的问题")}
            eyebrow={pickText(locale, "Consultant workflow", "顾问工作流")}
          >
            <div className="space-y-3">
              {[
                pickText(locale, "What should I focus on in the next student meeting?", "下一次和学生沟通时，我最该抓什么？"),
                pickText(locale, "Given this profile, what is still weak or inconsistent?", "结合这位学生的背景，现在哪一块还偏弱或不一致？"),
                pickText(locale, "How should I frame next week's priorities for the family?", "我该怎么给家长和学生表述下周的重点？"),
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={pickText(locale, "What the AI now sees", "AI 现在会参考什么")}
            eyebrow={pickText(locale, "Grounding signals", "上下文信号")}
          >
            <div className="space-y-3 text-sm leading-7 text-secondary">
              <p>{pickText(locale, "Live tasks, deadlines, and study rhythm", "实时任务、截止日期和学习节奏")}</p>
              <p>{pickText(locale, "Application profile details like curriculum, GPA, competitions, and activities", "申请档案里的课程体系、GPA、竞赛和活动")}</p>
              <p>{pickText(locale, "Advisor notes for the selected student", "所选学生的顾问备注")}</p>
            </div>
          </SectionCard>

          <SectionCard
            title={pickText(locale, "Current default student", "当前默认学生")}
            eyebrow={pickText(locale, "Quick context", "快速上下文")}
          >
            <div className="rounded-2xl bg-white px-4 py-4">
              <p className="font-semibold text-foreground">{firstStudent.name}</p>
              <p className="mt-1 text-sm text-secondary">{firstStudent.grade} · {firstStudent.school}</p>
              <p className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                <MessageSquareDashed className="mr-2 h-3.5 w-3.5" />
                {firstStudent.phase}
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </RoleShell>
  );
}
