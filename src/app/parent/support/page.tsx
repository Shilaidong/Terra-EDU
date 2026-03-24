import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function ParentSupportPlaceholder() {
  const session = await requireSession("parent");
  return (
    <RolePlaceholderPage
      session={session}
      role="parent"
      title="Support"
      activeHref="/parent/support"
      description="Support remains visible to avoid dead links and to give a stable place for future FAQ, issue submission, and trace-guided troubleshooting."
    />
  );
}
