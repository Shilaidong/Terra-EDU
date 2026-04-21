import { MessageSquareText } from "lucide-react";

import { AiChatWidget, LogoutButton } from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard } from "@/components/terra-shell";
import { getCurrentStudentData, getStudentApplicationProfileData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function StudentMessagesPage() {
  const locale = await getLocale();
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);

  if (!student) return null;

  const applicationProfile = await getStudentApplicationProfileData(student.id);
  const competitionCount = applicationProfile?.competitions.filter((item) => item.name.trim()).length ?? 0;
  const activityCount = applicationProfile?.activities.filter((item) => item.name.trim()).length ?? 0;

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "AI Messages", "AI 消息助手")}
      subtitle={pickText(
        locale,
        "Ask about priorities, stress, deadlines, materials, or how to move a plan forward. The assistant now reads your tasks, milestones, and application profile together.",
        "你可以在这里问优先级、压力、截止日期、材料准备，或者下一步怎么推进计划。助手现在会一起参考你的任务、截止日期和申请档案。"
      )}
      activeHref="/student/messages"
      hero={
        <div className="flex flex-wrap items-center gap-3">
          <HeroBadge icon={<MessageSquareText className="h-4 w-4" />} title={pickText(locale, "Profile signals", "档案信号")} value={`${competitionCount} / ${activityCount}`} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <AiChatWidget
          studentId={student.id}
          page="/student/messages"
          audience="student"
          title={pickText(locale, "Ask about your plan", "围绕你的申请计划来提问")}
          description={pickText(
            locale,
            "You can ask naturally about deadlines, competitions, activities, school fit, or what to do first this week.",
            "你可以自然地问截止日期、竞赛活动、学校匹配度，或者这周最应该先做什么。"
          )}
          buttonLabel={pickText(locale, "Ask about my plan", "问问我的申请计划")}
        />

        <div className="space-y-8">
          <SectionCard
            title={pickText(locale, "What AI is now reading", "AI 现在会参考什么")}
            eyebrow={pickText(locale, "Student context", "学生上下文")}
          >
            <div className="space-y-3 text-sm leading-7 text-secondary">
              <p>{pickText(locale, "Your current tasks and deadlines", "你当前的任务和截止日期")}</p>
              <p>{pickText(locale, "Recent study center activity and advisor notes", "最近的学习中心记录和顾问备注")}</p>
              <p>{pickText(locale, "Your application profile, including curriculum, GPA, competitions, and activities", "你的申请档案，包括课程体系、GPA、竞赛和活动")}</p>
            </div>
          </SectionCard>

          <SectionCard
            title={pickText(locale, "Good questions to try", "可以直接试的问题")}
            eyebrow={pickText(locale, "Prompt ideas", "提问示例")}
          >
            <div className="space-y-3">
              {[
                pickText(locale, "Based on my current deadlines, what should I do first this week?", "结合我现在的截止日期，这周最应该先做什么？"),
                pickText(locale, "Given my competitions and activities, where is my profile still weak?", "根据我现在的竞赛和活动，我的背景还缺哪一块？"),
                pickText(locale, "How should I balance AP / A-Level / IBDP coursework with application tasks?", "我该怎么平衡 AP / A-Level / IBDP 课程和申请任务？"),
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </RoleShell>
  );
}
