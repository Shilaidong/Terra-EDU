import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function ConsultantDocumentsPlaceholder() {
  const session = await requireSession("consultant");
  return (
    <RolePlaceholderPage
      session={session}
      role="consultant"
      title="Documents"
      activeHref="/consultant/documents"
      description="Document center stays live as a non-empty placeholder so consultants can navigate safely while the dedicated document review workflow is scoped next."
    />
  );
}
