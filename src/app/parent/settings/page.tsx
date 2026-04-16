import { Settings2 } from "lucide-react";

import { LogoutButton, ParentProfileEditor } from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard, SummaryCard } from "@/components/terra-shell";
import { getCurrentUserData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function ParentSettingsPage() {
  const locale = await getLocale();
  const session = await requireSession("parent");
  const user = await getCurrentUserData(session);

  if (!user) {
    return null;
  }

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Parent Settings", "家长设置")}
      activeHref="/parent/settings"
      subtitle={pickText(locale, "Update the parent display name and avatar while keeping the family dashboard read-only.", "你可以修改家长名称和头像，同时保持家长仪表盘为只读模式。")}
      hero={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <HeroBadge icon={<Settings2 className="h-4 w-4" />} title={pickText(locale, "Account type", "账号类型")} value={pickText(locale, "Parent", "家长")} />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-6 sm:gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
        <SectionCard title={pickText(locale, "Account Preview", "账号预览")} eyebrow={pickText(locale, "Live session", "当前会话")}>
          <div className="rounded-3xl bg-surface-container-low p-4 sm:p-5 lg:p-6">
            <img alt={user.name} src={user.avatar || session.avatar} className="h-24 w-24 rounded-full object-cover sm:h-28 sm:w-28" />
            <h2 className="mt-4 font-serif text-[1.9rem] font-bold text-foreground sm:mt-5 sm:text-3xl">{user.name}</h2>
            <p className="mt-2 text-xs text-secondary sm:text-sm">{user.email}</p>
            <div className="mt-4 inline-flex rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary sm:text-sm">
              {pickText(locale, "Parent account", "家长账号")}
            </div>
          </div>
        </SectionCard>

        <SectionCard title={pickText(locale, "Profile Basics", "基础资料")} eyebrow={pickText(locale, "Editable", "可编辑")}>
          <ParentProfileEditor userId={user.id} defaultName={user.name} defaultAvatar={user.avatar || session.avatar || ""} />
        </SectionCard>
      </div>

      <div className="mt-6 sm:mt-8">
        <SectionCard title={pickText(locale, "Parent Access", "家长权限说明")} eyebrow={pickText(locale, "Read-only guidance", "只读说明")}>
          <SummaryCard
            title={pickText(locale, "Clear family visibility, without extra admin work", "清晰查看孩子进展，而不增加额外管理负担")}
            body={pickText(locale, "Parents can personalize their own account details here, while student planning, tasks, check-ins, and milestones remain protected in the student workflow.", "家长可以在这里调整自己的账号资料，但学生的规划、任务、打卡和截止日期仍然由学生端维护。")}
            footer={pickText(locale, "This keeps the parent role lightweight and aligned with the dashboard design.", "这样能让家长角色保持轻量，也和当前仪表盘定位一致。")}
          />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
