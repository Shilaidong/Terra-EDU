import { Compass } from "lucide-react";

import { AiRecommendationPanel, ContentFilterTable, LogoutButton } from "@/components/client-tools";
import { HeroBadge, Notice, RoleShell, SectionCard, StatCard } from "@/components/terra-shell";
import { getContentItemsData, getCurrentStudentData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function StudentExplorePage() {
  const locale = await getLocale();
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);
  if (!student) return null;

  const contentItems = await getContentItemsData();

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Major & School Exploration", "专业与学校探索")}
      subtitle={pickText(locale, "Filter through schools, majors, courses, and competitions while AI summarizes where your current profile has the strongest fit.", "筛选学校、专业、课程和竞赛，同时让 AI 帮你总结当前背景最匹配的方向。")}
      activeHref="/student/explore"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<Compass className="h-4 w-4" />} title={pickText(locale, "Focus", "当前关注")} value={student.intendedMajor} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label={pickText(locale, "Content items", "内容条目")} value={`${contentItems.length}`} hint={pickText(locale, "Seeded from the consultant content library.", "来自顾问内容库。")} />
        <StatCard label={pickText(locale, "Target countries", "目标国家")} value={`${student.targetCountries.length}`} hint={student.targetCountries.join(", ")} tone="tertiary" />
        <StatCard label={pickText(locale, "Dream schools", "梦校")} value={`${student.dreamSchools.length}`} hint={pickText(locale, "Visible on student, parent, and consultant views.", "学生、家长和顾问视图都会同步看到。")} tone="secondary" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title={pickText(locale, "Search & filter", "搜索与筛选")} eyebrow={pickText(locale, "Library", "内容库")}>
          <ContentFilterTable items={contentItems} />
        </SectionCard>

        <div className="space-y-8">
          <AiRecommendationPanel
            studentId={student.id}
            page="/student/explore"
            feature="student_explore_recommendation"
            prompt="Recommend schools, majors, and competitions that fit the student's current profile and stated goals."
          />
          <SectionCard title={pickText(locale, "How content enters the product", "内容如何进入产品")} eyebrow={pickText(locale, "Operational note", "运营说明")}>
            <Notice title={pickText(locale, "Launch data source", "首发数据来源")}>
              {pickText(locale, "The first launch uses consultant-side manual entry plus Excel import. That keeps the content maintainable without locking you into a third-party source early.", "首发版本使用顾问手动录入和 Excel 导入的方式，既方便维护内容，也避免过早绑定第三方数据源。")}
            </Notice>
          </SectionCard>
        </div>
      </div>
    </RoleShell>
  );
}
