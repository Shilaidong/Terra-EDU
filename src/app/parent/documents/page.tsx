import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function ParentDocumentsPlaceholder() {
  const session = await requireSession("parent");
  return (
    <RolePlaceholderPage
      session={session}
      role="parent"
      title="Documents"
      activeHref="/parent/documents"
      description="Document visibility for parents will evolve in a later release. The current launch intentionally keeps this route live and clearly labeled instead of hiding it."
    />
  );
}
