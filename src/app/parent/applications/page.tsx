import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function ParentApplicationsPlaceholder() {
  const session = await requireSession("parent");
  return (
    <RolePlaceholderPage
      session={session}
      role="parent"
      title="Applications"
      activeHref="/parent/applications"
      description="Parent-side applications is kept online as a read-only placeholder. It prevents broken navigation while the dedicated family review workflow is expanded later."
    />
  );
}
