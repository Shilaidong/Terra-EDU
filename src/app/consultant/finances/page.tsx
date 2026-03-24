import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantFinancesPlaceholder() {
  const session = await requireSession("consultant");
  return (
    <RolePlaceholderPage
      session={session}
      role="consultant"
      title="Finances"
      activeHref="/consultant/finances"
      description="Finance operations are intentionally deferred from the first launch. This page remains online as a clear and non-broken future extension point."
    />
  );
}
