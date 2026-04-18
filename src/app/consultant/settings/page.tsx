import { Settings2 } from "lucide-react";

import { ConsultantProfileEditor, LogoutButton, PasswordChangeForm } from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard, SummaryCard } from "@/components/terra-shell";
import { getCurrentUserData } from "@/lib/data";
import { pickText } from "@/lib/locale";
import { getLocale } from "@/lib/locale-server";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantSettingsPage() {
  const locale = await getLocale();
  const session = await requireSession("consultant");
  const user = await getCurrentUserData(session);

  if (!user) {
    return null;
  }

  return (
    <RoleShell
      session={session}
      title={pickText(locale, "Consultant Settings", "顾问设置")}
      activeHref="/consultant/settings"
      subtitle={pickText(locale, "Update your consultant profile, avatar, and password while keeping student workspaces unchanged.", "你可以在这里修改顾问资料、头像和密码，不会影响学生工作台数据。")}
      hero={
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <HeroBadge icon={<Settings2 className="h-4 w-4" />} title={pickText(locale, "Account type", "账号类型")} value={pickText(locale, "Consultant", "顾问")} />
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
              {pickText(locale, "Consultant account", "顾问账号")}
            </div>
          </div>
        </SectionCard>

        <SectionCard title={pickText(locale, "Profile Basics", "基础资料")} eyebrow={pickText(locale, "Editable", "可编辑")}>
          <ConsultantProfileEditor userId={user.id} defaultName={user.name} defaultAvatar={user.avatar || session.avatar || ""} />
        </SectionCard>
      </div>

      <div className="mt-6 sm:mt-8">
        <SectionCard title={pickText(locale, "Password & Access", "密码与访问")} eyebrow={pickText(locale, "Security", "安全设置")}>
          <PasswordChangeForm
            title={pickText(locale, "Change your password", "修改你的密码")}
            description={pickText(locale, "Use your current password to set a new one. This only changes login access and does not affect any assigned student data.", "输入当前密码后设置新密码。这只会影响登录访问，不会影响任何已分配的学生数据。")}
          />
        </SectionCard>
      </div>

      <div className="mt-6 sm:mt-8">
        <SectionCard title={pickText(locale, "Consultant Access", "顾问权限说明")} eyebrow={pickText(locale, "Workspace rules", "工作台规则")}>
          <SummaryCard
            title={pickText(locale, "Profile changes are separate from student work", "账号修改与学生工作是分开的")}
            body={pickText(locale, "You can safely update your own display name, avatar, and password here. Student profiles, planning books, notes, and bindings stay exactly where they are.", "你可以放心在这里修改自己的显示名称、头像和密码。学生档案、规划书、备注和绑定关系都不会因此变化。")}
            footer={pickText(locale, "This keeps account maintenance light while the student workspace remains stable.", "这样既能让账号维护更轻量，也能保持学生工作台稳定。")}
          />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
