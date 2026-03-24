import { Settings2 } from "lucide-react";

import { LogoutButton, ParentProfileEditor } from "@/components/client-tools";
import { HeroBadge, RoleShell, SectionCard, SummaryCard } from "@/components/terra-shell";
import { getCurrentUserData } from "@/lib/data";
import { requireSession } from "@/lib/server/guards";

export default async function ParentSettingsPage() {
  const session = await requireSession("parent");
  const user = await getCurrentUserData(session);

  if (!user) {
    return null;
  }

  return (
    <RoleShell
      session={session}
      title="Parent Settings"
      activeHref="/parent/settings"
      subtitle="Update the parent display name and avatar while keeping the family dashboard read-only."
      hero={
        <div className="flex items-center gap-3">
          <HeroBadge icon={<Settings2 className="h-4 w-4" />} title="Account type" value="Parent" />
          <LogoutButton />
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Account Preview" eyebrow="Live session">
          <div className="rounded-3xl bg-surface-container-low p-6">
            <img alt={user.name} src={user.avatar || session.avatar} className="h-28 w-28 rounded-full object-cover" />
            <h2 className="mt-5 font-serif text-3xl font-bold text-foreground">{user.name}</h2>
            <p className="mt-2 text-sm text-secondary">{user.email}</p>
            <div className="mt-4 inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              Parent account
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Profile Basics" eyebrow="Editable">
          <ParentProfileEditor userId={user.id} defaultName={user.name} defaultAvatar={user.avatar || session.avatar || ""} />
        </SectionCard>
      </div>

      <div className="mt-8">
        <SectionCard title="Parent Access" eyebrow="Read-only guidance">
          <SummaryCard
            title="Clear family visibility, without extra admin work"
            body="Parents can personalize their own account details here, while student planning, tasks, check-ins, and milestones remain protected in the student workflow."
            footer="This keeps the parent role lightweight and aligned with the dashboard design."
          />
        </SectionCard>
      </div>
    </RoleShell>
  );
}
