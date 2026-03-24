import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function ParentFinancesPlaceholder() {
  const session = await requireSession("parent");
  return (
    <RolePlaceholderPage
      session={session}
      role="parent"
      title="Finances"
      activeHref="/parent/finances"
      description="Payment-sensitive features are deferred, but the placeholder keeps the family-side information architecture intact and launch-safe."
    />
  );
}
