import { RolePlaceholderPage } from "@/components/placeholder-page";
import { requireSession } from "@/lib/server/guards";

export default async function StudentSupportPlaceholder() {
  const session = await requireSession("student");
  return (
    <RolePlaceholderPage
      session={session}
      role="student"
      title="Support"
      activeHref="/student/support"
      description="Support remains visible as part of the launch-safe navigation strategy. Right now, audit logs and trace ids already make future troubleshooting much faster."
    />
  );
}
