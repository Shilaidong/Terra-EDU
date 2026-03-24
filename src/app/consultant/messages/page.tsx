import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantMessagesPlaceholder() {
  const session = await requireSession("consultant");
  return (
    <RolePlaceholderPage
      session={session}
      role="consultant"
      title="Messages"
      activeHref="/consultant/messages"
      description="The launch build already exposes notes, AI outputs, and audit logs. This placeholder keeps a stable route for the richer consultant communication center later."
    />
  );
}
