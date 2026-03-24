import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function ParentSettingsPlaceholder() {
  const session = await requireSession("parent");
  return (
    <RolePlaceholderPage
      session={session}
      role="parent"
      title="Settings"
      activeHref="/parent/settings"
      description="Parent notification and account settings can be added here later. The current launch preserves route stability for future iterations."
    />
  );
}
