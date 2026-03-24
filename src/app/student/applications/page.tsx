import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function StudentApplicationsPlaceholder() {
  const session = await requireSession("student");
  return (
    <RolePlaceholderPage
      session={session}
      role="student"
      title="Applications"
      activeHref="/student/applications"
      description="This page is intentionally live as a launch-safe placeholder. It keeps navigation complete today while the deeper student application workspace is added in a follow-up release."
    />
  );
}
