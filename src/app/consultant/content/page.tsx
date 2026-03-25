import { Database } from "lucide-react";

import { ContentFilterTable, ContentImportPanel, ContentItemComposer, LogoutButton } from "@/components/client-tools";
import { AuditFeed, HeroBadge, Notice, RoleShell, SectionCard, StatCard } from "@/components/terra-shell";
import { getContentItemsData, getRecentAuditLogsData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantContentPage() {
  const locale = await getLocale();
  const session = await requireSession("consultant");
  const [items, logs] = await Promise.all([getContentItemsData(), getRecentAuditLogsData(8)]);

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Content Management", "内容管理")}
      subtitle={pickText(locale, "Maintain courses, chapters, competitions, schools, and majors using manual entry plus spreadsheet import.", "通过手动录入和表格导入来维护课程、章节、竞赛、学校和专业内容。")}
      activeHref="/consultant/content"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<Database className="h-4 w-4" />} title={pickText(locale, "Library size", "内容库规模")} value={`${items.length}`} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label={pickText(locale, "Published", "已发布")} value={`${items.filter((item) => item.status === "published").length}`} hint={pickText(locale, "Visible in student exploration.", "学生探索页可见。")} />
        <StatCard label={pickText(locale, "Draft", "草稿")} value={`${items.filter((item) => item.status === "draft").length}`} hint={pickText(locale, "Needs consultant review.", "需要顾问审核。")} tone="tertiary" />
        <StatCard label={pickText(locale, "Imported", "已导入")} value={`${items.filter((item) => item.source === "import").length}`} hint={pickText(locale, "Spreadsheet-synced records.", "通过表格同步导入的记录。")} tone="secondary" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title={pickText(locale, "Content table", "内容列表")} eyebrow={pickText(locale, "Filterable", "可筛选")}>
          <ContentFilterTable items={items} />
        </SectionCard>

        <div className="space-y-8">
          <SectionCard title={pickText(locale, "Create item", "创建内容")} eyebrow={pickText(locale, "Manual entry", "手动录入")}>
            <ContentItemComposer />
          </SectionCard>
          <SectionCard title={pickText(locale, "Bulk import", "批量导入")} eyebrow={pickText(locale, "Excel & CSV", "Excel 与 CSV")}>
            <ContentImportPanel />
            <div className="mt-4">
              <Notice title={pickText(locale, "Import behavior", "导入规则")}>
                {pickText(locale, "Accepted columns: `type`, `title`, `subtitle`, `country`, `tags`, `difficulty`, `status`. Imported writes are audit logged automatically.", "支持的列包括：`type`、`title`、`subtitle`、`country`、`tags`、`difficulty`、`status`。导入写入会自动记录审计日志。")}
              </Notice>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-8">
        <SectionCard title={pickText(locale, "Recent activity & audit logs", "最近活动与审计日志")} eyebrow={pickText(locale, "Traceability", "可追踪性")}>
          <AuditFeed logs={logs} />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
