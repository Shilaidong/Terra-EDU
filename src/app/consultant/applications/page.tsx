import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantApplicationsPlaceholder() {
  const session = await requireSession("consultant");
  return (
    <RolePlaceholderPage
      session={session}
      role="consultant"
      title="Applications"
      activeHref="/consultant/applications"
      description="The consultant-facing applications workspace is queued as a next slice. For launch, this route stays available and points users back to the already-live cohort, content, and analytics workflows."
    />
  );
}
