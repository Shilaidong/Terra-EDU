import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function StudentDocumentsPlaceholder() {
  const session = await requireSession("student");
  return (
    <RolePlaceholderPage
      session={session}
      role="student"
      title="Documents"
      activeHref="/student/documents"
      description="Document operations are protected and visible as a launch placeholder. The current live flow still covers document-driven tasks on the dashboard and timeline."
    />
  );
}
