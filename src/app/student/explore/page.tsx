import { BookOpenText, Compass, GraduationCap, School } from "lucide-react";

import { AiRecommendationPanel, LogoutButton } from "@/components/client-tools";
import { HeroBadge, Notice, RoleShell, SectionCard, StatCard } from "@/components/terra-shell";
import { getContentItemsData, getCurrentStudentData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";
import type { ContentItem, StudentRecord } from "@/lib/types";

const schoolDifficultyOrder: ContentItem["difficulty"][] = ["Reach", "Match", "Safety"];

export default async function StudentExplorePage() {
  const locale = await getLocale();
  const session = await requireSession("student");
  const student = await getCurrentStudentData(session);
  if (!student) return null;

  const contentItems = await getContentItemsData();
  const schools = contentItems.filter((item) => item.type === "school");
  const majors = contentItems.filter((item) => item.type === "major");
  const courses = contentItems.filter((item) => item.type === "course");

  const focusMajors = getFocusMajors(majors, student);
  const schoolGroups = schoolDifficultyOrder.map((difficulty) => ({
    difficulty,
    items: schools
      .filter((item) => item.difficulty === difficulty)
      .slice()
      .sort(sortSchoolCards)
      .slice(0, 8),
  }));
  const curriculumGroups = buildCurriculumGroups(courses);

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Explore Your Path", "探索你的申请路径")}
      subtitle={pickText(
        locale,
        "See only the schools, majors, and curriculum tracks that are useful for making your next decision.",
        "这里只展示真正对你下一步选择有帮助的学校、专业和课程体系，不再让你直接看后台内容库。"
      )}
      activeHref="/student/explore"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge
            icon={<Compass className="h-4 w-4" />}
            title={pickText(locale, "Focus", "当前关注")}
            value={student.intendedMajor}
          />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          label={pickText(locale, "Schools", "学校")}
          value={`${schools.length}`}
          hint={pickText(locale, "Student-facing shortlist from the consultant library.", "从顾问内容库整理出的学生可读学校清单。")}
        />
        <StatCard
          label={pickText(locale, "Majors", "专业")}
          value={`${majors.length}`}
          hint={pickText(locale, "Organized around your target major and related directions.", "围绕你的目标专业和相关方向整理。")}
          tone="tertiary"
        />
        <StatCard
          label={pickText(locale, "Curriculum tracks", "课程体系")}
          value={`${curriculumGroups.length}`}
          hint={pickText(locale, "AP, A-Level, and IBDP are grouped into simpler study pathways.", "AP、A-Level 和 IBDP 会按更易理解的学习路径分组。")}
          tone="secondary"
        />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title={pickText(locale, "Recommended for You", "优先看这些")}
          eyebrow={pickText(locale, "Student view", "学生视图")}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <ExploreFocusCard
              icon={<GraduationCap className="h-4 w-4" />}
              title={pickText(locale, "Major directions", "专业方向")}
              subtitle={pickText(locale, "Closest to your current focus", "最贴近你当前目标的方向")}
              items={focusMajors.slice(0, 4).map((item) => item.title)}
            />
            <ExploreFocusCard
              icon={<School className="h-4 w-4" />}
              title={pickText(locale, "Dream school shortlist", "梦校清单")}
              subtitle={pickText(locale, "Matched from your saved goals", "根据你已保存的梦校自动整理")}
              items={getDreamSchoolHighlights(schools, student).slice(0, 4)}
            />
            <ExploreFocusCard
              icon={<BookOpenText className="h-4 w-4" />}
              title={pickText(locale, "Curriculum pathways", "课程路径")}
              subtitle={pickText(locale, "Choose the track you are actually studying", "直接按你正在读的体系来选")}
              items={curriculumGroups.map((group) => `${group.label} · ${group.items.length}`)}
            />
          </div>
        </SectionCard>

        <AiRecommendationPanel
          studentId={student.id}
          page="/student/explore"
          feature="student_explore_recommendation"
          prompt="请根据学生当前背景、目标国家、梦校和专业方向，用中文推荐更适合继续探索的学校、专业和课程体系。输出简洁、直接、可执行。"
          title={pickText(locale, "Explore with AI", "AI 探索建议")}
          description={pickText(
            locale,
            "Generate a Chinese shortlist of what to explore next.",
            "用中文生成下一步更值得探索的学校、专业和课程方向。"
          )}
          buttonLabel={pickText(locale, "Generate Suggestions", "生成探索建议")}
        />
      </div>

      <div className="mt-8 space-y-8">
        <SectionCard
          title={pickText(locale, "School shortlist", "学校清单")}
          eyebrow={pickText(locale, "By difficulty", "按申请难度")}
        >
          <div className="grid gap-4 xl:grid-cols-3">
            {schoolGroups.map((group) => (
              <div key={group.difficulty} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {difficultyLabel(group.difficulty, locale)}
                    </h3>
                    <p className="text-sm text-secondary">
                      {pickText(locale, `${group.items.length} schools`, `${group.items.length} 所学校`)}
                    </p>
                  </div>
                  <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                    {difficultyLabel(group.difficulty, locale)}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <StudentSchoolCard key={item.id} item={item} locale={locale} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={pickText(locale, "Major directions", "专业方向")}
          eyebrow={pickText(locale, "Simplified for students", "学生更易理解的二级列表")}
        >
          <div className="grid gap-4 xl:grid-cols-3">
            <ExploreBucket
              title={pickText(locale, "Closest to your focus", "最贴近你的方向")}
              subtitle={student.intendedMajor}
              items={focusMajors.slice(0, 8).map((item) => ({
                title: item.title,
                subtitle: item.subtitle,
                meta: [
                  item.majorDetails?.degree,
                  item.majorDetails?.stemEligible ? "STEM" : null,
                ].filter(Boolean) as string[],
              }))}
            />
            <ExploreBucket
              title={pickText(locale, "STEM paths", "STEM 方向")}
              subtitle={pickText(locale, "Engineering, science, tech", "工程、科学、技术")}
              items={majors
                .filter((item) => item.majorDetails?.stemEligible)
                .slice(0, 8)
                .map((item) => ({
                  title: item.title,
                  subtitle: item.subtitle,
                  meta: [item.majorDetails?.degree].filter(Boolean) as string[],
                }))}
            />
            <ExploreBucket
              title={pickText(locale, "Interdisciplinary paths", "交叉学科方向")}
              subtitle={pickText(locale, "Mixed backgrounds and broader options", "适合背景混合、选择更宽的方向")}
              items={majors
                .filter((item) => isInterdisciplinaryMajor(item))
                .slice(0, 8)
                .map((item) => ({
                  title: item.title,
                  subtitle: item.subtitle,
                  meta: item.tags.slice(0, 2),
                }))}
            />
          </div>
        </SectionCard>

        <SectionCard
          title={pickText(locale, "Curriculum tracks", "课程体系")}
          eyebrow={pickText(locale, "AP · A-Level · IBDP", "AP · A-Level · IBDP")}
        >
          <div className="grid gap-4 xl:grid-cols-3">
            {curriculumGroups.map((group) => (
              <ExploreBucket
                key={group.key}
                title={group.label}
                subtitle={group.description}
                items={group.items.slice(0, 10).map((item) => ({
                  title: item.title,
                  subtitle: item.subtitle,
                  meta: [
                    item.courseDetails?.provider,
                    item.courseDetails?.format,
                    formatDuration(item.courseDetails?.durationWeeks, locale),
                  ].filter(Boolean) as string[],
                }))}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={pickText(locale, "How to use this page", "学生端应该怎么用")}
          eyebrow={pickText(locale, "Guidance", "使用建议")}
        >
          <Notice title={pickText(locale, "Student-friendly rule", "学生视图规则")}>
            {pickText(
              locale,
              "This page hides the raw consultant library structure. Students should first look at direction, then shortlist, then ask AI for help if they are unsure.",
              "这个页面不会直接展示顾问后台那种原始内容库结构。学生应先看方向，再看清单，如果不确定再用 AI 生成建议。"
            )}
          </Notice>
        </SectionCard>
      </div>
    </RoleShell>
  );
}

function ExploreFocusCard({
  icon,
  title,
  subtitle,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  items: string[];
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-primary">
        {icon}
        {title}
      </div>
      <p className="mb-4 text-sm text-secondary">{subtitle}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-2xl bg-surface-container-low px-3 py-2 text-sm font-medium text-foreground">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExploreBucket({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: { title: string; subtitle: string; meta: string[] }[];
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-secondary">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={`${item.title}-${item.subtitle}`} className="rounded-2xl bg-surface-container-low p-4">
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-secondary">{item.subtitle}</p>
              {item.meta.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.meta.map((meta) => (
                    <span
                      key={meta}
                      className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-secondary"
                    >
                      {meta}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-outline-variant px-4 py-6 text-sm text-secondary">
            暂时没有可展示的内容。
          </div>
        )}
      </div>
    </div>
  );
}

function StudentSchoolCard({
  item,
  locale,
}: {
  item: ContentItem;
  locale: "zh" | "en";
}) {
  const ranking = splitRanking(item.schoolDetails?.ranking);
  const acceptanceRate = formatAcceptanceRate(item.schoolDetails?.acceptanceRate);

  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{item.title}</p>
          <p className="mt-1 text-sm text-secondary">{item.subtitle}</p>
        </div>
        {ranking?.number ? (
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            #{ranking.number}
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {ranking?.source ? <MetaChip label={ranking.source} /> : null}
        {item.country ? <MetaChip label={item.country} /> : null}
        {item.schoolDetails?.city ? <MetaChip label={item.schoolDetails.city} /> : null}
        {acceptanceRate ? <MetaChip label={acceptanceRate} tone="success" /> : null}
        {item.schoolDetails?.tuitionUsd != null ? (
          <MetaChip
            label={
              locale === "zh"
                ? `$${item.schoolDetails.tuitionUsd.toLocaleString()}/年`
                : `$${item.schoolDetails.tuitionUsd.toLocaleString()}/yr`
            }
            tone="primary"
          />
        ) : null}
      </div>
    </div>
  );
}

function MetaChip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "primary" | "success";
}) {
  const className =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "success"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-white text-secondary";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

function getFocusMajors(majors: ContentItem[], student: StudentRecord) {
  const keywords = buildMajorKeywords(student.intendedMajor);
  const matched = majors.filter((item) => {
    const haystack = `${item.title} ${item.subtitle} ${item.tags.join(" ")} ${item.majorDetails?.recommendedBackground ?? ""}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });

  return matched.length ? matched : majors.slice(0, 8);
}

function getDreamSchoolHighlights(schools: ContentItem[], student: StudentRecord) {
  const dreamSchoolNames = student.dreamSchools.map((item) => item.toLowerCase());
  const matches = schools.filter((school) =>
    dreamSchoolNames.some((dream) => school.title.toLowerCase().includes(dream) || school.subtitle.toLowerCase().includes(dream))
  );

  return (matches.length ? matches : schools.slice(0, 4)).map((item) => item.title);
}

function buildMajorKeywords(intendedMajor: string) {
  const normalized = intendedMajor.toLowerCase();
  const parts = normalized.split(/[\s/&,-]+/).map((item) => item.trim()).filter(Boolean);
  return Array.from(new Set([normalized, ...parts].filter((item) => item.length >= 3)));
}

function buildCurriculumGroups(courses: ContentItem[]) {
  const definitions = [
    {
      key: "ap",
      label: "AP",
      description: "Advanced Placement",
      matcher: (item: ContentItem) => courseMatches(item, ["ap", "advanced placement"]),
    },
    {
      key: "alevel",
      label: "A-Level",
      description: "A-Level pathway",
      matcher: (item: ContentItem) => courseMatches(item, ["a-level", "alevel"]),
    },
    {
      key: "ibdp",
      label: "IBDP",
      description: "International Baccalaureate Diploma Programme",
      matcher: (item: ContentItem) => courseMatches(item, ["ibdp", "ib", "international baccalaureate"]),
    },
  ];

  return definitions
    .map((definition) => ({
      ...definition,
      items: courses.filter(definition.matcher),
    }))
    .filter((group) => group.items.length > 0);
}

function courseMatches(item: ContentItem, keywords: string[]) {
  const haystack = `${item.title} ${item.subtitle} ${item.tags.join(" ")} ${item.courseDetails?.provider ?? ""}`.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function isInterdisciplinaryMajor(item: ContentItem) {
  const haystack = `${item.title} ${item.subtitle} ${item.tags.join(" ")} ${item.majorDetails?.recommendedBackground ?? ""}`.toLowerCase();
  return ["interdisciplinary", "sustainability", "policy", "design", "human", "environment"].some((keyword) =>
    haystack.includes(keyword)
  );
}

function sortSchoolCards(left: ContentItem, right: ContentItem) {
  const leftValue = extractRankingNumber(left.schoolDetails?.ranking);
  const rightValue = extractRankingNumber(right.schoolDetails?.ranking);
  return leftValue - rightValue || left.title.localeCompare(right.title);
}

function splitRanking(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);

  if (!match) {
    return {
      number: null,
      source: trimmed,
    };
  }

  return {
    number: match[1],
    source: match[2]?.trim() || null,
  };
}

function extractRankingNumber(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const match = value.match(/\d+(\.\d+)?/);
  if (!match) return Number.POSITIVE_INFINITY;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

function formatAcceptanceRate(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) return trimmed;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return trimmed;
  return parsed <= 1 ? `${(parsed * 100).toFixed(1).replace(/\.0$/, "")}%` : `${parsed}%`;
}

function difficultyLabel(
  difficulty: ContentItem["difficulty"],
  locale: "zh" | "en"
) {
  if (difficulty === "Reach") return pickText(locale, "Reach", "冲刺");
  if (difficulty === "Match") return pickText(locale, "Match", "匹配");
  return pickText(locale, "Safety", "保底");
}

function formatDuration(value: number | undefined, locale: "zh" | "en") {
  if (value == null) return null;
  return pickText(locale, `${value} weeks`, `${value} 周`);
}
