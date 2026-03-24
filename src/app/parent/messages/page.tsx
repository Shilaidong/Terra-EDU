import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function ParentMessagesPlaceholder() {
  const session = await requireSession("parent");
  return (
    <RolePlaceholderPage
      session={session}
      role="parent"
      title="Messages"
      activeHref="/parent/messages"
      description="Parents already receive consultant updates through the dashboard. This route stays live as the future dedicated communication center."
    />
  );
}
