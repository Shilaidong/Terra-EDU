import { Database } from "lucide-react";

import { ContentFilterTable, ContentImportPanel, ContentItemComposer, LogoutButton } from "@/components/client-tools";
import { AuditFeed, HeroBadge, Notice, RoleShell, SectionCard, StatCard } from "@/components/terra-shell";
import { getContentItemsData, getRecentAuditLogsData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantContentPage() {
  const session = await requireSession("consultant");
  const [items, logs] = await Promise.all([getContentItemsData(), getRecentAuditLogsData(8)]);

  return (
    <RoleShell
      session={session}
      title="Content Management"
      subtitle="Maintain courses, chapters, competitions, schools, and majors using manual entry plus spreadsheet import."
      activeHref="/consultant/content"
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<Database className="h-4 w-4" />} title="Library size" value={`${items.length}`} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Published" value={`${items.filter((item) => item.status === "published").length}`} hint="Visible in student exploration." />
        <StatCard label="Draft" value={`${items.filter((item) => item.status === "draft").length}`} hint="Needs consultant review." tone="tertiary" />
        <StatCard label="Imported" value={`${items.filter((item) => item.source === "import").length}`} hint="Spreadsheet-synced records." tone="secondary" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Content table" eyebrow="Filterable">
          <ContentFilterTable items={items} />
        </SectionCard>

        <div className="space-y-8">
          <SectionCard title="Create item" eyebrow="Manual entry">
            <ContentItemComposer />
          </SectionCard>
          <SectionCard title="Bulk import" eyebrow="Excel & CSV">
            <ContentImportPanel />
            <div className="mt-4">
              <Notice title="Import behavior">
                Accepted columns: `type`, `title`, `subtitle`, `country`, `tags`, `difficulty`, `status`. Imported writes are audit logged automatically.
              </Notice>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-8">
        <SectionCard title="Recent activity & audit logs" eyebrow="Traceability">
          <AuditFeed logs={logs} />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
