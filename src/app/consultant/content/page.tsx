import { Database } from "lucide-react";

import { ContentCategoryTables, ContentImportPanel, ContentItemComposer, LogoutButton } from "@/components/client-tools";
import { HeroBadge, Notice, RoleShell, SectionCard, StatCard } from "@/components/terra-shell";
import { getContentItemsData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantContentPage() {
  const locale = await getLocale();
  const session = await requireSession("consultant");
  const items = await getContentItemsData();

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Content Management", "内容管理")}
      subtitle={pickText(locale, "Maintain courses, chapters, competitions, schools, and majors using manual entry plus spreadsheet import.", "通过手动录入和表格导入来维护课程、章节、竞赛、学校和专业内容。")}
      activeHref="/consultant/content"
      hero={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <HeroBadge icon={<Database className="h-4 w-4" />} title={pickText(locale, "Library size", "内容库规模")} value={`${items.length}`} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        <StatCard label={pickText(locale, "Published", "已发布")} value={`${items.filter((item) => item.status === "published").length}`} hint={pickText(locale, "Visible in student exploration.", "学生探索页可见。")} />
        <StatCard label={pickText(locale, "Manual", "手动录入")} value={`${items.filter((item) => item.source === "manual").length}`} hint={pickText(locale, "Created and published right away.", "创建后立即发布。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Imported", "已导入")} value={`${items.filter((item) => item.source === "import").length}`} hint={pickText(locale, "Spreadsheet-synced records.", "通过表格同步导入的记录。")} tone="secondary" />
      </div>

      <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
        <SectionCard title={pickText(locale, "Content library", "内容列表")} eyebrow={pickText(locale, "By category", "按类型分表")}>
          <ContentCategoryTables items={items} />
        </SectionCard>

        <SectionCard title={pickText(locale, "Create item", "创建内容")} eyebrow={pickText(locale, "Manual entry", "手动录入")}>
          <ContentItemComposer />
        </SectionCard>

        <SectionCard title={pickText(locale, "Bulk import", "批量导入")} eyebrow={pickText(locale, "Excel & CSV", "Excel 与 CSV")}>
          <ContentImportPanel />
          <div className="mt-3 sm:mt-4">
            <Notice title={pickText(locale, "Import behavior", "导入规则")}>
              {pickText(locale, "Accepted common columns: `type`, `title`, `subtitle`, `country`, `tags`, `difficulty`. Manual entries and imports publish immediately. Type-specific columns are also supported, including school ranking and city, major degree and career paths, competition organizer and award, course provider and format, plus chapter sequence and key skill. For school imports, prefer the dedicated school template and write rankings like `1 UsNews` or `2 QS`.", "公共列支持：`type`、`title`、`subtitle`、`country`、`tags`、`difficulty`。手动创建和导入都会直接发布。同时支持类型专属列，例如学校的排名和城市、专业的学位和就业方向、竞赛的主办方和奖项、课程的提供方和形式，以及章节的顺序和核心能力。学校导入建议优先使用学校专用模板，排名推荐写成 `1 UsNews` 或 `2 QS` 这样的格式。")}
            </Notice>
          </div>
        </SectionCard>
      </div>
    </RoleShell>
  );
}
