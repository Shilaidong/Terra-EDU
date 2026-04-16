import { MessageSquareHeart } from "lucide-react";

import { AiChatWidget, LogoutButton } from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard } from "@/components/terra-shell";
import { getParentOverviewData, getStudentApplicationProfileData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function ParentMessagesPage() {
  const locale = await getLocale();
  const session = await requireSession("parent");
  const overview = await getParentOverviewData(session);
  const { student } = overview;

  if (!student) {
    return (
      <RoleShell
        session={session}
        title={pickText(locale, "Parent AI Messages", "家长 AI 沟通助手")}
        subtitle={pickText(locale, "This account is waiting for a student binding before messages can use live context.", "这个账号需要先绑定学生，消息助手才能使用真实上下文。")}
        activeHref="/parent/messages"
        hero={<LogoutButton />}
      >
        <SectionCard title={pickText(locale, "Binding pending", "等待绑定")} eyebrow={pickText(locale, "Admin action needed", "需要管理员操作")}>
          <p className="text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
            {pickText(locale, "Ask the admin to connect this parent account to a student. After that, this page will answer using tasks, deadlines, and application profile data.", "请让管理员先把这个家长账号绑定到学生。绑定后，这里就会用任务、截止日期和申请档案来回答问题。")}
          </p>
        </SectionCard>
      </RoleShell>
    );
  }

  const applicationProfile = await getStudentApplicationProfileData(student.id);

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Parent AI Messages", "家长 AI 沟通助手")}
      subtitle={pickText(
        locale,
        "Ask for a calm parent-facing read of the current plan, deadlines, materials, and the best way to support this week.",
        "你可以在这里用家长视角提问，了解当前计划、截止日期、材料准备，以及这周最适合怎样支持孩子。"
      )}
      activeHref="/parent/messages"
      hero={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <HeroBadge icon={<MessageSquareHeart className="h-4 w-4" />} title={pickText(locale, "Student", "当前学生")} value={student.name} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 sm:gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <AiChatWidget
          studentId={student.id}
          page="/parent/messages"
          audience="parent"
          title={pickText(locale, "Ask from a parent perspective", "从家长视角提问")}
          description={pickText(
            locale,
            "The answer will stay more stable and formal, using the student's tasks, deadlines, and application profile as context.",
            "回答会更稳重、正式，并结合孩子当前的任务、截止日期和申请档案来判断。"
          )}
          buttonLabel={pickText(locale, "Ask as a parent", "以家长身份提问")}
        />

        <div className="space-y-6 sm:space-y-8">
          <SectionCard
            title={pickText(locale, "What this assistant sees", "这个助手会参考什么")}
            eyebrow={pickText(locale, "Family context", "家长上下文")}
          >
            <div className="space-y-3 text-xs leading-6 text-secondary sm:text-sm sm:leading-7">
              <p>{pickText(locale, "Open tasks, milestones, and recent check-ins", "未完成任务、截止日期和最近打卡")}</p>
              <p>{pickText(locale, "Advisor notes and live progress signals", "顾问备注和实时进度信号")}</p>
              <p>
                {pickText(
                  locale,
                  `Application profile basics like curriculum, GPA, competitions, and activities (${applicationProfile?.curriculumSystem || "not filled yet"}).`,
                  `申请档案里的基础信息，比如课程体系、GPA、竞赛和活动（当前课程体系：${applicationProfile?.curriculumSystem || "待填写"}）。`
                )}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title={pickText(locale, "Good questions to try", "推荐试的问题")}
            eyebrow={pickText(locale, "Prompt ideas", "提问示例")}
          >
            <div className="space-y-3">
              {[
                pickText(locale, "What should I pay attention to most this week as a parent?", "作为家长，这周我最应该关注什么？"),
                pickText(locale, "Based on the current profile, where does my child still need support?", "结合现在的背景资料，孩子还缺哪方面支持？"),
                pickText(locale, "How should I help without adding too much pressure?", "我应该怎样支持孩子，而不过度施压？"),
              ].map((item) => (
                  <div key={item} className="rounded-2xl bg-white px-4 py-3 text-xs font-medium text-foreground sm:text-sm">
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
