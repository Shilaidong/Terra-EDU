import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function StudentMessagesPlaceholder() {
  const session = await requireSession("student");
  return (
    <RolePlaceholderPage
      session={session}
      role="student"
      title="Messages"
      activeHref="/student/messages"
      description="The launch version already shows consultant notes and AI conversation traces. A fuller threaded message center can be layered in later without changing the surrounding layout."
    />
  );
}
